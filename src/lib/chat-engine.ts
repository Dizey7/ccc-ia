import { Agent, ChatResponseData } from '@/types';

interface QueryResult {
  response: string;
  data?: ChatResponseData;
}

// ========== INTENT CLASSIFICATION ==========

type Intent = 'count' | 'list' | 'stats' | 'anomaly' | 'hours' | 'search' | 'compare' | 'top' | 'help';

interface IntentScore {
  intent: Intent;
  score: number;
}

const INTENT_KEYWORDS: Record<Intent, string[]> = {
  count: ['combien', 'nombre', 'total', 'compte', 'compter', 'nb', 'quantite', 'effectif'],
  list: ['montre', 'affiche', 'liste', 'voir', 'donne', 'trouve', 'cherche', 'qui', 'quels', 'quelles', 'lesquels'],
  stats: ['statistique', 'stats', 'resume', 'sommaire', 'rapport', 'apercu', 'repartition', 'distribution', 'bilan'],
  anomaly: ['anomalie', 'probleme', 'erreur', 'incoherence', 'manquant', 'incomplet', 'doublon', 'suspect', 'bizarre'],
  hours: ['heure', 'travaille', 'worked', 'horaire', 'temps', 'duree', 'overtime'],
  search: ['agent', 'nom', 'appele', 'appelle', 'trouver', 'recherche', 'info', 'information', 'detail', 'profil'],
  compare: ['compare', 'comparaison', 'difference', 'versus', 'vs', 'entre', 'rapport entre'],
  top: ['top', 'meilleur', 'plus', 'maximum', 'classement', 'premier', 'rank', 'palmares'],
  help: ['aide', 'help', 'comment', 'quoi', 'capable', 'fonctionnalite', 'faire', 'peux'],
};

function classifyIntent(query: string): Intent {
  const scores: IntentScore[] = [];

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (query.includes(kw)) score += kw.length; // longer matches = higher confidence
    }
    scores.push({ intent: intent as Intent, score });
  }

  scores.sort((a, b) => b.score - a.score);
  return scores[0].score > 0 ? scores[0].intent : 'help';
}

// ========== ENTITY EXTRACTION ==========

interface Entities {
  formations: string[];
  niveaux: string[];
  sites: string[];
  names: string[];
  disponibilite: 'disponible' | 'indisponible' | null;
  limit: number | null;
  sortField: string | null;
  sortDir: 'asc' | 'desc';
}

const KNOWN_FORMATIONS = ['DVAF', 'RCR', 'PDSB', 'SIMDUT', 'BSP', 'OMEGA', 'ASP', 'SECOURISME', 'PREMIERS SOINS', 'SST', 'TMD', 'DEP', 'AEC', 'CARABINE', 'BATON'];

