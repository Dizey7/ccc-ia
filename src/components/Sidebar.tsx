'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Upload, FileSpreadsheet, FileText, MessageSquare,
  Users, BarChart3, Bell, History, Bot
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/upload', label: 'Importer fichier', icon: Upload },
  { href: '/excel', label: 'Expert Excel', icon: FileSpreadsheet },
  { href: '/pdf', label: 'Module PDF', icon: FileText },
  { href: '/chat', label: 'Chat IA', icon: MessageSquare },
  { href: '/agents', label: 'Gestion agents', icon: Users },
  { href: '/statistics', label: 'Statistiques', icon: BarChart3 },
  { href: '/alerts', label: 'Alertes', icon: Bell },
  { href: '/history', label: 'Historique', icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-white/10 flex flex-col z-40">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">CCC IA</h1>
            <p className="text-xs text-slate-500">Assistant Intelligent</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-cyan-400' : ''}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-3">
          <p className="text-xs text-cyan-400 font-medium">Répartition Sécurité</p>
          <p className="text-sm text-white font-bold mt-0.5">~590 agents sur appel</p>
          <p className="text-xs text-slate-500 mt-1">Montréal, QC</p>
        </div>
      </div>
    </aside>
  );
}
