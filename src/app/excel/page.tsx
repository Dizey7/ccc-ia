'use client';

import { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, Sparkles, Table2, BarChart3, ClipboardCheck, RefreshCw, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import FileUploader from '@/components/FileUploader';
import DataTable from '@/components/DataTable';
import { Agent, FileSummary } from '@/types';

interface FileInfo {
  id: string;
  name: string;
  agentCount: number;
  summary: FileSummary;
}

export default function ExcelPage() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [cleanLog, setCleanLog] = useState<string[]>([]);
  const [anomalies, setAnomalies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'clean' | 'pivot' | 'report' | 'anomalies'>('upload');

  useEffect(() => {
    fetch('/api/analyze').then(r => r.json()).then(d => {
      if (d.files) setFiles(d.files.filter((f: FileInfo) => f.agentCount > 0));
    });
  }, []);

  const handleUploadComplete = async (result: Record<string, unknown>) => {
    const r = result as { success: boolean; file?: FileInfo };
    if (r.success && r.file) {
      setFiles(prev => [r.file!, ...prev]);
      setSelectedFile(r.file.id);
      await loadAgents(r.file.id);
    }
  };

  const loadAgents = async (fileId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'montre tous les agents', fileId }),
      });
      const data = await res.json();
      if (data.response?.data?.agents) setAgents(data.response.data.agents);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const handleClean = async () => {
    if (!selectedFile) return;
    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: selectedFile, action: 'clean' }),
      });
      const data = await res.json();
      if (data.success) {
        setCleanLog(data.changes);
        await loadAgents(selectedFile);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const handleDetectAnomalies = async () => {
    if (!selectedFile) return;
    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: selectedFile, action: 'anomalies' }),
      });
      const data = await res.json();
      setAnomalies(data.anomalies || []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const handleExport = async (options: Record<string, unknown> = {}) => {
    if (!selectedFile) return;
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: selectedFile, options: { clean: true, includeStats: true, ...options } }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IA_Work_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  };

  const tabs = [
    { id: 'upload' as const, label: 'Import', icon: FileSpreadsheet },
    { id: 'clean' as const, label: 'Nettoyage', icon: Sparkles },
    { id: 'pivot' as const, label: 'Tableaux croisés', icon: Table2 },
    { id: 'report' as const, label: 'Rapports', icon: BarChart3 },
    { id: 'anomalies' as const, label: 'Anomalies', icon: AlertTriangle },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
          Module Expert Excel Ultra-Automatique
        </h1>
        <p className="text-slate-500 mt-1">Nettoyage, formules, tableaux croisés, graphiques et rapports automatiques</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800 hover:bg-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* File selector */}
      {files.length > 0 && activeTab !== 'upload' && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-500">Fichier :</label>
          <select
            value={selectedFile || ''}
            onChange={e => { setSelectedFile(e.target.value); loadAgents(e.target.value); }}
            className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
          >
            <option value="">Sélectionner un fichier</option>
            {files.map(f => (
              <option key={f.id} value={f.id}>{f.name} ({f.agentCount} agents)</option>
            ))}
          </select>
        </div>
      )}

      {/* Upload tab */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          <FileUploader onUploadComplete={handleUploadComplete} />
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-3">Workflow automatique</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">1. Dépôt</span>
              <ArrowRight className="w-4 h-4" />
              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded font-medium">2. Analyse IA</span>
              <ArrowRight className="w-4 h-4" />
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded font-medium">3. Nettoyage</span>
              <ArrowRight className="w-4 h-4" />
              <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded font-medium">4. Rapports</span>
              <ArrowRight className="w-4 h-4" />
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-medium">5. Alertes</span>
            </div>
          </div>
        </div>
      )}

      {/* Clean tab */}
      {activeTab === 'clean' && selectedFile && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <button onClick={handleClean} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-400 disabled:opacity-50 text-sm font-medium">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Nettoyer et optimiser
            </button>
            <button onClick={() => handleExport({ clean: true })} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm font-medium">
              <Download className="w-4 h-4" />
              Exporter nettoyé
            </button>
          </div>

          {cleanLog.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <h4 className="text-emerald-700 font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> {cleanLog.length} corrections appliquées
              </h4>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {cleanLog.map((log, i) => (
                  <p key={i} className="text-xs text-slate-600">- {log}</p>
                ))}
              </div>
            </div>
          )}

          {agents.length > 0 && <DataTable agents={agents} />}
        </div>
      )}

      {/* Pivot tab */}
      {activeTab === 'pivot' && selectedFile && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">Générer un tableau croisé dynamique</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button onClick={() => handleExport({ includePivot: true, pivotConfig: { rowField: 'niveau', valueField: 'nom', aggregation: 'count' } })}
                className="p-4 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all text-left">
                <Table2 className="w-6 h-6 text-blue-600 mb-2" />
                <p className="text-sm font-medium text-slate-800">Par Niveau</p>
                <p className="text-xs text-slate-500">Répartition des agents par niveau</p>
              </button>
              <button onClick={() => handleExport({ includePivot: true, pivotConfig: { rowField: 'site', valueField: 'nom', aggregation: 'count' } })}
                className="p-4 bg-white border border-slate-200 rounded-lg hover:border-emerald-400 hover:shadow-md transition-all text-left">
                <Table2 className="w-6 h-6 text-emerald-600 mb-2" />
                <p className="text-sm font-medium text-slate-800">Par Site</p>
                <p className="text-xs text-slate-500">Agents par site/emplacement</p>
              </button>
              <button onClick={() => handleExport({ includePivot: true, pivotConfig: { rowField: 'niveau', valueField: 'heuresTravaillees', aggregation: 'sum' } })}
                className="p-4 bg-white border border-slate-200 rounded-lg hover:border-amber-400 hover:shadow-md transition-all text-left">
                <Table2 className="w-6 h-6 text-amber-600 mb-2" />
                <p className="text-sm font-medium text-slate-800">Heures par Niveau</p>
                <p className="text-xs text-slate-500">Total heures travaillées par niveau</p>
              </button>
            </div>
          </div>
          {agents.length > 0 && <DataTable agents={agents} />}
        </div>
      )}

      {/* Report tab */}
      {activeTab === 'report' && selectedFile && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => handleExport({ includeStats: true })} className="p-5 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all text-left">
              <BarChart3 className="w-8 h-8 text-blue-600 mb-3" />
              <h4 className="font-medium text-slate-800">Rapport complet</h4>
              <p className="text-sm text-slate-500 mt-1">Excel avec agents, statistiques et heures travaillées</p>
            </button>
            <button onClick={() => handleExport({ clean: true, includeStats: true })} className="p-5 bg-white border border-slate-200 rounded-xl hover:border-emerald-400 hover:shadow-md transition-all text-left">
              <ClipboardCheck className="w-8 h-8 text-emerald-600 mb-3" />
              <h4 className="font-medium text-slate-800">Rapport nettoyé</h4>
              <p className="text-sm text-slate-500 mt-1">Données nettoyées + statistiques + filtres automatiques</p>
            </button>
          </div>
        </div>
      )}

      {/* Anomalies tab */}
      {activeTab === 'anomalies' && selectedFile && (
        <div className="space-y-4">
          <button onClick={handleDetectAnomalies} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            Détecter les anomalies
          </button>

          {anomalies.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <h4 className="text-red-700 font-medium mb-3">{anomalies.length} anomalies détectées</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {anomalies.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-white border border-red-100 rounded">
                    <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-700">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {anomalies.length === 0 && !loading && (
            <div className="text-center py-8 text-slate-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
              <p>Cliquez sur &quot;Détecter les anomalies&quot; pour analyser les données</p>
            </div>
          )}
        </div>
      )}

      {!selectedFile && activeTab !== 'upload' && (
        <div className="text-center py-12 text-slate-400">
          <FileSpreadsheet className="w-12 h-12 mx-auto mb-3" />
          <p>Sélectionnez un fichier ou importez-en un nouveau</p>
        </div>
      )}
    </div>
  );
}
