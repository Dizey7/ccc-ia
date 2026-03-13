import * as XLSX from 'xlsx';
import { Agent } from '@/types';

export interface PivotTableConfig {
  rowField: string;
  colField?: string;
  valueField: string;
  aggregation: 'count' | 'sum' | 'average';
}

export interface ExcelExportOptions {
  includeStats?: boolean;
  includeCharts?: boolean;
  includePivot?: boolean;
  pivotConfig?: PivotTableConfig;
  autoFilter?: boolean;
  cleanDuplicates?: boolean;
}

export function parseExcelFile(buffer: Buffer): { data: Record<string, unknown>[]; columns: string[]; sheetNames: string[] } {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetNames = workbook.SheetNames;
  const firstSheet = workbook.Sheets[sheetNames[0]];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });
  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  return { data, columns, sheetNames };
}

export function parseCSVData(text: string): { data: Record<string, unknown>[]; columns: string[] } {
  // Detect separator
  const firstLine = text.split('\n')[0];
  const separator = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return { data: [], columns: [] };

  const columns = lines[0].split(separator).map(c => c.trim().replace(/^["']|["']$/g, ''));
  const data: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/^["']|["']$/g, ''));
    const row: Record<string, unknown> = {};
    columns.forEach((col, j) => {
      row[col] = values[j] || '';
    });
    data.push(row);
  }

  return { data, columns };
}

export function generateExcelReport(agents: Agent[], options: ExcelExportOptions = {}): Buffer {
  const workbook = XLSX.utils.book_new();

  // Main agents sheet
  const agentData = agents.map(a => ({
    'Nom': a.nom,
    'Prénom': a.prenom,
    'Téléphone': a.telephone || '',
    'Email': a.email || '',
    'Permis': a.permis || '',
    'Niveau': a.niveau || '',
    'Formations': a.formations?.join(', ') || '',
    'Certifications': a.certifications?.join(', ') || '',
    'Disponibilité': a.disponibilite || '',
    'Statut': a.statut || '',
    'Heures travaillées': a.heuresTravaillees || 0,
    'Site': a.site || '',
    'Notes': a.notes || '',
  }));

  const mainSheet = XLSX.utils.json_to_sheet(agentData);

  // Set column widths
  mainSheet['!cols'] = [
    { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 25 },
    { wch: 15 }, { wch: 12 }, { wch: 30 }, { wch: 25 },
    { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 25 },
  ];

  // Auto filter
  if (options.autoFilter !== false) {
    mainSheet['!autofilter'] = { ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: agentData.length, c: Object.keys(agentData[0] || {}).length - 1 }
    })};
  }

  XLSX.utils.book_append_sheet(workbook, mainSheet, 'Agents');

  // Statistics sheet
  if (options.includeStats !== false) {
    const formations: Record<string, number> = {};
    const niveaux: Record<string, number> = {};
    const sites: Record<string, number> = {};

    agents.forEach(a => {
      a.formations?.forEach(f => { formations[f] = (formations[f] || 0) + 1; });
      if (a.niveau) niveaux[a.niveau] = (niveaux[a.niveau] || 0) + 1;
      if (a.site) sites[a.site] = (sites[a.site] || 0) + 1;
    });

    const statsData = [
      { 'Catégorie': 'RÉSUMÉ GÉNÉRAL', 'Détail': '', 'Valeur': '' },
      { 'Catégorie': 'Total agents', 'Détail': '', 'Valeur': agents.length },
      { 'Catégorie': '', 'Détail': '', 'Valeur': '' },
      { 'Catégorie': 'FORMATIONS', 'Détail': '', 'Valeur': '' },
      ...Object.entries(formations).sort((a, b) => b[1] - a[1]).map(([f, c]) => ({
        'Catégorie': '', 'Détail': f, 'Valeur': c
      })),
      { 'Catégorie': '', 'Détail': '', 'Valeur': '' },
      { 'Catégorie': 'NIVEAUX', 'Détail': '', 'Valeur': '' },
      ...Object.entries(niveaux).sort((a, b) => b[1] - a[1]).map(([n, c]) => ({
        'Catégorie': '', 'Détail': n, 'Valeur': c
      })),
      { 'Catégorie': '', 'Détail': '', 'Valeur': '' },
      { 'Catégorie': 'SITES', 'Détail': '', 'Valeur': '' },
      ...Object.entries(sites).sort((a, b) => b[1] - a[1]).map(([s, c]) => ({
        'Catégorie': '', 'Détail': s, 'Valeur': c
      })),
    ];

    const statsSheet = XLSX.utils.json_to_sheet(statsData);
    statsSheet['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistiques');
  }

  // Pivot table sheet
  if (options.includePivot && options.pivotConfig) {
    const pivotData = generatePivotTable(agents, options.pivotConfig);
    const pivotSheet = XLSX.utils.json_to_sheet(pivotData);
    XLSX.utils.book_append_sheet(workbook, pivotSheet, 'Tableau Croisé');
  }

  // Hours report sheet
  const agentsWithHours = agents.filter(a => a.heuresTravaillees && a.heuresTravaillees > 0);
  if (agentsWithHours.length > 0) {
    const hoursData = agentsWithHours
      .sort((a, b) => (b.heuresTravaillees || 0) - (a.heuresTravaillees || 0))
      .map(a => ({
        'Agent': `${a.prenom} ${a.nom}`,
        'Heures': a.heuresTravaillees || 0,
        'Site': a.site || '',
        'Niveau': a.niveau || '',
      }));

    const totalHours = agentsWithHours.reduce((s, a) => s + (a.heuresTravaillees || 0), 0);
    hoursData.push({
      'Agent': 'TOTAL',
      'Heures': totalHours,
      'Site': '',
      'Niveau': '',
    });

    const hoursSheet = XLSX.utils.json_to_sheet(hoursData);
    hoursSheet['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 20 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, hoursSheet, 'Heures Travaillées');
  }

  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.from(buf);
}

function generatePivotTable(agents: Agent[], config: PivotTableConfig): Record<string, unknown>[] {
  const { rowField, valueField, aggregation } = config;
  const groups: Record<string, unknown[]> = {};

  agents.forEach(a => {
    const key = getAgentField(a, rowField);
    if (!groups[key]) groups[key] = [];
    groups[key].push(getAgentField(a, valueField));
  });

  return Object.entries(groups).map(([key, values]) => {
    let result: number;
    switch (aggregation) {
      case 'count':
        result = values.length;
        break;
      case 'sum':
        result = values.reduce((s: number, v) => s + (Number(v) || 0), 0);
        break;
      case 'average':
        result = values.reduce((s: number, v) => s + (Number(v) || 0), 0) / values.length;
        break;
    }
    return { [rowField]: key, [aggregation]: result };
  });
}

function getAgentField(agent: Agent, field: string): string {
  const val = agent[field as keyof Agent];
  if (Array.isArray(val)) return val.join(', ');
  return String(val ?? 'N/A');
}
