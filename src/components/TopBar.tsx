'use client';

import LiveClock from './LiveClock';
import { Briefcase } from 'lucide-react';

export default function TopBar() {
  return (
    <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Briefcase className="w-4 h-4 text-blue-600" />
        <span className="text-sm text-slate-500 font-medium">Dispatch Intelligence System</span>
      </div>
      <LiveClock />
    </div>
  );
}
