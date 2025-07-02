
export default function FuncionesComingSoonPage() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-white via-cyan-100 to-fuchsia-50 dark:from-slate-950 dark:via-cyan-900 dark:to-fuchsia-950 flex items-center justify-center px-4 py-10">
      <section className="flex flex-col items-center justify-center bg-white/70 dark:bg-slate-900/95 border border-cyan-200 dark:border-fuchsia-800 rounded-2xl shadow-2xl px-8 py-16 max-w-lg w-full">
        <img src="/Husky.png" alt="Husky animando" className="w-28 h-28 mb-2 rounded-full shadow-lg object-contain bg-white border-4 border-fuchsia-200" />
        <h1 className="text-2xl md:text-3xl font-extrabold text-fuchsia-800 dark:text-fuchsia-200 mb-2 text-center">
          Funciones del puesto – Próximamente
        </h1>
        <p className="text-base text-slate-700 dark:text-slate-300 text-center mb-6">
          En breve podrás consultar aquí las funciones detalladas de tu puesto.
        </p>
        <a
          href="/expediente"
          className="inline-block mt-2 text-cyan-700 dark:text-cyan-200 underline font-bold text-lg"
        >
          ← Volver a mi bienvenida
        </a>
      </section>
    </main>
  );
}