function extractEntities(query: string, agents: Agent[]): Entities {
  const entities: Entities = {
    formations: [],
    niveaux: [],
    sites: [],
    names: [],
    disponibilite: null,
    limit: null,
    sortField: null,
    sortDir: 'desc',
  };

  // Extract formations
  for (const f of KNOWN_FORMATIONS) {
    if (query.includes(f.toLowerCase())) {
      entities.formations.push(f);
    }
  }
  // Also detect formations from actual data
  const allFormations = [...new Set(agents.flatMap(a => a.formations || []))];
  for (const f of allFormations) {
    if (f && query.includes(f.toLowerCase()) && !entities.formations.includes(f.toUpperCase())) {
      entities.formations.push(f);
    }
  }

  // Extract niveaux
  const niveauPatterns = [
    { pattern: /niveau\s*(\d)/gi, group: 1 },
    { pattern: /niv\.?\s*(\d)/gi, group: 1 },
    { pattern: /n(\d)\b/gi, group: 1 },
    { pattern: /level\s*(\d)/gi, group: 1 },
  ];
  for (const { pattern, group } of niveauPatterns) {
    let match;
    while ((match = pattern.exec(query)) !== null) {
      entities.niveaux.push(match[group]);
    }
  }

  // Extract disponibilite
  if (/\b(disponible|dispo|libre|actif|actifs)\b/.test(query)) {
    entities.disponibilite = 'disponible';
  } else if (/\b(indisponible|absent|inactif|indispo)\b/.test(query)) {
    entities.disponibilite = 'indisponible';
  }

  // Extract limit (top N)
  const limitMatch = query.match(/\b(?:top|premier|premiers|dernier|derniers)\s*(\d+)/i) || query.match(/(\d+)\s*(?:premier|premiers|meilleur|meilleurs)/i);
  if (limitMatch) {
    entities.limit = parseInt(limitMatch[1], 10);
  }

  // Extract sort
  if (/\b(trie|tri|classe|order|ordonn)\b/.test(query)) {
    if (/\b(heure|heures|temps|worked)\b/.test(query)) entities.sortField = 'heuresTravaillees';
    else if (/\b(nom|name)\b/.test(query)) entities.sortField = 'nom';
    else if (/\b(niveau|level)\b/.test(query)) entities.sortField = 'niveau';
    if (/\b(croissant|asc|ascending|petit)\b/.test(query)) entities.sortDir = 'asc';
  }
  if (/\b(top|meilleur|plus|maximum)\b/.test(query) && !entities.sortField) {
    entities.sortField = 'heuresTravaillees';
  }

  // Extract names - look for proper nouns or after "agent" keyword
  const nameMatch = query.match(/(?:agent|nom|appel[eé]|nomm[eé]|prenom)\s+([a-zA-ZÀ-ÿ]+)/i);
  if (nameMatch && nameMatch[1].length > 2) {
    entities.names.push(nameMatch[1]);
  }
  // Also try to match known agent names
  const words = query.split(/\s+/).filter(w => w.length > 2);
  for (const word of words) {
    const w = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    const found = agents.some(a =>
      a.nom.toLowerCase() === word || a.prenom.toLowerCase() === word
    );
    if (found && !entities.names.includes(w)) {
      entities.names.push(w);
    }
  }

  // Extract sites from known data
  const allSites = [...new Set(agents.map(a => a.site).filter(Boolean))];
  for (const site of allSites) {
    if (site && query.includes(site.toLowerCase())) {
      entities.sites.push(site);
    }
  }

  return entities;
}

// ========== FILTER ENGINE ==========

