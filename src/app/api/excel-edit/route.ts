import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { applyModification } from '@/lib/excel-modifier';
import { generateExcelReport } from '@/lib/excel-engine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileId, command, action } = body;

    if (!fileId) {
      return NextResponse.json({ success: false, error: 'Aucun fichier sélectionné' });
    }

    const file = store.getFile(fileId);
    if (!file || !file.agents || file.agents.length === 0) {
      return NextResponse.json({ success: false, error: 'Fichier non trouvé ou sans données' });
    }

    // Export action
    if (action === 'export') {
      const buffer = generateExcelReport(file.agents, { includeStats: true });
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="IA_Work_Modified_${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      });
    }

    // Apply modification command
    if (!command) {
      return NextResponse.json({ success: false, error: 'Aucune commande spécifiée' });
    }

    const result = applyModification(command, file.agents);

    if (result.success) {
      // Update stored agents via public API
      store.updateFile(fileId, { agents: result.agents });
    }

    return NextResponse.json({
      success: result.success,
      description: result.description,
      changes: result.changes,
      agentCount: result.agents.length,
      agents: result.agents.slice(0, 50),
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Erreur lors du traitement' }, { status: 500 });
  }
}
