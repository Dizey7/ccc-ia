'use client';

import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

interface AlertItem {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  date: string;
  read: boolean;
  category: string;
}

const typeConfig = {
  warning: { icon: AlertTriangle, bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  error: { icon: AlertCircle, bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
  info: { icon: Info, bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  success: { icon: CheckCircle, bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetch('/api/analyze').then(r => r.json()).then(d => {
      if (d.alerts) setAlerts(d.alerts);
    });
  }, []);

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.type === filter);
  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Bell className="w-7 h-7 text-amber-400" />
            Alertes Intelligentes
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-600 text-white rounded-full text-sm">{unreadCount}</span>
            )}
          </h1>
          <p className="text-gray-400 mt-1">Notifications automatiques, erreurs et recommandations</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'error', 'warning', 'info', 'success'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {f === 'all' ? 'Toutes' : f === 'error' ? 'Erreurs' : f === 'warning' ? 'Avertissements' : f === 'info' ? 'Infos' : 'Succès'}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map(alert => {
            const config = typeConfig[alert.type];
            const Icon = config.icon;
            return (
              <div key={alert.id} className={`${config.bg} border ${config.border} rounded-xl p-4 flex items-start gap-4 ${!alert.read ? 'ring-1 ring-white/10' : 'opacity-80'}`}>
                <Icon className={`w-5 h-5 ${config.text} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium ${config.text}`}>{alert.title}</h4>
                    <div className="flex items-center gap-2">
                      {!alert.read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                      <span className="text-xs text-gray-500">{new Date(alert.date).toLocaleString('fr-CA')}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{alert.message}</p>
                  <span className="text-xs text-gray-600 mt-2 inline-block px-2 py-0.5 bg-gray-800 rounded">{alert.category}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3" />
            <p>Aucune alerte pour le moment</p>
            <p className="text-sm mt-1">Les alertes apparaîtront automatiquement lors de l&apos;analyse des fichiers</p>
          </div>
        )}
      </div>
    </div>
  );
}
