'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Filter, Download, UserCheck, UserX, Clock, AlertTriangle } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatsCard from '@/components/StatsCard';
import { Agent } from '@/types';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [files, setFiles] = useState<Array<{ id: string; name: string; agentCount: number }>>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [filterNiveau, setFilterNiveau] = useState('');
  const [filterFormation, setFilterFormation] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analyze').then(r => r.json()).then(d => {
      if (d.files) {
        const validFiles = d.files.filter((f: { agentCount: number }) => f.agentCount > 0);
        setFiles(validFiles);
      }
      setLoading(false);
    });
  }, []);

  const handleFileChange = async (fileId: string) => {
    setSelectedFile(fileId);
    if (!fileId) return;
    setLoading(true);
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'montre tous les agents', fileId: fileId || undefined }),
    });
    const data = await res.json();
    if (data.response?.data?.agents) setAgents(data.response.data.agents);
    setLoading(false);
  };

  const filteredAgents = agents.filter(a => {
    if (filterNiveau && !a.niveau?.includes(filterNiveau)) return false;
    if (filterFormation && !a.formations?.some(f => f.toUpperCase().includes(filterFormation.toUpperCase()))) return false;
    return true;
  });

  const niveaux = [...new Set(agents.map(a => a.niveau).filter(Boolean))];
  const formations = [...new Set(agents.flatMap(a => a.formations || []))];

  const disponibles = agents.filter(a => a.disponibilite?.toLowerCase().includes('disponible') || a.statut?.toLowerCase().includes('actif')).length;
  const indisponibles = agents.length - disponibles;
  const withFormation = agents.filter(a => a.formations && a.formations.length > 0).length;

  const handleExport = async () => {
    const res = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: selectedFile || undefined, options: { clean: true, includeStats: true } }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Agents_IA_Work_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Users className="w-7 h-7 text-blue-500" />
            Gestion des Agents & Planification
          </h1>
          <p className="text-slate-500 mt-1">Suivi des disponibilités, plannings optimisés et alertes automatiques</p>
        </div>
        <button onClick={handleExport} disabled={agents.length === 0} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 text-sm font-medium">
          <Download className="w-4 h-4" /> Exporter
        </button>
      </div>

      {/* Stats */}
      {agents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard title="Total agents" value={agents.length} icon={Users} color="blue" />
          <StatsCard title="Disponibles" value={disponibles} icon={UserCheck} color="green" />
          <StatsCard title="Indisponibles" value={indisponibles} icon={UserX} color="red" />
          <StatsCard title="Avec formation" value={withFormation} icon={Clock} color="purple" />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500">Filtres :</span>
          </div>

          <select value={selectedFile} onChange={e => handleFileChange(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500">
            <option value="">Sélectionner un fichier</option>
            {files.map(f => <option key={f.id} value={f.id}>{f.name} ({f.agentCount})</option>)}
          </select>

          {niveaux.length > 0 && (
            <select value={filterNiveau} onChange={e => setFilterNiveau(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500">
              <option value="">Tous les niveaux</option>
              {niveaux.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          )}

          {formations.length > 0 && (
            <select value={filterFormation} onChange={e => setFilterFormation(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500">
              <option value="">Toutes les formations</option>
              {formations.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          )}

          {(filterNiveau || filterFormation) && (
            <button onClick={() => { setFilterNiveau(''); setFilterFormation(''); }} className="text-xs text-blue-600 hover:text-blue-500">
              Effacer filtres
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {agents.length > 0 && indisponibles > agents.length * 0.2 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-amber-700 font-medium">Alerte : sous-effectif potentiel</p>
            <p className="text-sm text-slate-600">{indisponibles} agents indisponibles ({Math.round(indisponibles / agents.length * 100)}% de l&apos;effectif)</p>
          </div>
        </div>
      )}

      {/* Agent table */}
      {filteredAgents.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">{filteredAgents.length} agents</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Search className="w-4 h-4" /> Recherche intégrée dans le tableau
            </div>
          </div>
          <DataTable agents={filteredAgents} columns={['nom', 'prenom', 'niveau', 'formations', 'disponibilite', 'telephone', 'site', 'statut']} />
        </div>
      ) : (
        !loading && (
          <div className="text-center py-16 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3" />
            <p>{selectedFile ? 'Aucun agent correspondant aux filtres' : 'Sélectionnez un fichier pour voir les agents'}</p>
          </div>
        )
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      )}
    </div>
  );
}
