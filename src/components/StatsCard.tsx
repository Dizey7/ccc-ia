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
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', value: 'text-blue-700', iconBg: 'bg-blue-100' },
  green: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600', value: 'text-emerald-700', iconBg: 'bg-emerald-100' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', value: 'text-amber-700', iconBg: 'bg-amber-100' },
  red: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600', value: 'text-red-700', iconBg: 'bg-red-100' },
  purple: { bg: 'bg-violet-50', border: 'border-violet-200', icon: 'text-violet-600', value: 'text-violet-700', iconBg: 'bg-violet-100' },
};

export default function StatsCard({ title, value, subtitle, icon: Icon, color, trend }: StatsCardProps) {
  const c = colors[color];
  return (
    <div className={`${c.bg} border ${c.border} rounded-2xl p-5 transition-all hover:scale-[1.03] hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${c.value}`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-xs mt-2 font-medium ${trend.value >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${c.icon}`} />
        </div>
      </div>
    </div>
  );
}