function applyFilters(agents: Agent[], entities: Entities): Agent[] {
  let result = [...agents];

  // Filter by formations
  if (entities.formations.length > 0) {
    result = result.filter(a =>
      entities.formations.every(f =>
        a.formations?.some(af => af.toUpperCase().includes(f.toUpperCase()))
      )
    );
  }

  // Filter by niveaux
  if (entities.niveaux.length > 0) {
    result = result.filter(a =>
      entities.niveaux.some(n => a.niveau?.includes(n))
    );
  }

  // Filter by sites
  if (entities.sites.length > 0) {
    result = result.filter(a =>
      entities.sites.some(s => a.site?.toLowerCase().includes(s.toLowerCase()))
    );
  }

  // Filter by disponibilite
  if (entities.disponibilite === 'disponible') {
    result = result.filter(a =>
      a.disponibilite?.toLowerCase().includes('disponible') ||
      a.disponibilite?.toLowerCase().includes('oui') ||
      a.statut?.toLowerCase().includes('actif')
    );
  } else if (entities.disponibilite === 'indisponible') {
    result = result.filter(a =>
      a.disponibilite?.toLowerCase().includes('indisponible') ||
      a.disponibilite?.toLowerCase().includes('non') ||
      a.statut?.toLowerCase().includes('inactif')
    );
  }

  // Filter by name
  if (entities.names.length > 0) {
    result = result.filter(a =>
      entities.names.some(name => {
        const n = name.toLowerCase();
        return a.nom.toLowerCase().includes(n) || a.prenom.toLowerCase().includes(n);
      })
    );
  }

  // Sort
  if (entities.sortField) {
    const field = entities.sortField;
    result.sort((a, b) => {
      const aVal = Number(a[field as keyof Agent]) || 0;
      const bVal = Number(b[field as keyof Agent]) || 0;
      return entities.sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }

  // Limit
  if (entities.limit && entities.limit > 0) {
    result = result.slice(0, entities.limit);
  }

  return result;
}

// ========== RESPONSE BUILDERS ==========

function buildFilterDescription(entities: Entities): string {
  const parts: string[] = [];
  if (entities.formations.length > 0) parts.push(`formation ${entities.formations.join(' + ')}`);
  if (entities.niveaux.length > 0) parts.push(`Niveau ${entities.niveaux.join('/')}`);
  if (entities.sites.length > 0) parts.push(`site ${entities.sites.join('/')}`);
  if (entities.disponibilite) parts.push(entities.disponibilite === 'disponible' ? 'disponibles' : 'indisponibles');
  if (entities.names.length > 0) parts.push(`nom "${entities.names.join(', ')}"`);
  return parts.length > 0 ? parts.join(', ') : '';
}

function handleCount(agents: Agent[], entities: Entities): QueryResult {
  const filtered = applyFilters(agents, entities);
  const desc = buildFilterDescription(entities);

  if (desc) {
    return {
      response: `Il y a **${filtered.length}** agents correspondant aux critères (${desc}).`,
      data: { type: 'table', agents: filtered.slice(0, 50), count: filtered.length, columns: ['nom', 'prenom', 'niveau', 'formations', 'disponibilite'] }
    };
  }

  return {
    response: `Il y a **${agents.length}** agents au total dans la base de données.`,
    data: { type: 'count', count: agents.length }
  };
}

function handleList(agents: Agent[], entities: Entities): QueryResult {
  const filtered = applyFilters(agents, entities);
  const desc = buildFilterDescription(entities);

  if (filtered.length === 0) {
    return { response: `Aucun agent trouvé${desc ? ` pour les critères : ${desc}` : ''}.` };
  }

  const columns = ['nom', 'prenom', 'niveau', 'formations', 'disponibilite', 'telephone', 'site'];
  return {
    response: `Voici **${filtered.length}** agents${desc ? ` (${desc})` : ''} :`,
    data: { type: 'table', agents: filtered.slice(0, 100), count: filtered.length, columns }
  };
}

function handleStats(agents: Agent[]): QueryResult {
  const formations: Record<string, number> = {};
  const niveaux: Record<string, number> = {};
  const sites: Record<string, number> = {};
  let disponibles = 0;

  agents.forEach(a => {
    a.formations?.forEach(f => { formations[f] = (formations[f] || 0) + 1; });
    if (a.niveau) niveaux[a.niveau] = (niveaux[a.niveau] || 0) + 1;
    if (a.site) sites[a.site] = (sites[a.site] || 0) + 1;
    if (a.disponibilite?.toLowerCase().includes('disponible') || a.statut?.toLowerCase().includes('actif')) disponibles++;
  });

  const topFormations = Object.entries(formations).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const topSites = Object.entries(sites).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const formationStr = topFormations.map(([f, c]) => `- **${f}**: ${c} agents (${((c / agents.length) * 100).toFixed(1)}%)`).join('\n');
  const niveauStr = Object.entries(niveaux).sort((a, b) => b[1] - a[1]).map(([n, c]) => `- **${n}**: ${c} agents (${((c / agents.length) * 100).toFixed(1)}%)`).join('\n');
  const siteStr = topSites.map(([s, c]) => `- **${s}**: ${c} agents`).join('\n');

  const totalHours = agents.reduce((s, a) => s + (a.heuresTravaillees || 0), 0);
  const avgHours = agents.filter(a => a.heuresTravaillees).length > 0
    ? totalHours / agents.filter(a => a.heuresTravaillees).length : 0;

  return {
    response: `**Statistiques complètes**\n\n` +
      `**Total**: ${agents.length} agents\n` +
      `**Disponibles**: ${disponibles} (${((disponibles / agents.length) * 100).toFixed(1)}%)\n` +
      `**Heures totales**: ${totalHours.toFixed(0)}h (moy. ${avgHours.toFixed(1)}h/agent)\n\n` +
      `**Par formation:**\n${formationStr || '- Aucune donnée'}\n\n` +
      `**Par niveau:**\n${niveauStr || '- Aucune donnée'}\n\n` +
      `**Par site:**\n${siteStr || '- Aucune donnée'}`,
    data: { type: 'chart', stats: { ...formations, ...niveaux }, count: agents.length }
  };
}

function handleAnomaly(agents: Agent[]): QueryResult {
  const issues: string[] = [];
  const nameCounts: Record<string, number> = {};

  agents.forEach(a => {
    if (!a.telephone || a.telephone.trim() === '') issues.push(`${a.prenom} ${a.nom}: téléphone manquant`);
    if (!a.niveau || a.niveau === 'Non spécifié') issues.push(`${a.prenom} ${a.nom}: niveau non spécifié`);
    if (!a.formations || a.formations.length === 0) issues.push(`${a.prenom} ${a.nom}: aucune formation`);
    if (!a.email || a.email.trim() === '') issues.push(`${a.prenom} ${a.nom}: email manquant`);
    if (a.heuresTravaillees && a.heuresTravaillees > 60) issues.push(`${a.prenom} ${a.nom}: ${a.heuresTravaillees}h - heures excessives`);

    const fullName = `${a.nom} ${a.prenom}`.toLowerCase();
    nameCounts[fullName] = (nameCounts[fullName] || 0) + 1;
  });

  // Check duplicates
  Object.entries(nameCounts).filter(([, c]) => c > 1).forEach(([name, count]) => {
    issues.push(`Doublon potentiel: "${name}" apparaît ${count} fois`);
  });

  return {
    response: issues.length > 0
      ? `**${issues.length} anomalies détectées :**\n${issues.slice(0, 30).map(i => `- ${i}`).join('\n')}${issues.length > 30 ? `\n\n...et **${issues.length - 30}** autres anomalies` : ''}`
      : 'Aucune anomalie majeure détectée dans les données.',
    data: { type: 'count', count: issues.length }
  };
}

function handleHours(agents: Agent[], entities: Entities): QueryResult {
  let withHours = agents.filter(a => a.heuresTravaillees && a.heuresTravaillees > 0);

  // Apply additional filters
  if (entities.niveaux.length > 0) {
    withHours = withHours.filter(a => entities.niveaux.some(n => a.niveau?.includes(n)));
  }
  if (entities.formations.length > 0) {
    withHours = withHours.filter(a => entities.formations.every(f => a.formations?.some(af => af.toUpperCase().includes(f))));
  }

  if (withHours.length > 0) {
    const total = withHours.reduce((sum, a) => sum + (a.heuresTravaillees || 0), 0);
    const avg = total / withHours.length;
    const max = Math.max(...withHours.map(a => a.heuresTravaillees || 0));
    const min = Math.min(...withHours.map(a => a.heuresTravaillees || 0));
    const sorted = [...withHours].sort((a, b) => (b.heuresTravaillees || 0) - (a.heuresTravaillees || 0));
    const limit = entities.limit || 20;

    return {
      response: `**Heures travaillées :**\n- Total: **${total.toFixed(1)}h**\n- Moyenne: **${avg.toFixed(1)}h** par agent\n- Maximum: **${max.toFixed(1)}h**\n- Minimum: **${min.toFixed(1)}h**\n- Agents avec données: **${withHours.length}**`,
      data: { type: 'table', agents: sorted.slice(0, limit), count: withHours.length, columns: ['nom', 'prenom', 'heuresTravaillees', 'niveau', 'site'] }
    };
  }
  return { response: 'Aucune donnée sur les heures travaillées disponible.' };
}

function handleCompare(agents: Agent[], entities: Entities): QueryResult {
  if (entities.niveaux.length >= 2) {
    const groups = entities.niveaux.map(n => {
      const filtered = agents.filter(a => a.niveau?.includes(n));
      const hours = filtered.reduce((s, a) => s + (a.heuresTravaillees || 0), 0);
      return { niveau: n, count: filtered.length, hours, avgHours: filtered.length > 0 ? hours / filtered.length : 0 };
    });

    const response = `**Comparaison des niveaux :**\n\n` +
      groups.map(g => `**Niveau ${g.niveau}**: ${g.count} agents, ${g.hours.toFixed(0)}h total, moy. ${g.avgHours.toFixed(1)}h/agent`).join('\n');

    return { response, data: { type: 'count', count: agents.length } };
  }

  if (entities.formations.length >= 2) {
    const groups = entities.formations.map(f => {
      const filtered = agents.filter(a => a.formations?.some(af => af.toUpperCase().includes(f)));
      return { formation: f, count: filtered.length };
    });

    const response = `**Comparaison des formations :**\n\n` +
      groups.map(g => `**${g.formation}**: ${g.count} agents`).join('\n');

    return { response, data: { type: 'count', count: agents.length } };
  }

  return { response: 'Précisez au moins 2 critères à comparer (ex: "compare niveau 1 et niveau 2").' };
}

function handleTop(agents: Agent[], entities: Entities): QueryResult {
  const limit = entities.limit || 10;
  const field = entities.sortField || 'heuresTravaillees';

  let filtered = applyFilters(agents, { ...entities, limit: null, sortField: null, sortDir: 'desc' });
  filtered.sort((a, b) => {
    const aVal = Number(a[field as keyof Agent]) || 0;
    const bVal = Number(b[field as keyof Agent]) || 0;
    return bVal - aVal;
  });
  filtered = filtered.slice(0, limit);

  const fieldLabel = field === 'heuresTravaillees' ? 'heures travaillées' : field;

  return {
    response: `**Top ${limit} agents** par ${fieldLabel} :`,
    data: { type: 'table', agents: filtered, count: filtered.length, columns: ['nom', 'prenom', field, 'niveau', 'site'] }
  };
}

function handleHelp(agents: Agent[]): QueryResult {
  return {
    response: `**IA Work - Assistant de Répartition**\n\nVoici ce que je peux faire :\n\n` +
      `**Compter :** "Combien d'agents ont DVAF?", "Nombre d'agents niveau 2 disponibles"\n\n` +
      `**Lister :** "Montre les agents niveau 2 avec DVAF", "Agents disponibles"\n\n` +
      `**Statistiques :** "Donne-moi les statistiques", "Bilan des formations"\n\n` +
      `**Anomalies :** "Trouve les anomalies", "Problèmes dans les données"\n\n` +
      `**Heures :** "Heures travaillées", "Top 10 agents par heures"\n\n` +
      `**Comparer :** "Compare niveau 1 et niveau 2"\n\n` +
      `**Rechercher :** "Trouve l'agent Tremblay", "Info sur Jean"\n\n` +
      `**Classement :** "Top 20 agents", "Meilleurs agents"\n\n` +
      `Il y a actuellement **${agents.length}** agents dans la base de données.`
  };
}

// ========== MAIN ENTRY POINT ==========

export function processQuery(query: string, agents: Agent[]): QueryResult {
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (agents.length === 0) {
    return {
      response: "Aucune donnée d'agents n'est disponible. Veuillez d'abord importer un fichier Excel, CSV ou PDF via le module d'import."
    };
  }

  const intent = classifyIntent(q);
  const entities = extractEntities(q, agents);

  switch (intent) {
    case 'count':
      return handleCount(agents, entities);
    case 'list':
      return handleList(agents, entities);
    case 'stats':
      return handleStats(agents);
    case 'anomaly':
      return handleAnomaly(agents);
    case 'hours':
      return handleHours(agents, entities);
    case 'compare':
      return handleCompare(agents, entities);
    case 'top':
      return handleTop(agents, entities);
    case 'search': {
      // Search is like list but more focused on name matching
      if (entities.names.length > 0) {
        return handleList(agents, entities);
      }
      // If no names found, try fuzzy search on all words
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
            data: { type: 'table', agents: filtered.slice(0, 50), count: filtered.length, columns: ['nom', 'prenom', 'niveau', 'formations', 'disponibilite', 'telephone'] }
          };
        }
      }
      return handleList(agents, entities);
    }
    case 'help':
    default:
      // Before returning help, try to match any entity-based query
      if (entities.formations.length > 0 || entities.niveaux.length > 0 || entities.disponibilite || entities.names.length > 0 || entities.sites.length > 0) {
        return handleList(agents, entities);
      }
      // Try fuzzy keyword search as last resort
      const words = q.split(/\s+/).filter(w => w.length > 2);
      for (const word of words) {
        const filtered = agents.filter(a => {
          const allValues = Object.values(a).map(v =>
            Array.isArray(v) ? v.join(' ') : String(v ?? '')
          ).join(' ').toLowerCase();
          return allValues.includes(word);
        });
        if (filtered.length > 0 && filtered.length < agents.length * 0.8) {
          return {
            response: `J'ai trouvé **${filtered.length}** agents correspondant à "${word}" :`,
            data: { type: 'table', agents: filtered.slice(0, 50), count: filtered.length, columns: ['nom', 'prenom', 'niveau', 'formations', 'disponibilite'] }
          };
        }
      }
      return handleHelp(agents);
  }
}
