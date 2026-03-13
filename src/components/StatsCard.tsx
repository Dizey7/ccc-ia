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
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: 'text-blue-400', value: 'text-blue-400' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/30', icon: 'text-green-400', value: 'text-green-400' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: 'text-amber-400', value: 'text-amber-400' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/30', icon: 'text-red-400', value: 'text-red-400' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: 'text-purple-400', value: 'text-purple-400' },
};

export default function StatsCard({ title, value, subtitle, icon: Icon, color, trend }: StatsCardProps) {
  const c = colors[color];
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-5 transition-all hover:scale-[1.02]`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 font-medium">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${c.value}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-xs mt-2 ${trend.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${c.icon}`} />
        </div>
      </div>
    </div>
  );
}
