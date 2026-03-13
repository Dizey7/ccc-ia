'use client';

import { useState, useEffect } from 'react';
import { History, FileSpreadsheet, Search, Download, Upload, BarChart3, Sparkles, Clock } from 'lucide-react';

interface HistoryItem {
  id: string;
  fileId: string;
  fileName: string;
  date: string;
  type: 'import' | 'analysis' | 'export' | 'cleaning';
  description: string;
  result?: string;
}

const typeConfig = {
  import: { icon: Upload, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  analysis: { icon: BarChart3, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  export: { icon: Download, color: 'text-green-400', bg: 'bg-green-500/10' },
  cleaning: { icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-500/10' },
};

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    fetch('/api/analyze').then(r => r.json()).then(d => {
      if (d.history) setHistory(d.history);
    });
  }, []);

  const filtered = history.filter(h => {
    if (filterType && h.type !== filterType) return false;
    if (search && !h.description.toLowerCase().includes(search.toLowerCase()) && !h.fileName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <History className="w-7 h-7 text-blue-400" />
          Historique complet
        </h1>
        <p className="text-gray-400 mt-1">Toutes les analyses, imports, exports et opérations effectuées</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher dans l'historique..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {['', 'import', 'analysis', 'export', 'cleaning'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filterType === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {t === '' ? 'Tout' : t === 'import' ? 'Imports' : t === 'analysis' ? 'Analyses' : t === 'export' ? 'Exports' : 'Nettoyages'}
            </button>
          ))}
        </div>
      </div>

      {/* History list */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map(item => {
            const config = typeConfig[item.type];
            const Icon = config.icon;
            return (
              <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-start gap-4 hover:border-gray-700 transition-colors">
                <div className={`w-10 h-10 ${config.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">{item.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {new Date(item.date).toLocaleString('fr-CA')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <FileSpreadsheet className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-500">{item.fileName}</span>
                  </div>
                  {item.result && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{item.result}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <History className="w-12 h-12 mx-auto mb-3" />
          <p>Aucun historique disponible</p>
          <p className="text-sm mt-1">L&apos;historique sera automatiquement enregistré lors de vos opérations</p>
        </div>
      )}
    </div>
  );
}
