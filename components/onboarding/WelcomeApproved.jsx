
import Image from "next/image";

export default function WelcomeApproved({ user, onRequestBypass }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[430px] w-full animate-fade-in px-2 pb-6">
      <div
        className="max-w-lg w-full bg-gradient-to-br from-white via-cyan-50 to-fuchsia-50 dark:from-slate-950 dark:via-cyan-900 dark:to-fuchsia-900 rounded-3xl shadow-2xl border border-cyan-100 dark:border-cyan-800 px-5 xs:px-9 md:px-16 pt-8 pb-10 flex flex-col items-center relative"
        style={{marginTop: "clamp(2.5rem, 7vw, 4.5rem)"}}
      >
        <div className="w-full h-0" style={{marginTop: "min(2.6rem,6vw)"}} />
        <Image
          src="/Husky.png"
          alt="Bienvenida Husky"
          width={144}
          height={144}
          priority
          className="rounded-full w-28 h-28 xs:w-36 xs:h-36 object-contain shadow-lg border-4 border-fuchsia-200 absolute -top-16 left-1/2 -translate-x-1/2 bg-white"
          style={{
            top: "calc(-2.5rem - min(8vw, 2.25rem))"
          }}
        />
        <div className="pt-16"></div>
        <div className="text-2xl xs:text-3xl font-black text-fuchsia-700 dark:text-fuchsia-200 text-center leading-snug mb-3 drop-shadow-md">
          ¡Bienvenido(a) a la familia IECS-IEDIS!
        </div>
        <div className="text-base md:text-lg text-slate-700 dark:text-cyan-100 text-center mb-4 font-semibold max-w-md">
          Nos alegra tenerte en nuestro equipo.<br />
          <span className="text-cyan-700 dark:text-fuchsia-300">¡Husky te da la bienvenida con entusiasmo y cariño!</span>
        </div>
        <div className="flex flex-col xs:flex-row gap-4 mt-3 w-full items-center justify-center">
          <a
            href="/expediente/funciones"
            className="px-5 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-cyan-500 text-white font-black shadow-md ring-2 ring-cyan-300/10 hover:from-fuchsia-700 hover:to-cyan-700 transition text-lg flex items-center justify-center"
          >
            📋 Funciones del puesto
          </a>
          <a
            href="https://casitaiedis.edu.mx"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 rounded-full bg-gradient-to-r from-fuchsia-700 to-orange-500 text-white font-black shadow-md ring-2 ring-fuchsia-300/10 hover:from-orange-700 hover:to-fuchsia-700 transition text-lg flex items-center justify-center"
          >
            🌐 Visita nuestro sitio web
          </a>
        </div>
        <div className="mt-8 mb-2 text-sm text-slate-500 dark:text-slate-300 italic text-center">
          Si tienes dudas o necesitas ayuda, no dudes en acercarte...<br />
          ¡Estamos aquí para acompañarte en este camino!
        </div>
        {typeof onRequestBypass === "function" && (
          <div className="w-full flex flex-col items-center justify-center mt-4">
            <button
              className="px-6 py-2 rounded-full bg-cyan-700 hover:bg-fuchsia-700 text-white font-bold shadow-lg transition text-base mt-2"
              onClick={onRequestBypass}
              type="button"
            >
              📝 Necesito actualizar mis documentos
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
