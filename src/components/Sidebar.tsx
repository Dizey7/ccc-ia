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
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-40">
      <div className="p-5 border-b border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">CCC IA</h1>
            <p className="text-xs text-gray-400">Assistant Intelligent</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-400">Répartition Sécurité</p>
          <p className="text-sm text-white font-medium">~590 agents sur appel</p>
          <p className="text-xs text-gray-500 mt-1">Montréal, QC</p>
        </div>
      </div>
    </aside>
  );
}
