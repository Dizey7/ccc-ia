import { Agent, ChatResponseData } from '@/types';

interface QueryResult {
  response: string;
  data?: ChatResponseData;
}

export function processQuery(query: string, agents: Agent[]): QueryResult {
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Count total agents
  if (matchesPattern(q, ['combien', 'total', 'nombre']) && matchesPattern(q, ['agent', 'personne', 'employe'])) {
    if (matchesPattern(q, ['dvaf']) && matchesPattern(q, ['niveau 2', 'niv 2', 'n2'])) {
      const filtered = agents.filter(a =>
        a.formations?.some(f => f.toUpperCase().includes('DVAF')) &&
        a.niveau?.includes('2')
      );
      return {
        response: `Il y a **${filtered.length}** agents qui ont à la fois la formation DVAF et le Niveau 2.`,
        data: { type: 'table', agents: filtered, count: filtered.length, columns: ['nom', 'prenom', 'formations', 'niveau'] }
      };
    }

    if (matchesPattern(q, ['dvaf'])) {
      const filtered = agents.filter(a => a.formations?.some(f => f.toUpperCase().includes('DVAF')));
      return {
        response: `Il y a **${filtered.length}** agents avec la formation DVAF.`,
        data: { type: 'table', agents: filtered, count: filtered.length, columns: ['nom', 'prenom', 'formations'] }
      };
    }

    if (matchesPattern(q, ['niveau 2', 'niv 2', 'n2'])) {
      const filtered = agents.filter(a => a.niveau?.includes('2'));
      return {
        response: `Il y a **${filtered.length}** agents de Niveau 2.`,
        data: { type: 'table', agents: filtered, count: filtered.length, columns: ['nom', 'prenom', 'niveau'] }
      };
    }

    if (matchesPattern(q, ['niveau 1', 'niv 1', 'n1'])) {
      const filtered = agents.filter(a => a.niveau?.includes('1'));
      return {
        response: `Il y a **${filtered.length}** agents de Niveau 1.`,
        data: { type: 'table', agents: filtered, count: filtered.length, columns: ['nom', 'prenom', 'niveau'] }
      };
    }

    if (matchesPattern(q, ['niveau 3', 'niv 3', 'n3'])) {
      const filtered = agents.filter(a => a.niveau?.includes('3'));
      return {
        response: `Il y a **${filtered.length}** agents de Niveau 3.`,
        data: { type: 'table', agents: filtered, count: filtered.length, columns: ['nom', 'prenom', 'niveau'] }
      };
    }

    if (matchesPattern(q, ['disponible', 'dispo'])) {
      const filtered = agents.filter(a =>
        a.disponibilite?.toLowerCase().includes('disponible') ||
        a.disponibilite?.toLowerCase().includes('oui') ||
        a.statut?.toLowerCase().includes('actif')
      );
      return {
        response: `Il y a **${filtered.length}** agents disponibles.`,
        data: { type: 'table', agents: filtered, count: filtered.length, columns: ['nom', 'prenom', 'disponibilite', 'statut'] }
      };
    }

    if (matchesPattern(q, ['permis'])) {
      const filtered = agents.filter(a => a.permis && a.permis.trim() !== '');
      return {
        response: `Il y a **${filtered.length}** agents avec un permis.`,
        data: { type: 'table', agents: filtered, count: filtered.length, columns: ['nom', 'prenom', 'permis'] }
      };
    }

    // General count
    return {
      response: `Il y a **${agents.length}** agents au total dans la liste.`,
      data: { type: 'count', count: agents.length }
    };
  }

  // Show/list agents with specific criteria
  if (matchesPattern(q, ['montre', 'affiche', 'liste', 'voir', 'donne', 'trouve', 'cherche', 'qui'])) {
    // Formation-based search
    for (const formation of ['DVAF', 'RCR', 'PDSB', 'SIMDUT', 'BSP', 'OMEGA', 'ASP', 'SECOURISME', 'PREMIERS SOINS']) {
      if (q.includes(formation.toLowerCase())) {
        const filtered = agents.filter(a => a.formations?.some(f => f.toUpperCase().includes(formation)));
        return {
          response: `Voici les **${filtered.length}** agents avec la formation ${formation} :`,
          data: { type: 'table', agents: filtered, count: filtered.length, columns: ['nom', 'prenom', 'formations', 'niveau', 'disponibilite'] }
        };
      }
    }

    // Niveau-based search
    for (const niv of ['1', '2', '3']) {
      if (q.includes(`niveau ${niv}`) || q.includes(`niv ${niv}`) || q.includes(`n${niv}`)) {
        const filtered = agents.filter(a => a.niveau?.includes(niv));
        return {
          response: `Voici les **${filtered.length}** agents de Niveau ${niv} :`,
          data: { type: 'table', agents: filtered, count: filtered.length, columns: ['nom', 'prenom', 'niveau', 'formations', 'disponibilite'] }
        };
      }
    }

    // Site-based search
    if (matchesPattern(q, ['site', 'poste', 'affecte', 'emplacement'])) {
      const sites: Record<string, number> = {};
      agents.forEach(a => {
        if (a.site) sites[a.site] = (sites[a.site] || 0) + 1;
      });
      return {
        response: `Répartition par site :\n${Object.entries(sites).map(([s, c]) => `- **${s}**: ${c} agents`).join('\n')}`,
        data: { type: 'list', stats: sites }
      };
    }

    // Name search
    const nameMatch = q.match(/(?:agent|nom|appel[eé])\s+(\w+)/);
    if (nameMatch) {
      const searchName = nameMatch[1].toLowerCase();
      const filtered = agents.filter(a =>
        a.nom.toLowerCase().includes(searchName) ||
        a.prenom.toLowerCase().includes(searchName)
      );
      if (filtered.length > 0) {
        return {
          response: `Voici les résultats pour "${nameMatch[1]}" :`,
          data: { type: 'table', agents: filtered, count: filtered.length, columns: ['nom', 'prenom', 'niveau', 'formations', 'telephone', 'disponibilite'] }
        };
      }
    }
  }

  // Statistics
  if (matchesPattern(q, ['statistique', 'stats', 'resume', 'sommaire', 'rapport', 'apercu'])) {
    const formations: Record<string, number> = {};
    const niveaux: Record<string, number> = {};
    agents.forEach(a => {
      a.formations?.forEach(f => { formations[f] = (formations[f] || 0) + 1; });
      if (a.niveau) niveaux[a.niveau] = (niveaux[a.niveau] || 0) + 1;
    });

    const formationStr = Object.entries(formations)
      .sort((a, b) => b[1] - a[1])
      .map(([f, c]) => `- **${f}**: ${c} agents`)
      .join('\n');
    const niveauStr = Object.entries(niveaux)
      .sort((a, b) => b[1] - a[1])
      .map(([n, c]) => `- **${n}**: ${c} agents`)
      .join('\n');

    return {
      response: `📊 **Statistiques de la liste**\n\n**Total**: ${agents.length} agents\n\n**Par formation:**\n${formationStr || '- Aucune donnée'}\n\n**Par niveau:**\n${niveauStr || '- Aucune donnée'}`,
      data: { type: 'chart', stats: { ...formations, ...niveaux }, count: agents.length }
    };
  }

  // Hours worked
  if (matchesPattern(q, ['heure', 'travaille', 'worked'])) {
    const withHours = agents.filter(a => a.heuresTravaillees && a.heuresTravaillees > 0);
    if (withHours.length > 0) {
      const total = withHours.reduce((sum, a) => sum + (a.heuresTravaillees || 0), 0);
      const avg = total / withHours.length;
      return {
        response: `**Heures travaillées:**\n- Total: ${total.toFixed(1)}h\n- Moyenne par agent: ${avg.toFixed(1)}h\n- Agents avec données: ${withHours.length}`,
        data: { type: 'table', agents: withHours.sort((a, b) => (b.heuresTravaillees || 0) - (a.heuresTravaillees || 0)), count: withHours.length, columns: ['nom', 'prenom', 'heuresTravaillees', 'site'] }
      };
    }
    return { response: 'Aucune donnée sur les heures travaillées disponible dans ce fichier.' };
  }

  // Anomalies / problems
  if (matchesPattern(q, ['anomalie', 'probleme', 'erreur', 'incoherence', 'manquant'])) {
    const issues: string[] = [];
    agents.forEach(a => {
      if (!a.telephone) issues.push(`${a.prenom} ${a.nom}: téléphone manquant`);
      if (!a.niveau || a.niveau === 'Non spécifié') issues.push(`${a.prenom} ${a.nom}: niveau non spécifié`);
      if (!a.formations || a.formations.length === 0) issues.push(`${a.prenom} ${a.nom}: aucune formation enregistrée`);
    });
    return {
      response: issues.length > 0
        ? `**${issues.length} anomalies détectées:**\n${issues.slice(0, 20).map(i => `- ${i}`).join('\n')}${issues.length > 20 ? `\n- ...et ${issues.length - 20} autres` : ''}`
        : 'Aucune anomalie majeure détectée dans les données.',
      data: { type: 'count', count: issues.length }
    };
  }

  // Default: try to find agents matching any keyword
  const words = q.split(/\s+/).filter(w => w.length > 2);
  for (const word of words) {
    const filtered = agents.filter(a => {
      const allValues = Object.values(a).map(v =>
        Array.isArray(v) ? v.join(' ') : String(v ?? '')
      ).join(' ').toLowerCase();
      return allValues.includes(word);
    });
    if (filtered.length > 0 && filtered.length < agents.length) {
      return {
        response: `J'ai trouvé **${filtered.length}** agents correspondant à "${word}" :`,
        data: { type: 'table', agents: filtered, count: filtered.length, columns: ['nom', 'prenom', 'niveau', 'formations', 'disponibilite'] }
      };
    }
  }

  return {
    response: `Je n'ai pas trouvé de résultats spécifiques pour votre demande. Voici ce que je peux faire :\n\n- **Compter** des agents par critère (ex: "combien d'agents ont DVAF?")\n- **Lister** des agents (ex: "montre les agents niveau 2")\n- **Statistiques** (ex: "donne-moi les statistiques")\n- **Anomalies** (ex: "trouve les anomalies")\n- **Rechercher** par nom (ex: "trouve l'agent Tremblay")\n\nIl y a actuellement **${agents.length}** agents dans la base de données.`
  };
}

function matchesPattern(text: string, patterns: string[]): boolean {
  return patterns.some(p => text.includes(p));
}
