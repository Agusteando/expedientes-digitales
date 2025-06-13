
// Simple stub content for Reglamento and Contrato preview until official PDFs/texts are provided

export function StubReglamento() {
  return (
    <div className="w-full bg-gradient-to-br from-cyan-100/70 via-white/75 to-teal-50/50 dark:from-sky-900 dark:via-slate-900 dark:to-teal-900 rounded-xl border border-cyan-200 dark:border-teal-950 px-4 py-4 text-[13px] xs:text-sm text-slate-700 dark:text-slate-200 mb-3 shadow-sm max-h-[200px] overflow-auto font-mono select-text">
      <h2 className="text-cyan-800 dark:text-teal-200 font-bold text-base mb-1">Reglamento Interno IECS-IEDIS (fragmento ejemplo)</h2>
      <ol className="list-decimal ml-4 space-y-1">
        <li>Presentarse puntualmente y cumplir con el horario laboral.</li>
        <li>Portar gafete de identificación durante su estancia.</li>
        <li>Se prohíbe fumar y consumir bebidas alcohólicas en el recinto.</li>
        <li>Actuar con respeto, cordialidad y sin discriminación hacia los compañeros.</li>
        <li>El contenido total se mostrará aquí con el documento oficial.</li>
      </ol>
    </div>
  );
}

export function StubContrato() {
  return (
    <div className="w-full bg-gradient-to-br from-fuchsia-100/70 via-white/75 to-purple-50/60 dark:from-fuchsia-900 dark:via-slate-900 dark:to-purple-900 rounded-xl border border-fuchsia-200 dark:border-purple-950 px-4 py-4 text-[13px] xs:text-sm text-slate-700 dark:text-slate-200 mb-3 shadow-sm max-h-[200px] overflow-auto font-mono select-text">
      <h2 className="text-fuchsia-800 dark:text-fuchsia-100 font-bold text-base mb-1">Contrato Laboral IECS-IEDIS (fragmento ejemplo)</h2>
      <ol className="list-decimal ml-4 space-y-1">
        <li>Celebrado entre el colaborador y Casita IEDIS conforme a la Ley Federal del Trabajo.</li>
        <li>Se establece el horario, responsabilidades y prestaciones acordadas.</li>
        <li>El vínculo laboral será bajo las condiciones pactadas y firmadas digitalmente.</li>
        <li>Todo lo no previsto se sujetará a las normas vigentes y acuerdos escritos.</li>
        <li>Texto íntegro visible cuando se cargue el documento oficial.</li>
      </ol>
    </div>
  );
}
