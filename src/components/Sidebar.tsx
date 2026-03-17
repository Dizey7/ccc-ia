'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Upload, FileSpreadsheet, FileText, MessageSquare,
  Users, BarChart3, Bell, History, Briefcase, PenTool
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/upload', label: 'Importer fichier', icon: Upload },
  { href: '/excel', label: 'Expert Excel', icon: FileSpreadsheet },
  { href: '/excel-edit', label: 'Modifier Excel', icon: PenTool },
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
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 flex flex-col z-40">
      {/* Logo */}
      <div className="p-5 border-b border-slate-200">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-blue-600">IA Work</h1>
            <p className="text-xs text-slate-400">Assistant Intelligent</p>
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
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : ''}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
          <p className="text-xs text-blue-600 font-medium">Répartition Sécurité</p>
          <p className="text-sm text-slate-800 font-bold mt-0.5">~590 agents sur appel</p>
          <p className="text-xs text-slate-400 mt-1">Montréal, QC</p>
        </div>
      </div>
    </aside>
  );
}
