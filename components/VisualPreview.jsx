
export default function VisualPreview() {
  // Simulated dashboard: glass card, checkmarks, doc icons
  return (
    <div className="relative w-full max-w-xs sm:max-w-sm mx-auto flex flex-col bg-gradient-to-tr from-white/80 to-fuchsia-50/80 dark:from-slate-900/80 dark:to-fuchsia-900/70 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 backdrop-blur-md py-3 px-3">
      <div className="flex items-center mb-2">
        <span className="inline-block bg-emerald-200 text-emerald-700 rounded-full text-xs px-3 py-1 font-bold mr-2">Contrato</span>
        <span className="inline-block bg-fuchsia-200 text-fuchsia-800 rounded-full text-xs px-3 py-1 font-bold">INE</span>
      </div>
      <div className="flex flex-col gap-2">
        <DashboardRow label="Currículum" complete />
        <DashboardRow label="Domicilio" complete />
        <DashboardRow label="Acta de Nacimiento" />
        <DashboardRow label="RFC (SAT)" />
        <DashboardRow label="Firma Digital" pending />
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs text-slate-500 dark:text-slate-400">Estado:</span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-100 text-xs font-semibold">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="6" stroke="currentColor" className="text-cyan-400" fill="currentColor" />
          </svg>
          Progreso 2 de 5
        </span>
      </div>
    </div>
  );
}

function DashboardRow({ label, complete, pending }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-xl border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-800/50 shadow-sm">
      <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      {complete ? (
        <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M16.704 7.293a1 1 0 0 1 0 1.414l-6.007 6.007a1 1 0 0 1-1.414 0l-3.003-3.003a1 1 0 0 1 1.414-1.414l2.296 2.297 5.3-5.301a1 1 0 0 1 1.414 0z" clipRule="evenodd" />
        </svg>
      ) : pending ? (
        <svg className="w-5 h-5 text-cyan-400 animate-pulse" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <circle cx="10" cy="10" r="6" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 20 20" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 10h8" />
        </svg>
      )}
    </div>
  );
}
