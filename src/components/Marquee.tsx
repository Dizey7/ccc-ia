'use client';

export default function Marquee() {
  const quotes = [
    "You Cwazy",
    "Je peux pas menti",
    "je pas domi",
  ];

  const repeated = [...quotes, ...quotes, ...quotes];

  return (
    <div className="fixed bottom-0 left-64 right-0 z-50 overflow-hidden bg-white border-t border-slate-200">
      <div className="flex animate-marquee whitespace-nowrap py-2.5">
        {repeated.map((quote, i) => (
          <span key={i} className="mx-12 text-sm font-medium">
            <span className="text-blue-500">&laquo;</span>
            <span className="text-slate-600 italic mx-2">{quote}</span>
            <span className="text-blue-500">&raquo;</span>
          </span>
        ))}
      </div>
    </div>
  );
}
