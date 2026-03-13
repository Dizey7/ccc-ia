import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { store } from '@/lib/store';
import { analyzeData } from '@/lib/analyzer';
import { parseExcelFile, parseCSVData } from '@/lib/excel-engine';
import { UploadedFile } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const fileId = uuidv4();
    const fileName = file.name;
    const fileType = getFileType(fileName);

    if (!fileType) {
      return NextResponse.json({ error: 'Type de fichier non supporté. Utilisez PDF, Excel ou CSV.' }, { status: 400 });
    }

    // Create initial file record
    const uploadedFile: UploadedFile = {
      id: fileId,
      name: fileName,
      type: fileType,
      size: file.size,
      uploadDate: new Date().toISOString(),
      status: 'processing',
    };
    store.addFile(uploadedFile);

    // Process file based on type
    const buffer = Buffer.from(await file.arrayBuffer());

    let rawData: Record<string, unknown>[] = [];
    let columns: string[] = [];

    if (fileType === 'excel') {
      const result = parseExcelFile(buffer);
      rawData = result.data;
      columns = result.columns;
    } else if (fileType === 'csv') {
      const text = buffer.toString('utf-8');
      const result = parseCSVData(text);
      rawData = result.data;
      columns = result.columns;
    } else if (fileType === 'pdf') {
      // Basic PDF text extraction - extract readable text
      const text = extractTextFromPDF(buffer);
      const result = parsePDFText(text);
      rawData = result.data;
      columns = result.columns;
    }

    // Analyze the data
    const { agents, summary } = analyzeData(rawData, columns);

    // Update file with results
    store.updateFile(fileId, {
      status: 'completed',
      rawData,
      columns,
      agents,
      agentCount: agents.length,
      summary,
    });

    // Add to analysis history
    store.addAnalysis({
      id: uuidv4(),
      fileId,
      fileName,
      date: new Date().toISOString(),
      type: 'import',
      description: `Import et analyse de ${fileName}: ${agents.length} agents détectés`,
      result: `${agents.length} agents, ${summary.duplicates} doublons supprimés, ${summary.errors.length} erreurs, ${summary.anomalies.length} anomalies`,
    });

    // Generate alerts if needed
    if (summary.duplicates > 0) {
      store.addAlert({
        id: uuidv4(),
        type: 'warning',
        title: 'Doublons détectés',
        message: `${summary.duplicates} doublons trouvés dans ${fileName}`,
        date: new Date().toISOString(),
        read: false,
        category: 'file',
      });
    }
    if (summary.errors.length > 0) {
      store.addAlert({
        id: uuidv4(),
        type: 'error',
        title: 'Erreurs dans le fichier',
        message: `${summary.errors.length} erreurs détectées dans ${fileName}`,
        date: new Date().toISOString(),
        read: false,
        category: 'file',
      });
    }
    if (summary.anomalies.length > 0) {
      store.addAlert({
        id: uuidv4(),
        type: 'info',
        title: 'Anomalies détectées',
        message: `${summary.anomalies.length} anomalies signalées dans ${fileName}`,
        date: new Date().toISOString(),
        read: false,
        category: 'file',
      });
    }

    return NextResponse.json({
      success: true,
      file: {
        id: fileId,
        name: fileName,
        type: fileType,
        agentCount: agents.length,
        columns,
        summary,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Erreur lors du traitement du fichier' }, { status: 500 });
  }
}

function getFileType(filename: string): 'pdf' | 'excel' | 'csv' | null {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'pdf';
  if (['xlsx', 'xls', 'xlsm'].includes(ext || '')) return 'excel';
  if (['csv', 'tsv', 'txt'].includes(ext || '')) return 'csv';
  return null;
}

function extractTextFromPDF(buffer: Buffer): string {
  // Simple PDF text extraction - looks for text between BT/ET markers
  const text = buffer.toString('latin1');
  const lines: string[] = [];

  // Extract text from PDF stream objects
  const textPattern = /\(([^)]+)\)/g;
  let match;
  while ((match = textPattern.exec(text)) !== null) {
    const decoded = match[1].replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\\\\/g, '\\');
    if (decoded.trim() && decoded.length > 1 && !/^[0-9.]+$/.test(decoded.trim())) {
      lines.push(decoded.trim());
    }
  }

  // Also try to find readable ASCII text
  const readablePattern = /[\w\s@.\-,()+éèêëàâäùûüôöîïçÉÈÊËÀÂÄÙÛÜÔÖÎÏÇ]{5,}/g;
  while ((match = readablePattern.exec(text)) !== null) {
    const cleaned = match[0].trim();
    if (cleaned.length > 3 && !lines.includes(cleaned)) {
      lines.push(cleaned);
    }
  }

  return lines.join('\n');
}

function parsePDFText(text: string): { data: Record<string, unknown>[]; columns: string[] } {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return { data: [], columns: ['Contenu'] };

  // Try to detect tabular data
  const data: Record<string, unknown>[] = [];
  const potentialHeaders = lines[0].split(/\s{2,}|\t/).filter(Boolean);

  if (potentialHeaders.length >= 2) {
    const columns = potentialHeaders;
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/\s{2,}|\t/).filter(Boolean);
      if (values.length >= 2) {
        const row: Record<string, unknown> = {};
        columns.forEach((col, j) => {
          row[col] = values[j] || '';
        });
        data.push(row);
      }
    }
    if (data.length > 0) return { data, columns };
  }

  // Fallback: treat each line as a data entry
  return {
    data: lines.map(l => ({ 'Contenu': l })),
    columns: ['Contenu'],
  };
}
