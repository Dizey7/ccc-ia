'use client';

import LiveClock from './LiveClock';
import { Zap } from 'lucide-react';

export default function TopBar() {
  return (
    <div className="sticky top-0 z-30 backdrop-blur-md bg-slate-900/70 border-b border-white/10 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-cyan-400" />
        <span className="text-sm text-slate-400">Dispatch Intelligence System</span>
      </div>
      <LiveClock />
    </div>
  );
}
