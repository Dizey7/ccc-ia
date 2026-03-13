'use client';

import { useState, useMemo } from 'react';
import { Agent } from '@/types';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';

interface DataTableProps {
  agents: Agent[];
  columns?: string[];
  maxRows?: number;
}

export default function DataTable({ agents, columns, maxRows = 50 }: DataTableProps) {
  const [sortField, setSortField] = useState<string>('nom');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const displayColumns = columns || ['nom', 'prenom', 'niveau', 'formations', 'disponibilite', 'telephone', 'site'];

  const columnLabels: Record<string, string> = {
    nom: 'Nom', prenom: 'Prénom', telephone: 'Téléphone', email: 'Email',
    permis: 'Permis', niveau: 'Niveau', formations: 'Formations',
    certifications: 'Certifications', disponibilite: 'Disponibilité',
    statut: 'Statut', heuresTravaillees: 'Heures', site: 'Site', notes: 'Notes',
  };

  const filtered = useMemo(() => {
    let result = agents;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a => {
        return Object.values(a).some(v => {
          if (Array.isArray(v)) return v.some(item => String(item).toLowerCase().includes(q));
          return String(v ?? '').toLowerCase().includes(q);
        });
      });
    }
    result.sort((a, b) => {
      const aVal = String(a[sortField as keyof Agent] ?? '');
      const bVal = String(b[sortField as keyof Agent] ?? '');
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return result;
  }, [agents, search, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / maxRows);
  const pageData = filtered.slice(page * maxRows, (page + 1) * maxRows);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const formatValue = (agent: Agent, col: string) => {
    const val = agent[col as keyof Agent];
    if (Array.isArray(val)) return val.join(', ');
    if (val === undefined || val === null) return '-';
    return String(val);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher dans le tableau..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <span className="text-sm text-gray-400">{filtered.length} résultats</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/80">
              {displayColumns.map(col => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="px-4 py-3 text-left font-medium text-gray-300 cursor-pointer hover:text-white whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    {columnLabels[col] || col}
                    {sortField === col && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {pageData.map((agent, i) => (
              <tr key={agent.id || i} className="hover:bg-gray-800/50 transition-colors">
                {displayColumns.map(col => (
                  <td key={col} className="px-4 py-2.5 text-gray-300 whitespace-nowrap max-w-[200px] truncate">
                    {col === 'niveau' ? (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        agent.niveau?.includes('3') ? 'bg-purple-500/20 text-purple-300' :
                        agent.niveau?.includes('2') ? 'bg-blue-500/20 text-blue-300' :
                        agent.niveau?.includes('1') ? 'bg-green-500/20 text-green-300' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {agent.niveau || '-'}
                      </span>
                    ) : col === 'formations' ? (
                      <div className="flex gap-1 flex-wrap">
                        {agent.formations?.map(f => (
                          <span key={f} className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-xs">
                            {f}
                          </span>
                        )) || '-'}
                      </div>
                    ) : (
                      formatValue(agent, col)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-700"
          >
            Précédent
          </button>
          <span className="text-sm text-gray-400">
            Page {page + 1} sur {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-700"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
