'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Sparkles, Search, Clock } from 'lucide-react';
import FileUploader from '@/components/FileUploader';
import DataTable from '@/components/DataTable';
import { Agent } from '@/types';

export default function PDFPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [fileId, setFileId] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [history, setHistory] = useState<Array<{ id: string; fileName: string; date: string; description: string }>>([]);

  useEffect(() => {
    fetch('/api/analyze').then(r => r.json()).then(d => {
      if (d.history) setHistory(d.history.filter((h: { type: string }) => h.type === 'import'));
    });
  }, []);

  const handleUploadComplete = async (result: { success: boolean; file?: { id: string; name: string; agentCount: number } }) => {
    if (result.success && result.file) {
      setFileId(result.file.id);
      setFileName(result.file.name);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'montre tous les agents', fileId: result.file.id }),
      });
      const data = await res.json();
      if (data.response?.data?.agents) setAgents(data.response.data.agents);
    }
  };

  const handleExportToExcel = async () => {
    if (!fileId) return;
    const res = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, options: { clean: true, includeStats: true } }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace(/\.[^.]+$/, '')}_converti.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <FileText className="w-7 h-7 text-red-500" />
          Module PDF & Documents Intelligent
        </h1>
        <p className="text-slate-500 mt-1">Extraction automatique, conversion PDF vers Excel, résumés et rapports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <FileUploader onUploadComplete={handleUploadComplete} />

          {agents.length > 0 && (
            <>
              <div className="flex gap-3">
                <button onClick={handleExportToExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm font-medium">
                  <Download className="w-4 h-4" /> Convertir en Excel structuré
                </button>
                <button onClick={() => fetch('/api/analyze', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ fileId, action: 'clean' }),
                })} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-400 text-sm font-medium">
                  <Sparkles className="w-4 h-4" /> Nettoyer les données
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-3">Données extraites du PDF ({agents.length} entrées)</h3>
                <DataTable agents={agents} />
              </div>
            </>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" /> Capacités
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2"><Search className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /> Extraction automatique de texte et tableaux</li>
              <li className="flex items-start gap-2"><Search className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /> Conversion PDF vers Excel structuré</li>
              <li className="flex items-start gap-2"><Search className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /> Identification des informations clés</li>
              <li className="flex items-start gap-2"><Search className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /> Détection d&apos;horaires et contrats</li>
              <li className="flex items-start gap-2"><Search className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /> Résumés et rapports automatiques</li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Documents traités
            </h3>
            {history.length > 0 ? (
              <div className="space-y-2">
                {history.slice(0, 8).map(h => (
                  <div key={h.id} className="py-2 border-b border-slate-100 last:border-0">
                    <p className="text-sm text-slate-700">{h.fileName}</p>
                    <p className="text-xs text-slate-400">{new Date(h.date).toLocaleString('fr-CA')}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Aucun document traité</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
