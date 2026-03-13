'use client';

import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'amber' | 'red' | 'purple';
  trend?: { value: number; label: string };
}

const colors = {
  blue: { gradient: 'from-cyan-500/15 to-blue-500/15', border: 'border-cyan-500/25', icon: 'text-cyan-400', value: 'text-cyan-400', iconBg: 'from-cyan-500/20 to-blue-500/20' },
  green: { gradient: 'from-emerald-500/15 to-teal-500/15', border: 'border-emerald-500/25', icon: 'text-emerald-400', value: 'text-emerald-400', iconBg: 'from-emerald-500/20 to-teal-500/20' },
  amber: { gradient: 'from-amber-500/15 to-orange-500/15', border: 'border-amber-500/25', icon: 'text-amber-400', value: 'text-amber-400', iconBg: 'from-amber-500/20 to-orange-500/20' },
  red: { gradient: 'from-red-500/15 to-rose-500/15', border: 'border-red-500/25', icon: 'text-red-400', value: 'text-red-400', iconBg: 'from-red-500/20 to-rose-500/20' },
  purple: { gradient: 'from-violet-500/15 to-purple-500/15', border: 'border-violet-500/25', icon: 'text-violet-400', value: 'text-violet-400', iconBg: 'from-violet-500/20 to-purple-500/20' },
};

export default function StatsCard({ title, value, subtitle, icon: Icon, color, trend }: StatsCardProps) {
  const c = colors[color];
  return (
    <div className={`bg-gradient-to-br ${c.gradient} border ${c.border} rounded-2xl p-5 transition-all hover:scale-[1.03] hover:shadow-lg`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 font-medium">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${c.value}`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-xs mt-2 font-medium ${trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.iconBg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${c.icon}`} />
        </div>
      </div>
    </div>
  );
}
