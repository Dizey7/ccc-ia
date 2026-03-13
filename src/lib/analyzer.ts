import { Agent, FileSummary } from '@/types';

// Column name mapping - maps various possible column names to standardized names
const COLUMN_MAPPINGS: Record<string, string[]> = {
  nom: ['nom', 'name', 'last_name', 'lastname', 'nom_famille', 'family_name', 'surname', 'nom de famille', 'nom agent'],
  prenom: ['prenom', 'prénom', 'first_name', 'firstname', 'given_name', 'prenom agent'],
  telephone: ['telephone', 'téléphone', 'tel', 'phone', 'mobile', 'cellulaire', 'cell', 'numero', 'numéro'],
  email: ['email', 'courriel', 'mail', 'e-mail', 'adresse_email'],
  permis: ['permis', 'permit', 'license', 'licence', 'bsp', 'permis_securite', 'permis sécurité', 'no permis', 'numero permis'],
  niveau: ['niveau', 'level', 'grade', 'rang', 'echelon', 'échelon', 'niveau agent', 'classification'],
  formations: ['formation', 'formations', 'training', 'cours', 'qualification', 'qualifications', 'dvaf', 'formation agent'],
  certifications: ['certification', 'certifications', 'cert', 'diplome', 'diplôme', 'accréditation'],
  disponibilite: ['disponibilite', 'disponibilité', 'availability', 'dispo', 'horaire', 'schedule', 'disponible'],
  statut: ['statut', 'status', 'etat', 'état', 'actif', 'active'],
  heuresTravaillees: ['heures', 'hours', 'heures_travaillees', 'heures travaillées', 'worked_hours', 'hrs', 'total heures'],
  site: ['site', 'location', 'lieu', 'emplacement', 'poste', 'affectation', 'client', 'contrat'],
  notes: ['notes', 'remarques', 'comments', 'commentaires', 'observations', 'memo'],
};

function normalizeColumnName(col: string): string {
  const normalized = col.toLowerCase().trim().replace(/[_\-\.]/g, ' ').replace(/\s+/g, ' ');
  for (const [standardName, variants] of Object.entries(COLUMN_MAPPINGS)) {
    for (const variant of variants) {
      if (normalized === variant || normalized.includes(variant)) {
        return standardName;
      }
    }
  }
  return col;
}

function detectFormations(value: string): string[] {
  const formations: string[] = [];
  const upper = value.toUpperCase();
  const knownFormations = [
    'DVAF', 'RCR', 'PDSB', 'SIMDUT', 'BSP', 'OMEGA', 'ASP',
    'SECOURISME', 'PREMIERS SOINS', 'FIRST AID', 'CPR',
    'WHMIS', 'TDG', 'TMD', 'ARMES', 'FIREARMS',
  ];
  for (const f of knownFormations) {
    if (upper.includes(f)) {
      formations.push(f);
    }
  }
  if (formations.length === 0 && value.trim()) {
    formations.push(...value.split(/[,;\/|]+/).map(s => s.trim()).filter(Boolean));
  }
  return formations;
}

function detectNiveau(value: string): string {
  const normalized = value.toLowerCase().trim();
  if (/niveau\s*3|level\s*3|niv\.?\s*3|n3/i.test(normalized)) return 'Niveau 3';
  if (/niveau\s*2|level\s*2|niv\.?\s*2|n2/i.test(normalized)) return 'Niveau 2';
  if (/niveau\s*1|level\s*1|niv\.?\s*1|n1/i.test(normalized)) return 'Niveau 1';
  if (normalized.includes('senior') || normalized.includes('superviseur')) return 'Niveau 3';
  if (normalized.includes('intermédiaire') || normalized.includes('intermediate')) return 'Niveau 2';
  if (normalized.includes('junior') || normalized.includes('débutant')) return 'Niveau 1';
  return value.trim() || 'Non spécifié';
}

