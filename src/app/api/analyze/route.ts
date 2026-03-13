import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { store } from '@/lib/store';
import { cleanAndOptimize } from '@/lib/analyzer';

export async function POST(request: NextRequest) {
  try {
    const { fileId, action } = await request.json();

    if (!fileId) {
      return NextResponse.json({ error: 'ID de fichier requis' }, { status: 400 });
    }

    const file = store.getFile(fileId);
    if (!file) {
      return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
    }

    if (!file.agents || file.agents.length === 0) {
      return NextResponse.json({ error: 'Aucune donnée à analyser' }, { status: 400 });
    }

    switch (action) {
      case 'clean': {
        const { cleaned, changes } = cleanAndOptimize(file.agents);
        store.updateFile(fileId, { agents: cleaned });

        store.addAnalysis({
          id: uuidv4(),
          fileId,
          fileName: file.name,
          date: new Date().toISOString(),
          type: 'cleaning',
          description: `Nettoyage: ${changes.length} corrections appliquées`,
          result: changes.slice(0, 5).join('; '),
        });

        store.addAlert({
          id: uuidv4(),
          type: 'success',
          title: 'Nettoyage terminé',
          message: `${changes.length} corrections appliquées à ${file.name}`,
          date: new Date().toISOString(),
          read: false,
          category: 'file',
        });

        return NextResponse.json({ success: true, changes, agentCount: cleaned.length });
      }

      case 'stats': {
        const agents = file.agents;
        const formations: Record<string, number> = {};
        const niveaux: Record<string, number> = {};
        const sites: Record<string, number> = {};
        let totalHours = 0;

        agents.forEach(a => {
          a.formations?.forEach(f => { formations[f] = (formations[f] || 0) + 1; });
          if (a.niveau) niveaux[a.niveau] = (niveaux[a.niveau] || 0) + 1;
          if (a.site) sites[a.site] = (sites[a.site] || 0) + 1;
          totalHours += a.heuresTravaillees || 0;
        });

        return NextResponse.json({
          totalAgents: agents.length,
          formations,
          niveaux,
          sites,
          totalHours,
          avgHours: agents.length > 0 ? totalHours / agents.length : 0,
        });
      }

      case 'anomalies': {
        const anomalies: string[] = [];
        file.agents.forEach(a => {
          if (!a.telephone) anomalies.push(`${a.prenom} ${a.nom}: téléphone manquant`);
          if (!a.niveau || a.niveau === 'Non spécifié') anomalies.push(`${a.prenom} ${a.nom}: niveau non spécifié`);
          if (!a.formations || a.formations.length === 0) anomalies.push(`${a.prenom} ${a.nom}: aucune formation`);
          if (a.email && !a.email.includes('@')) anomalies.push(`${a.prenom} ${a.nom}: email invalide`);
        });

        return NextResponse.json({ anomalies, count: anomalies.length });
      }

      default:
        return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
    }
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json({ error: "Erreur lors de l'analyse" }, { status: 500 });
  }
}

export async function GET() {
  const files = store.getAllFiles();
  const history = store.getAnalysisHistory();
  const alerts = store.getAlerts();
  const stats = store.getStats();

  return NextResponse.json({
    files: files.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      size: f.size,
      uploadDate: f.uploadDate,
      status: f.status,
      agentCount: f.agentCount,
      columns: f.columns,
      summary: f.summary,
    })),
    history,
    alerts,
    stats,
  });
}
