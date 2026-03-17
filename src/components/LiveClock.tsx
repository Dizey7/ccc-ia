'use client';

import { useState, useEffect } from 'react';
import { Clock, CalendarDays } from 'lucide-react';

export default function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = now.toLocaleDateString('fr-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeStr = now.toLocaleTimeString('fr-CA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
      <div className="flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-blue-500" />
        <span className="text-sm text-slate-600 capitalize">{dateStr}</span>
      </div>
      <div className="w-px h-5 bg-slate-200" />
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-mono text-slate-800 font-semibold tracking-wider">{timeStr}</span>
      </div>
    </div>
  );
}