export function analyzeData(rawData: Record<string, unknown>[], originalColumns: string[]): {
  agents: Agent[];
  summary: FileSummary;
} {
  // Map columns to standardized names
  const columnMap: Record<string, string> = {};
  for (const col of originalColumns) {
    columnMap[col] = normalizeColumnName(col);
  }

  // Parse agents from raw data
  const agents: Agent[] = [];
  const seenKeys = new Set<string>();
  let duplicateCount = 0;
  const errors: string[] = [];
  const anomalies: string[] = [];

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    const agent: Agent = { id: `agent-${i + 1}`, nom: '', prenom: '' };

    for (const [originalCol, value] of Object.entries(row)) {
      const mappedCol = columnMap[originalCol] || originalCol;
      const strValue = String(value ?? '').trim();

      switch (mappedCol) {
        case 'nom':
          agent.nom = strValue;
          break;
        case 'prenom':
          agent.prenom = strValue;
          break;
        case 'telephone':
          agent.telephone = strValue;
          break;
        case 'email':
          agent.email = strValue;
          break;
        case 'permis':
          agent.permis = strValue;
          break;
        case 'niveau':
          agent.niveau = detectNiveau(strValue);
          break;
        case 'formations':
          agent.formations = detectFormations(strValue);
          break;
        case 'certifications':
          agent.certifications = strValue.split(/[,;\/|]+/).map(s => s.trim()).filter(Boolean);
          break;
        case 'disponibilite':
          agent.disponibilite = strValue;
          break;
        case 'statut':
          agent.statut = strValue;
          break;
        case 'heuresTravaillees':
          agent.heuresTravaillees = parseFloat(strValue) || 0;
          break;
        case 'site':
          agent.site = strValue;
          break;
        case 'notes':
          agent.notes = strValue;
          break;
        default:
          agent[originalCol] = strValue;
          break;
      }
    }

    // Handle case where name is in a single column
    if (!agent.prenom && agent.nom && agent.nom.includes(' ')) {
      const parts = agent.nom.split(' ');
      agent.prenom = parts[0];
      agent.nom = parts.slice(1).join(' ');
    }

    // Skip empty rows
    if (!agent.nom && !agent.prenom) {
      continue;
    }

    // Detect duplicates
    const key = `${agent.nom.toLowerCase()}-${agent.prenom.toLowerCase()}`;
    if (seenKeys.has(key)) {
      duplicateCount++;
      anomalies.push(`Doublon détecté: ${agent.prenom} ${agent.nom} (ligne ${i + 2})`);
      continue;
    }
    seenKeys.add(key);

    // Validate data
    if (agent.email && !agent.email.includes('@')) {
      errors.push(`Email invalide pour ${agent.prenom} ${agent.nom}: ${agent.email}`);
    }
    if (agent.telephone && agent.telephone.replace(/\D/g, '').length < 10) {
      anomalies.push(`Téléphone possiblement incomplet pour ${agent.prenom} ${agent.nom}`);
    }

    // Auto-detect formations from other fields
    if (!agent.formations || agent.formations.length === 0) {
      const allValues = Object.values(row).map(v => String(v ?? '')).join(' ');
      const detected = detectFormations(allValues);
      if (detected.length > 0 && detected[0] !== allValues.trim()) {
        agent.formations = detected;
      }
    }

    agents.push(agent);
  }

  // Build summary
  const formations: Record<string, number> = {};
  const niveaux: Record<string, number> = {};
  const permisCount: Record<string, number> = {};
  const disponibiliteCount: Record<string, number> = {};

  for (const agent of agents) {
    if (agent.formations) {
      for (const f of agent.formations) {
        formations[f] = (formations[f] || 0) + 1;
      }
    }
    if (agent.niveau) {
      niveaux[agent.niveau] = (niveaux[agent.niveau] || 0) + 1;
    }
    if (agent.permis) {
      const p = agent.permis ? 'Avec permis' : 'Sans permis';
      permisCount[p] = (permisCount[p] || 0) + 1;
    }
    if (agent.disponibilite) {
      disponibiliteCount[agent.disponibilite] = (disponibiliteCount[agent.disponibilite] || 0) + 1;
    }
  }

  const summary: FileSummary = {
    totalAgents: agents.length,
    columns: originalColumns,
    formations,
    niveaux,
    permis: permisCount,
    disponibilite: disponibiliteCount,
    duplicates: duplicateCount,
    errors,
    anomalies,
  };

  return { agents, summary };
}

export function cleanAndOptimize(agents: Agent[]): {
  cleaned: Agent[];
  changes: string[];
} {
  const changes: string[] = [];
  const cleaned = agents.map((agent, i) => {
    const clean = { ...agent };

    // Standardize name capitalization
    if (clean.nom) {
      const original = clean.nom;
      clean.nom = clean.nom.charAt(0).toUpperCase() + clean.nom.slice(1).toLowerCase();
      if (original !== clean.nom) changes.push(`Nom corrigé: "${original}" → "${clean.nom}"`);
    }
    if (clean.prenom) {
      const original = clean.prenom;
      clean.prenom = clean.prenom.charAt(0).toUpperCase() + clean.prenom.slice(1).toLowerCase();
      if (original !== clean.prenom) changes.push(`Prénom corrigé: "${original}" → "${clean.prenom}"`);
    }

    // Standardize phone format
    if (clean.telephone) {
      const digits = clean.telephone.replace(/\D/g, '');
      if (digits.length === 10) {
        const original = clean.telephone;
        clean.telephone = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        if (original !== clean.telephone) changes.push(`Téléphone formaté pour ${clean.prenom} ${clean.nom}`);
      }
    }

    // Standardize email
    if (clean.email) {
      const original = clean.email;
      clean.email = clean.email.toLowerCase().trim();
      if (original !== clean.email) changes.push(`Email normalisé pour ${clean.prenom} ${clean.nom}`);
    }

    // Set default status
    if (!clean.statut) {
      clean.statut = 'Actif';
    }

    // Set default niveau
    if (!clean.niveau) {
      clean.niveau = 'Non spécifié';
    }

    clean.id = `agent-${i + 1}`;
    return clean;
  });

  return { cleaned, changes };
}
