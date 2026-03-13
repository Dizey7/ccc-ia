'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Clock, PieChart, Download } from 'lucide-react';
import StatsCard from '@/components/StatsCard';

interface StatsData {
  totalAgents: number;
  formations: Record<string, number>;
  niveaux: Record<string, number>;
  sites: Record<string, number>;
  totalHours: number;
  avgHours: number;
}

export default function StatisticsPage() {
  const [files, setFiles] = useState<Array<{ id: string; name: string; agentCount: number }>>([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/analyze').then(r => r.json()).then(d => {
      if (d.files) setFiles(d.files.filter((f: { agentCount: number }) => f.agentCount > 0));
    });
  }, []);

  const handleFileChange = async (fileId: string) => {
    setSelectedFile(fileId);
    if (!fileId) { setStats(null); return; }
    setLoading(true);
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, action: 'stats' }),
    });
    const data = await res.json();
    setStats(data);
    setLoading(false);
  };

  const maxFormation = stats ? Math.max(...Object.values(stats.formations), 1) : 1;
  const maxNiveau = stats ? Math.max(...Object.values(stats.niveaux), 1) : 1;
  const maxSite = stats ? Math.max(...Object.values(stats.sites), 1) : 1;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-purple-400" />
            Statistiques & Analyses Prédictives
          </h1>
          <p className="text-gray-400 mt-1">Tendances, taux d&apos;occupation, prévisions et recommandations</p>
        </div>
        <select value={selectedFile} onChange={e => handleFileChange(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
          <option value="">Sélectionner un fichier</option>
          {files.map(f => <option key={f.id} value={f.id}>{f.name} ({f.agentCount})</option>)}
        </select>
      </div>

      {loading && (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      )}

      {stats && (
        <>
          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard title="Total agents" value={stats.totalAgents} icon={Users} color="blue" />
            <StatsCard title="Formations" value={Object.keys(stats.formations).length} icon={PieChart} color="amber" subtitle="Types distincts" />
            <StatsCard title="Total heures" value={stats.totalHours.toFixed(0)} icon={Clock} color="green" />
            <StatsCard title="Moy. heures/agent" value={stats.avgHours.toFixed(1)} icon={TrendingUp} color="purple" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formations Chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-4">Répartition par formation</h3>
              <div className="space-y-3">
                {Object.entries(stats.formations).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                  <div key={name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{name}</span>
                      <span className="text-amber-400 font-medium">{count} agents</span>
                    </div>
                    <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${(count / maxFormation) * 100}%` }} />
                    </div>
                  </div>
                ))}
                {Object.keys(stats.formations).length === 0 && <p className="text-sm text-gray-500">Aucune donnée de formation</p>}
              </div>
            </div>

            {/* Niveaux Chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-4">Répartition par niveau</h3>
              <div className="space-y-3">
                {Object.entries(stats.niveaux).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                  <div key={name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{name}</span>
                      <span className="text-blue-400 font-medium">{count} agents</span>
                    </div>
                    <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(count / maxNiveau) * 100}%` }} />
                    </div>
                  </div>
                ))}
                {Object.keys(stats.niveaux).length === 0 && <p className="text-sm text-gray-500">Aucune donnée de niveau</p>}
              </div>
            </div>

            {/* Sites Chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-4">Répartition par site</h3>
              <div className="space-y-3">
                {Object.entries(stats.sites).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                  <div key={name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{name}</span>
                      <span className="text-green-400 font-medium">{count} agents</span>
                    </div>
                    <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(count / maxSite) * 100}%` }} />
                    </div>
                  </div>
                ))}
                {Object.keys(stats.sites).length === 0 && <p className="text-sm text-gray-500">Aucune donnée de site</p>}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" /> Recommandations IA
              </h3>
              <div className="space-y-3">
                {stats.totalAgents > 0 && (
                  <>
                    {Object.entries(stats.niveaux).filter(([, c]) => c < stats.totalAgents * 0.1).map(([n]) => (
                      <div key={n} className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <p className="text-sm text-amber-300">Faible effectif en {n}</p>
                        <p className="text-xs text-gray-400">Considérez des formations pour renforcer ce niveau</p>
                      </div>
                    ))}
                    {stats.avgHours > 40 && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-sm text-red-300">Heures moyennes élevées ({stats.avgHours.toFixed(1)}h)</p>
                        <p className="text-xs text-gray-400">Risque de surcharge - envisagez du renforcement</p>
                      </div>
                    )}
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-sm text-blue-300">Effectif total: {stats.totalAgents} agents</p>
                      <p className="text-xs text-gray-400">Capacité estimée : ~{Math.floor(stats.totalAgents * 0.7)} postes simultanés (taux 70%)</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Export */}
          <div className="flex gap-3">
            <button onClick={() => {
              fetch('/api/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileId: selectedFile, options: { includeStats: true } }),
              }).then(r => r.blob()).then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Statistiques_CCC_IA_${new Date().toISOString().split('T')[0]}.xlsx`;
                a.click();
                URL.revokeObjectURL(url);
              });
            }} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 text-sm font-medium">
              <Download className="w-4 h-4" /> Exporter rapport statistique
            </button>
          </div>
        </>
      )}

      {!selectedFile && !loading && (
        <div className="text-center py-16 text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-3" />
          <p>Sélectionnez un fichier pour voir les statistiques</p>
        </div>
      )}
    </div>
  );
}
