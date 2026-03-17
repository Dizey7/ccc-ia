import { Agent } from '@/types';

export interface ModificationResult {
  success: boolean;
  description: string;
  agents: Agent[];
  changes: string[];
}

interface Command {
  action: string;
  params: Record<string, string>;
}

// Parse a French natural language command into a structured command
function parseCommand(input: string): Command {
  const q = input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  // Sort commands
  if (/\b(trie|tri|ordonn|class|sort)\b/.test(q)) {
    const field = extractField(q);
    const dir = /\b(decroissant|desc|inverse|z-a)\b/.test(q) ? 'desc' : 'asc';
    return { action: 'sort', params: { field, direction: dir } };
  }

  // Delete/remove rows
  if (/\b(supprime|retire|enleve|efface|delete)\b.*\b(ligne|row|vide|doublon|duplicate)\b/.test(q)) {
    if (/\b(vide|empty|blank)\b/.test(q)) return { action: 'remove_empty', params: {} };
    if (/\b(doublon|duplicate|duplique)\b/.test(q)) return { action: 'remove_duplicates', params: {} };
    const match = q.match(/ligne[s]?\s*(\d+)/);
    if (match) return { action: 'remove_row', params: { row: match[1] } };
    return { action: 'remove_empty', params: {} };
  }

  // Add column
  if (/\b(ajoute|ajout|add|cree|creer)\b.*\b(colonne|column)\b/.test(q)) {
    const nameMatch = q.match(/colonne\s+["\']?([a-zA-ZÀ-ÿ\s]+)["\']?/i);
    const name = nameMatch ? nameMatch[1].trim() : 'Nouvelle colonne';
    const defaultVal = q.match(/(?:valeur|defaut|default)\s+["\']?([^"']+)["\']?/i)?.[1] || '';
    return { action: 'add_column', params: { name, defaultValue: defaultVal } };
  }

  // Remove column
  if (/\b(supprime|retire|enleve|delete)\b.*\b(colonne|column)\b/.test(q)) {
    const nameMatch = q.match(/colonne\s+["\']?([a-zA-ZÀ-ÿ\s]+)["\']?/i);
    const name = nameMatch ? nameMatch[1].trim() : '';
    return { action: 'remove_column', params: { name } };
  }

  // Rename column
  if (/\b(renomme|rename|change.*nom)\b.*\b(colonne|column)\b/.test(q)) {
    const parts = q.match(/["\']([^"']+)["\'].*["\']([^"']+)["\']/) || q.match(/colonne\s+(\S+)\s+(?:en|vers|to|par)\s+(\S+)/);
    if (parts) return { action: 'rename_column', params: { oldName: parts[1], newName: parts[2] } };
    return { action: 'rename_column', params: { oldName: '', newName: '' } };
  }

  // Change cell value
  if (/\b(change|modifie|met|remplace|set)\b.*\b(cellule|cell|valeur)\b/.test(q) || /\b[A-Z]\d+\b/.test(input)) {
    const cellMatch = input.match(/\b([A-Z])(\d+)\b/);
    const valueMatch = q.match(/(?:a|à|=|vers|par|value)\s+["\']?([^"']+)["\']?$/i);
    if (cellMatch && valueMatch) {
      return { action: 'set_cell', params: { col: cellMatch[1], row: cellMatch[2], value: valueMatch[1].trim() } };
    }
  }

  // Find and replace
  if (/\b(remplace|replace|substitue)\b/.test(q)) {
    const parts = q.match(/["\']([^"']+)["\'].*["\']([^"']+)["\']/) ||
      q.match(/remplace\s+(\S+)\s+par\s+(\S+)/);
    if (parts) return { action: 'find_replace', params: { find: parts[1], replace: parts[2] } };
  }

  // Filter - keep only matching rows
  if (/\b(filtre|filter|garde|garder|keep)\b/.test(q)) {
    const field = extractField(q);
    const valueMatch = q.match(/(?:=|egale?|contient|avec|where)\s+["\']?([^"']+)["\']?$/i);
    return { action: 'filter', params: { field, value: valueMatch?.[1] || '' } };
  }

  // Uppercase / lowercase
  if (/\b(majuscule|uppercase|caps)\b/.test(q)) {
    const field = extractField(q);
    return { action: 'uppercase', params: { field } };
  }
  if (/\b(minuscule|lowercase)\b/.test(q)) {
    const field = extractField(q);
    return { action: 'lowercase', params: { field } };
  }

  // Capitalize
  if (/\b(capitalise|capitalize|premiere lettre)\b/.test(q)) {
    const field = extractField(q);
    return { action: 'capitalize', params: { field } };
  }

  // Clean whitespace
  if (/\b(nettoie|clean|trim|espace)\b/.test(q)) {
    return { action: 'clean', params: {} };
  }

  return { action: 'unknown', params: { original: input } };
}

function extractField(q: string): string {
  const fieldMap: Record<string, string> = {
    'nom': 'nom', 'name': 'nom', 'surname': 'nom',
    'prenom': 'prenom', 'firstname': 'prenom', 'first name': 'prenom',
    'telephone': 'telephone', 'tel': 'telephone', 'phone': 'telephone',
    'email': 'email', 'courriel': 'email', 'mail': 'email',
    'niveau': 'niveau', 'level': 'niveau', 'niv': 'niveau',
    'formation': 'formations', 'formations': 'formations',
    'disponibilite': 'disponibilite', 'dispo': 'disponibilite',
    'statut': 'statut', 'status': 'statut',
    'site': 'site', 'emplacement': 'site', 'poste': 'site',
    'heure': 'heuresTravaillees', 'heures': 'heuresTravaillees', 'hours': 'heuresTravaillees',
    'permis': 'permis', 'license': 'permis',
    'note': 'notes', 'notes': 'notes',
  };

  for (const [keyword, field] of Object.entries(fieldMap)) {
    if (q.includes(keyword)) return field;
  }
  return 'nom';
}

// Apply a modification command to agents data
export function applyModification(command: string, agents: Agent[]): ModificationResult {
  const parsed = parseCommand(command);
  const changes: string[] = [];

  switch (parsed.action) {
    case 'sort': {
      const field = parsed.params.field as keyof Agent;
      const dir = parsed.params.direction;
      const sorted = [...agents].sort((a, b) => {
        const aVal = String(a[field] ?? '');
        const bVal = String(b[field] ?? '');
        return dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
      changes.push(`Trié par ${field} (${dir === 'asc' ? 'croissant' : 'décroissant'})`);
      return { success: true, description: `Données triées par ${field}`, agents: sorted, changes };
    }

    case 'remove_empty': {
      const before = agents.length;
      const filtered = agents.filter(a => a.nom && a.nom.trim() !== '' && a.prenom && a.prenom.trim() !== '');
      changes.push(`${before - filtered.length} lignes vides supprimées`);
      return { success: true, description: `Lignes vides supprimées`, agents: filtered, changes };
    }

    case 'remove_duplicates': {
      const seen = new Set<string>();
      const unique: Agent[] = [];
      for (const a of agents) {
        const key = `${a.nom}|${a.prenom}|${a.telephone}`.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(a);
        }
      }
      changes.push(`${agents.length - unique.length} doublons supprimés`);
      return { success: true, description: `Doublons supprimés`, agents: unique, changes };
    }

    case 'remove_row': {
      const rowIdx = parseInt(parsed.params.row) - 1;
      if (rowIdx >= 0 && rowIdx < agents.length) {
        const removed = agents[rowIdx];
        const result = agents.filter((_, i) => i !== rowIdx);
        changes.push(`Ligne ${parsed.params.row} supprimée (${removed.prenom} ${removed.nom})`);
        return { success: true, description: `Ligne supprimée`, agents: result, changes };
      }
      return { success: false, description: 'Numéro de ligne invalide', agents, changes: ['Erreur: ligne non trouvée'] };
    }

    case 'add_column': {
      const name = parsed.params.name;
      const defaultVal = parsed.params.defaultValue;
      const updated = agents.map(a => ({ ...a, [name]: defaultVal }));
      changes.push(`Colonne "${name}" ajoutée avec valeur par défaut "${defaultVal}"`);
      return { success: true, description: `Colonne "${name}" ajoutée`, agents: updated, changes };
    }

    case 'remove_column': {
      const name = parsed.params.name.toLowerCase();
      const updated = agents.map(a => {
        const copy = { ...a };
        for (const key of Object.keys(copy)) {
          if (key.toLowerCase() === name) {
            delete (copy as Record<string, unknown>)[key];
          }
        }
        return copy;
      });
      changes.push(`Colonne "${parsed.params.name}" supprimée`);
      return { success: true, description: `Colonne supprimée`, agents: updated, changes };
    }

    case 'rename_column': {
      const oldName = parsed.params.oldName;
      const newName = parsed.params.newName;
      if (!oldName || !newName) {
        return { success: false, description: 'Précisez l\'ancien et le nouveau nom', agents, changes: [] };
      }
      const updated = agents.map(a => {
        const copy = { ...a } as Record<string, unknown>;
        for (const key of Object.keys(copy)) {
          if (key.toLowerCase() === oldName.toLowerCase()) {
            copy[newName] = copy[key];
            delete copy[key];
          }
        }
        return copy as Agent;
      });
      changes.push(`Colonne "${oldName}" renommée en "${newName}"`);
      return { success: true, description: `Colonne renommée`, agents: updated, changes };
    }

    case 'find_replace': {
      const find = parsed.params.find;
      const replace = parsed.params.replace;
      let count = 0;
      const updated = agents.map(a => {
        const copy = { ...a } as Record<string, unknown>;
        for (const key of Object.keys(copy)) {
          const val = copy[key];
          if (typeof val === 'string' && val.toLowerCase().includes(find.toLowerCase())) {
            copy[key] = val.replace(new RegExp(find, 'gi'), replace);
            count++;
          }
        }
        return copy as Agent;
      });
      changes.push(`${count} remplacements effectués: "${find}" → "${replace}"`);
      return { success: true, description: `Remplacement effectué`, agents: updated, changes };
    }

    case 'filter': {
      const field = parsed.params.field;
      const value = parsed.params.value.toLowerCase();
      const filtered = agents.filter(a => {
        const v = a[field as keyof Agent];
        if (Array.isArray(v)) return v.some(item => String(item).toLowerCase().includes(value));
        return String(v ?? '').toLowerCase().includes(value);
      });
      changes.push(`Filtre appliqué: ${field} contient "${parsed.params.value}" → ${filtered.length} résultats`);
      return { success: true, description: `Filtre appliqué`, agents: filtered, changes };
    }

    case 'uppercase': {
      const field = parsed.params.field;
      const updated = agents.map(a => {
        const copy = { ...a } as Record<string, unknown>;
        const val = copy[field];
        if (typeof val === 'string') copy[field] = val.toUpperCase();
        return copy as Agent;
      });
      changes.push(`Colonne "${field}" convertie en majuscules`);
      return { success: true, description: `Conversion en majuscules`, agents: updated, changes };
    }

    case 'lowercase': {
      const field = parsed.params.field;
      const updated = agents.map(a => {
        const copy = { ...a } as Record<string, unknown>;
        const val = copy[field];
        if (typeof val === 'string') copy[field] = val.toLowerCase();
        return copy as Agent;
      });
      changes.push(`Colonne "${field}" convertie en minuscules`);
      return { success: true, description: `Conversion en minuscules`, agents: updated, changes };
    }

    case 'capitalize': {
      const field = parsed.params.field;
      const updated = agents.map(a => {
        const copy = { ...a } as Record<string, unknown>;
        const val = copy[field];
        if (typeof val === 'string') {
          copy[field] = val.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        }
        return copy as Agent;
      });
      changes.push(`Colonne "${field}" capitalisée`);
      return { success: true, description: `Capitalisation appliquée`, agents: updated, changes };
    }

    case 'clean': {
      let totalChanges = 0;
      const updated = agents.map(a => {
        const copy = { ...a } as Record<string, unknown>;
        for (const key of Object.keys(copy)) {
          const val = copy[key];
          if (typeof val === 'string') {
            const cleaned = val.trim().replace(/\s+/g, ' ');
            if (cleaned !== val) { copy[key] = cleaned; totalChanges++; }
          }
        }
        return copy as Agent;
      });
      changes.push(`${totalChanges} espaces nettoyés`);
      return { success: true, description: `Nettoyage effectué`, agents: updated, changes };
    }

    case 'set_cell': {
      const colIdx = parsed.params.col.charCodeAt(0) - 65; // A=0, B=1, etc.
      const rowIdx = parseInt(parsed.params.row) - 2; // Row 1 is header
      if (rowIdx >= 0 && rowIdx < agents.length) {
        const keys = Object.keys(agents[0]);
        if (colIdx >= 0 && colIdx < keys.length) {
          const updated = [...agents];
          updated[rowIdx] = { ...updated[rowIdx], [keys[colIdx]]: parsed.params.value };
          changes.push(`Cellule ${parsed.params.col}${parsed.params.row} modifiée à "${parsed.params.value}"`);
          return { success: true, description: `Cellule modifiée`, agents: updated, changes };
        }
      }
      return { success: false, description: 'Référence de cellule invalide', agents, changes: ['Erreur: cellule non trouvée'] };
    }

    default:
      return {
        success: false,
        description: `Commande non reconnue. Essayez :\n- "Trie par nom"\n- "Supprime les doublons"\n- "Ajoute colonne Salaire"\n- "Remplace X par Y"\n- "Mets les noms en majuscule"\n- "Filtre les agents disponibles"\n- "Supprime les lignes vides"\n- "Nettoie les espaces"`,
        agents,
        changes: []
      };
  }
}
