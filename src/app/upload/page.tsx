'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, ArrowRight } from 'lucide-react';
import FileUploader from '@/components/FileUploader';
import DataTable from '@/components/DataTable';
import Link from 'next/link';
import { Agent, FileSummary } from '@/types';

interface UploadResult {
  success: boolean;
  file?: {
    id: string;
    name: string;
    type: string;
    agentCount: number;
    columns: string[];
    summary: FileSummary;
  };
}

export default function UploadPage() {
  const [result, setResult] = useState<UploadResult | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);

  const handleUploadComplete = async (uploadResult: UploadResult) => {
    setResult(uploadResult);
    if (uploadResult.success && uploadResult.file) {
      setLoading(true);
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: uploadResult.file.id, action: 'stats' }),
        });
        await res.json();
        const chatRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'montre tous les agents', fileId: uploadResult.file.id }),
        });
        const chatData = await chatRes.json();
        if (chatData.response?.data?.agents) {
          setAgents(chatData.response.data.agents);
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    }
  };

  const handleExport = async () => {
    if (!result?.file) return;
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: result.file.id, options: { clean: true, includeStats: true } }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.file.name.replace(/\.[^.]+$/, '')}_IA_Work.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  };

  const handleClean = async () => {
    if (!result?.file) return;
    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: result.file.id, action: 'clean' }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Nettoyage terminé: ${data.changes.length} corrections appliquées`);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <Upload className="w-7 h-7 text-blue-500" />
          Importer & Analyser un Fichier
        </h1>
        <p className="text-slate-500 mt-1">
          Déposez un fichier Excel, CSV ou PDF. L&apos;IA analysera automatiquement les données.
        </p>
      </div>

      <FileUploader onUploadComplete={handleUploadComplete} />

      {result?.success && result.file && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Résumé de l&apos;analyse</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-slate-500">Total agents</p>
                <p className="text-2xl font-bold text-blue-600">{result.file.summary?.totalAgents || result.file.agentCount}</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                <p className="text-xs text-slate-500">Colonnes détectées</p>
                <p className="text-2xl font-bold text-emerald-600">{result.file.columns?.length || 0}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                <p className="text-xs text-slate-500">Doublons supprimés</p>
                <p className="text-2xl font-bold text-amber-600">{result.file.summary?.duplicates || 0}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                <p className="text-xs text-slate-500">Anomalies</p>
                <p className="text-2xl font-bold text-red-600">{result.file.summary?.anomalies?.length || 0}</p>
              </div>
            </div>

            {/* Formations & Niveaux */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {result.file.summary?.formations && Object.keys(result.file.summary.formations).length > 0 && (
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-2">Formations détectées</p>
                  <div className="space-y-1">
                    {Object.entries(result.file.summary.formations).sort((a, b) => b[1] - a[1]).map(([f, c]) => (
                      <div key={f} className="flex justify-between">
                        <span className="text-sm text-amber-700">{f}</span>
                        <span className="text-sm text-slate-500">{c} agents</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {result.file.summary?.niveaux && Object.keys(result.file.summary.niveaux).length > 0 && (
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-2">Niveaux détectés</p>
                  <div className="space-y-1">
                    {Object.entries(result.file.summary.niveaux).sort((a, b) => b[1] - a[1]).map(([n, c]) => (
                      <div key={n} className="flex justify-between">
                        <span className="text-sm text-blue-700">{n}</span>
                        <span className="text-sm text-slate-500">{c} agents</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Errors and Anomalies */}
            {(result.file.summary?.errors?.length > 0 || result.file.summary?.anomalies?.length > 0) && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm font-medium text-red-700 mb-2">Problèmes détectés</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {[...(result.file.summary?.errors || []), ...(result.file.summary?.anomalies || [])].map((e, i) => (
                    <p key={i} className="text-xs text-slate-600">- {e}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button onClick={handleClean} disabled={loading} className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-400 disabled:opacity-50 flex items-center gap-2 text-sm font-medium">
              <FileSpreadsheet className="w-4 h-4" />
              Nettoyer & Optimiser
            </button>
            <button onClick={handleExport} disabled={loading} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2 text-sm font-medium">
              <FileSpreadsheet className="w-4 h-4" />
              Exporter Excel propre
            </button>
            <Link href={`/chat`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 flex items-center gap-2 text-sm font-medium">
              Poser des questions <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Data Table */}
          {agents.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Données analysées ({agents.length} agents)</h3>
              <DataTable agents={agents} />
            </div>
          )}

          {loading && (
            <div className="text-center py-4">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
