'use client';

export default function Marquee() {
  const quotes = [
    "You Cwazy",
    "Je peux pas menti",
    "je pas domi",
  ];

  // Repeat quotes for seamless loop
  const repeated = [...quotes, ...quotes, ...quotes];

  return (
    <div className="fixed bottom-0 left-64 right-0 z-50 overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-cyan-500/20">
      <div className="flex animate-marquee whitespace-nowrap py-2.5">
        {repeated.map((quote, i) => (
          <span key={i} className="mx-12 text-sm font-medium">
            <span className="text-cyan-400">&laquo;</span>
            <span className="text-slate-200 italic mx-2">{quote}</span>
            <span className="text-cyan-400">&raquo;</span>
          </span>
        ))}
      </div>
    </div>
  );
}
