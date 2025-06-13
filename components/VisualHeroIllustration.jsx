
export default function VisualHeroIllustration() {
  // Abstracted visual: floating docs, checkmarks, signature pen
  return (
    <div className="relative w-full max-w-[290px] xs:max-w-xs md:max-w-xs aspect-[1/1.04] flex flex-col justify-center items-center select-none pointer-events-none">
      {/* floating paper icon "cards" */}
      <div className="absolute left-0 top-7 rotate-[-15deg] bg-white/90 ring-1 ring-fuchsia-100 dark:ring-fuchsia-900 rounded-lg px-3 py-2 shadow-md flex gap-2 items-center animate-float-doc1 z-10">
        <DocIcon /> <span className="text-xs font-bold text-fuchsia-700">INE</span>
      </div>
      <div className="absolute top-0 right-1 rotate-[10deg] bg-white/80 ring-1 ring-teal-100 dark:ring-teal-900 rounded-lg px-3 py-2 shadow-md flex gap-2 items-center animate-float-doc2 z-10">
        <DocIcon /> <span className="text-xs font-bold text-cyan-700">Contrato</span>
      </div>
      <div className="absolute left-6 bottom-6 rotate-[8deg] bg-white/70 ring-1 ring-cyan-100 dark:ring-cyan-800 rounded px-2 py-1 shadow flex gap-1 items-center animate-float-doc3 z-10">
        <DocIcon /> <span className="text-xs text-emerald-800 font-medium">CURP</span>
      </div>
      {/* Checkmark group */}
      <div className="absolute right-4 bottom-9 flex flex-col gap-3 z-10">
        {Array.from({ length: 3 }).map((_, i) => (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 bg-emerald-50 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-200 text-xs shadow-md" key={i}>
            <CheckmarkIcon /> Aprobado
          </span>
        ))}
      </div>
      {/* Central hero pen */}
      <div className="relative z-0 flex flex-col items-center">
        <img
          src="/mifiel-pen.png"
          className="mt-10 mb-2 w-16 h-16 xs:w-20 xs:h-20 mx-auto drop-shadow-lg"
          width={72}
          height={72}
          alt="Firma digital"
          draggable={false}
        />
        <span className="font-fredoka font-semibold text-fuchsia-800 dark:text-fuchsia-300 text-base">
          Firma Digital
        </span>
      </div>
      {/* CSS animation */}
      <style>{`
        @keyframes float-doc1 { 0% { transform:translateY(0) rotate(-15deg);} 50% {transform:translateY(-8px) rotate(-13deg);} 100% {transform:translateY(0) rotate(-15deg);} }
        @keyframes float-doc2 { 0% { transform:translateY(0) rotate(10deg);} 50% {transform:translateY(-6px) rotate(13deg);} 100% {transform:translateY(0) rotate(10deg);} }
        @keyframes float-doc3 { 0% { transform:translateY(0) rotate(8deg);} 50% {transform:translateY(6px) rotate(4deg);} 100% {transform:translateY(0) rotate(8deg);} }
        .animate-float-doc1 { animation: float-doc1 3.3s ease-in-out infinite;}
        .animate-float-doc2 { animation: float-doc2 3.55s ease-in-out infinite; }
        .animate-float-doc3 { animation: float-doc3 4s ease-in-out infinite;}
      `}</style>
    </div>
  );
}

function DocIcon() {
  return (
    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 20 20">
      <rect x="4" y="3" width="12" height="14" rx="2.5" stroke="currentColor" fill="white" />
      <rect x="6" y="6.2" width="8" height="1.1" rx="0.5" fill="#f0c7f9" />
      <rect x="6" y="9" width="7" height="1" rx="0.5" fill="#dbeafe" />
    </svg>
  );
}

function CheckmarkIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M16.704 7.293a1 1 0 0 1 0 1.414l-6.007 6.007a1 1 0 0 1-1.414 0l-3.003-3.003a1 1 0 0 1 1.414-1.414l2.296 2.297 5.3-5.301a1 1 0 0 1 1.414 0z" clipRule="evenodd" />
    </svg>
  );
}
