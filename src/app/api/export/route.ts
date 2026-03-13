import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { store } from '@/lib/store';
import { generateExcelReport } from '@/lib/excel-engine';
import { cleanAndOptimize } from '@/lib/analyzer';

export async function POST(request: NextRequest) {
  try {
    const { fileId, options = {} } = await request.json();

    let agents;
    let fileName = 'CCC_IA_Export';

    if (fileId) {
      const file = store.getFile(fileId);
      if (!file) {
        return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
      }
      agents = file.agents || [];
      fileName = file.name.replace(/\.[^.]+$/, '');
    } else {
      agents = store.getAllAgentsFromFiles();
    }

    if (agents.length === 0) {
      return NextResponse.json({ error: 'Aucune donnée à exporter' }, { status: 400 });
    }

    // Clean data if requested
    if (options.clean) {
      const { cleaned, changes } = cleanAndOptimize(agents);
      agents = cleaned;

      store.addAnalysis({
        id: uuidv4(),
        fileId: fileId || 'global',
        fileName: `${fileName}.xlsx`,
        date: new Date().toISOString(),
        type: 'cleaning',
        description: `Nettoyage et optimisation: ${changes.length} corrections appliquées`,
        result: changes.slice(0, 10).join('; '),
      });
    }

    // Generate Excel
    const buffer = generateExcelReport(agents, {
      includeStats: options.includeStats !== false,
      includePivot: options.includePivot || false,
      pivotConfig: options.pivotConfig,
      autoFilter: true,
      cleanDuplicates: options.clean || false,
    });

    // Log the export
    store.addAnalysis({
      id: uuidv4(),
      fileId: fileId || 'global',
      fileName: `${fileName}_export.xlsx`,
      date: new Date().toISOString(),
      type: 'export',
      description: `Export Excel: ${agents.length} agents`,
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}_CCC_IA.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: "Erreur lors de l'export" }, { status: 500 });
  }
}
