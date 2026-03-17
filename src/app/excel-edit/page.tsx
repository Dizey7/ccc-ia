'use client';

import { useState, useEffect } from 'react';
import { PenTool, Send, Download, CheckCircle, AlertCircle, Loader2, FileSpreadsheet, History, Trash2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import { Agent } from '@/types';

interface CommandHistory {
  command: string;
  success: boolean;
  description: string;
  changes: string[];
  timestamp: string;
}

export default function ExcelEditPage() {
  const [files, setFiles] = useState<Array<{ id: string; name: string; agentCount: number }>>([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [lastResult, setLastResult] = useState<{ success: boolean; description: string; changes: string[] } | null>(null);

  useEffect(() => {
    fetch('/api/analyze').then(r => r.json()).then(d => {
      if (d.files) setFiles(d.files.filter((f: { agentCount: number }) => f.agentCount > 0));
    });
  }, []);

  const loadAgents = async (fileId: string) => {
    if (!fileId) return;
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

  const handleFileChange = (fileId: string) => {
    setSelectedFile(fileId);
    setHistory([]);
    setLastResult(null);
    loadAgents(fileId);
  };

  const executeCommand = async () => {
    if (!command.trim() || !selectedFile) return;
    setLoading(true);
    setLastResult(null);

    try {
      const res = await fetch('/api/excel-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: selectedFile, command: command.trim() }),
      });
      const data = await res.json();

      const entry: CommandHistory = {
        command: command.trim(),
        success: data.success,
        description: data.description,
        changes: data.changes || [],
        timestamp: new Date().toLocaleTimeString('fr-CA'),
      };

      setHistory(prev => [entry, ...prev]);
      setLastResult({ success: data.success, description: data.description, changes: data.changes || [] });

      if (data.success && data.agents) {
        setAgents(data.agents);
      }

      setCommand('');
    } catch {
      setLastResult({ success: false, description: 'Erreur de connexion', changes: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedFile) return;
    try {
      const res = await fetch('/api/excel-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: selectedFile, action: 'export' }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IA_Work_Modified_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeCommand();
    }
  };

  const suggestions = [
    "Trie par nom",
    "Supprime les doublons",
    "Supprime les lignes vides",
    "Mets les noms en majuscule",
    "Nettoie les espaces",
    "Filtre les agents disponibles",
    "Ajoute colonne Salaire",
    "Capitalise les prénoms",
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <PenTool className="w-7 h-7 text-blue-600" />
            Modifier Excel en Langage Naturel
          </h1>
          <p className="text-slate-500 mt-1">Décrivez les modifications en français et elles seront appliquées automatiquement</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedFile}
            onChange={e => handleFileChange(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
          >
            <option value="">Sélectionner un fichier</option>
            {files.map(f => (
              <option key={f.id} value={f.id}>{f.name} ({f.agentCount} agents)</option>
            ))}
          </select>
          {selectedFile && agents.length > 0 && (
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm font-medium">
              <Download className="w-4 h-4" /> Exporter
            </button>
          )}
        </div>
      </div>

      {!selectedFile && (
        <div className="text-center py-16 text-slate-400">
          <FileSpreadsheet className="w-12 h-12 mx-auto mb-3" />
          <p>Sélectionnez un fichier pour commencer les modifications</p>
        </div>
      )}

      {selectedFile && (
        <>
          {/* Command input */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <label className="text-sm font-medium text-slate-700 mb-2 block">Commande de modification</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={command}
                onChange={e => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='Ex: "Trie par nom", "Supprime les doublons", "Ajoute colonne Salaire"...'
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                disabled={loading}
              />
              <button
                onClick={executeCommand}
                disabled={loading || !command.trim()}
                className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Appliquer
              </button>
            </div>

            {/* Suggestions */}
            <div className="flex flex-wrap gap-2 mt-3">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => setCommand(s)}
                  className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Last result */}
          {lastResult && (
            <div className={`rounded-xl p-4 flex items-start gap-3 ${lastResult.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
              {lastResult.success ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`font-medium ${lastResult.success ? 'text-emerald-700' : 'text-red-700'}`}>
                  {lastResult.description}
                </p>
                {lastResult.changes.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {lastResult.changes.map((c, i) => (
                      <li key={i} className="text-sm text-slate-600">- {c}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Data preview */}
            <div className="lg:col-span-3">
              {agents.length > 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800">Aperçu des données ({agents.length} agents)</h3>
                  </div>
                  <DataTable agents={agents} maxRows={25} />
                </div>
              ) : (
                loading && (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                  </div>
                )
              )}
            </div>

            {/* Command history */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                    <History className="w-4 h-4" /> Historique
                  </h4>
                  {history.length > 0 && (
                    <button onClick={() => setHistory([])} className="text-xs text-slate-400 hover:text-red-500">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {history.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {history.map((h, i) => (
                      <div key={i} className={`p-2 rounded-lg text-xs ${h.success ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
                        <p className="font-medium text-slate-700">{h.command}</p>
                        <p className="text-slate-500 mt-0.5">{h.description}</p>
                        <p className="text-slate-400 mt-0.5">{h.timestamp}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">Aucune modification encore</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-blue-800 text-sm mb-2">Commandes disponibles</h4>
                <ul className="space-y-1 text-xs text-blue-700">
                  <li>Trier par [colonne]</li>
                  <li>Supprimer les doublons</li>
                  <li>Supprimer les lignes vides</li>
                  <li>Ajouter colonne [nom]</li>
                  <li>Supprimer colonne [nom]</li>
                  <li>Renommer colonne &quot;X&quot; en &quot;Y&quot;</li>
                  <li>Remplacer &quot;X&quot; par &quot;Y&quot;</li>
                  <li>Mettre en majuscule [col]</li>
                  <li>Capitaliser les [col]</li>
                  <li>Filtrer [condition]</li>
                  <li>Nettoyer les espaces</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
