'use client';

import { useState, useEffect } from 'react';
import { Users, FileSpreadsheet, BarChart3, Bell, Upload, Clock, ArrowRight, Briefcase, Zap, Shield, TrendingUp } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import Link from 'next/link';

interface DashboardData {
  stats: { totalFiles: number; totalAgents: number; totalAnalyses: number; activeAlerts: number };
  files: Array<{ id: string; name: string; type: string; uploadDate: string; agentCount: number; status: string }>;
  history: Array<{ id: string; fileName: string; date: string; type: string; description: string }>;
  alerts: Array<{ id: string; type: string; title: string; message: string; date: string; read: boolean }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analyze')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const stats = data?.stats || { totalFiles: 0, totalAgents: 0, totalAnalyses: 0, activeAlerts: 0 };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <span className="text-blue-600">IA Work</span>
            <span className="text-slate-400 font-normal text-lg">- Tableau de Bord</span>
          </h1>
          <p className="text-slate-500 mt-1 ml-[52px]">Assistant intelligent de répartition - Sécurité Montréal</p>
        </div>
        <Link
          href="/upload"
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all shadow-md font-medium"
        >
          <Upload className="w-4 h-4" />
          Importer un fichier
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Fichiers importés" value={stats.totalFiles} icon={FileSpreadsheet} color="blue" subtitle="Total des fichiers" />
        <StatsCard title="Agents détectés" value={stats.totalAgents} icon={Users} color="green" subtitle="Dans tous les fichiers" />
        <StatsCard title="Analyses effectuées" value={stats.totalAnalyses} icon={BarChart3} color="purple" subtitle="Historique complet" />
        <StatsCard title="Alertes actives" value={stats.activeAlerts} icon={Bell} color={stats.activeAlerts > 0 ? 'red' : 'amber'} subtitle="À traiter" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/upload" className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">Importer & Analyser</h3>
          </div>
          <p className="text-sm text-slate-500">Déposez un fichier Excel, CSV ou PDF pour une analyse automatique par l&apos;IA</p>
        </Link>

        <Link href="/chat" className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">Chat IA</h3>
          </div>
          <p className="text-sm text-slate-500">Posez des questions en langage naturel sur vos données d&apos;agents</p>
        </Link>

        <Link href="/excel" className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-amber-300 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-800 group-hover:text-amber-600 transition-colors">Expert Excel</h3>
          </div>
          <p className="text-sm text-slate-500">Nettoyage, tableaux croisés, rapports et exports automatiques</p>
        </Link>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Files */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Fichiers récents</h3>
            <Link href="/history" className="text-sm text-blue-600 hover:text-blue-500 flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {data?.files && data.files.length > 0 ? (
            <div className="space-y-3">
              {data.files.slice(0, 5).map(file => (
                <div key={file.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className={`w-5 h-5 ${file.type === 'excel' ? 'text-emerald-500' : file.type === 'pdf' ? 'text-red-500' : 'text-blue-500'}`} />
                    <div>
                      <p className="text-sm text-slate-800 font-medium">{file.name}</p>
                      <p className="text-xs text-slate-400">{file.agentCount} agents • {new Date(file.uploadDate).toLocaleDateString('fr-CA')}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${file.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    {file.status === 'completed' ? 'Analysé' : 'En cours'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Aucun fichier importé</p>
              <Link href="/upload" className="text-sm text-blue-600 hover:text-blue-500 mt-1 inline-block">Importer votre premier fichier</Link>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Activité récente</h3>
            <Link href="/history" className="text-sm text-blue-600 hover:text-blue-500 flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {data?.history && data.history.length > 0 ? (
            <div className="space-y-3">
              {data.history.slice(0, 5).map(item => (
                <div key={item.id} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-600">{item.description}</p>
                    <p className="text-xs text-slate-400">{new Date(item.date).toLocaleString('fr-CA')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Aucune activité récente</p>
            </div>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Chargement du tableau de bord...</p>
        </div>
      )}

      {!loading && stats.totalFiles === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center">Capacités de IA Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Shield, title: 'Analyse automatique', desc: 'Import et analyse de fichiers Excel, CSV et PDF avec détection intelligente des colonnes', color: 'text-blue-600' },
              { icon: Zap, title: 'Chat IA', desc: 'Questions en langage naturel sur vos données d\'agents avec réponses instantanées', color: 'text-emerald-600' },
              { icon: FileSpreadsheet, title: 'Expert Excel', desc: 'Nettoyage, tableaux croisés dynamiques, rapports et exports professionnels', color: 'text-amber-600' },
              { icon: TrendingUp, title: 'Statistiques', desc: 'Analyses prédictives, tendances et recommandations pour la répartition', color: 'text-violet-600' },
            ].map(cap => (
              <div key={cap.title} className="text-center p-4">
                <cap.icon className={`w-8 h-8 ${cap.color} mx-auto mb-2`} />
                <h4 className="font-medium text-slate-800 text-sm mb-1">{cap.title}</h4>
                <p className="text-xs text-slate-500">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
