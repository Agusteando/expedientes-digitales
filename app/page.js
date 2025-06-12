
"use client";

import Image from "next/image";
import { ShieldCheckIcon, UserPlusIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-tr from-[#e0eaff] via-[#f6d3fa] to-[#d0fff6] dark:from-[#22253b] dark:via-[#3a3353] dark:to-[#174b3a] bg-fixed">
      {/* Logo + Hero Section */}
      <header className="mt-8 mb-4 flex flex-col items-center">
        <div className="relative w-24 h-24 md:w-32 md:h-32 mb-5 px-2">
          <Image
            src="/IMAGOTIPO-IECS-IEDIS.png"
            alt="IECS-IEDIS"
            fill
            priority
            className="object-contain rounded-2xl shadow-xl bg-white/80 backdrop-blur-sm"
          />
        </div>
        <h1
          className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-1 tracking-tight"
          style={{ fontFamily: "var(--font-fredoka), var(--font-montserrat), sans-serif", letterSpacing: "-0.01em" }}
        >
          Expedientes Digitales
        </h1>
        <p className="text-base xs:text-lg sm:text-xl text-slate-700 dark:text-slate-200 max-w-lg text-center mb-0 font-bold">
          Plataforma interna de IECS-IEDIS <br className="hidden xs:block" />
          <span className="inline bg-gradient-to-r from-purple-700 via-fuchsia-600 to-teal-600 dark:from-fuchsia-300 dark:via-teal-400 dark:to-cyan-300 bg-clip-text text-transparent font-extrabold">
            Sube tu expediente y firma digitalmente
          </span>
        </p>
      </header>
      
      {/* Login Options */}
      <main className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-7 w-full max-w-3xl mx-auto px-4 sm:px-0">
          {/* Admin Card */}
          <div className="flex flex-col items-center justify-between bg-white/70 dark:bg-white/10 shadow-xl rounded-3xl p-7 sm:p-10 text-center border border-slate-200/60 dark:border-slate-700/50 transition hover:scale-[1.026] hover:shadow-2xl hover:ring-2 hover:ring-purple-300/50 dark:hover:ring-purple-500/40 backdrop-blur-md"
            style={{
              boxShadow:"0 4px 34px 0 rgba(109,40,217,0.06), 0 1.5px 7px 0 rgba(89,200,209,0.03)"
            }}>
            <ShieldCheckIcon className="h-11 w-11 mb-4 text-purple-700 dark:text-fuchsia-200 drop-shadow-md" aria-hidden="true" />
            <h2
              className="text-lg xs:text-xl font-bold mb-2 text-slate-800 dark:text-white"
              style={{ fontFamily: "var(--font-fredoka), var(--font-montserrat), sans-serif" }}
            >
              Soy Administrador
            </h2>
            <p className="text-sm xs:text-base text-slate-700 dark:text-slate-300 mb-4 font-bold">
              Acceso exclusivo <br className="sm:hidden" /> para personal administrativo autorizado.
            </p>
            <Link
              href="/admin/login"
              className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-full font-bold text-white bg-gradient-to-r from-purple-700 to-fuchsia-600 dark:from-fuchsia-400 dark:to-purple-500 shadow-lg transition hover:scale-105 hover:from-fuchsia-700 hover:to-purple-900 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-500 text-base w-full justify-center"
              style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
            >
              Ingresar Administrador
              <ArrowRightIcon className="h-5 w-5 -mr-1 group-hover:translate-x-1 transition" />
            </Link>
          </div>
          {/* Employee/Candidate Card */}
          <div className="flex flex-col items-center justify-between bg-white/70 dark:bg-slate-900/80 shadow-xl rounded-3xl p-7 sm:p-10 text-center border border-teal-200/60 dark:border-teal-700/30 transition hover:scale-[1.026] hover:shadow-2xl hover:ring-2 hover:ring-teal-300/50 dark:hover:ring-teal-500/30 backdrop-blur-md"
            style={{
              boxShadow:"0 4px 34px 0 rgba(20,184,166,0.07), 0 1.5px 7px 0 rgba(8,145,178,0.025)"
            }}>
            <UserPlusIcon className="h-11 w-11 mb-4 text-teal-600 dark:text-teal-300 drop-shadow-md" aria-hidden="true" />
            <h2
              className="text-lg xs:text-xl font-bold mb-2 text-slate-800 dark:text-white"
              style={{ fontFamily: "var(--font-fredoka), var(--font-montserrat), sans-serif" }}
            >
              Soy Empleado o Candidato
            </h2>
            <p className="text-sm xs:text-base text-slate-700 dark:text-slate-200 mb-4 font-bold">
              Regístrate, sube tus documentos <br className="sm:hidden" /> y firme su contrato digital aquí.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 w-full justify-center mt-1">
              <Link
                href="/login"
                className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full font-bold text-white bg-gradient-to-r from-teal-600 to-cyan-500 shadow-lg transition hover:scale-105 hover:from-cyan-700 hover:to-teal-900 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-400 text-base w-full justify-center"
                style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
              >
                Iniciar Sesión
                <ArrowRightIcon className="h-5 w-5 -mr-1" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full font-bold text-teal-700 dark:text-teal-200 bg-gradient-to-r from-white via-teal-50 to-white dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 border border-teal-300 dark:border-teal-700 shadow-lg transition hover:scale-105 hover:bg-teal-50 dark:hover:bg-teal-900/80 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-400 text-base w-full justify-center"
                style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
              >
                Registrarme
                <ArrowRightIcon className="h-5 w-5 -mr-1" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex flex-col items-center gap-1 py-8 text-xs text-slate-600 dark:text-slate-400 font-bold" style={{ fontFamily: "var(--font-montserrat), sans-serif" }}>
        <span>
          © {new Date().getFullYear()} IECS-IEDIS. Todos los derechos reservados. 
        </span>
        <span className="flex items-center gap-1">
          Desarrollado por{" "}
          <a 
            href="mailto:desarrollo.tecnologico@casitaiedis.edu.mx"
            className="underline decoration-dashed text-purple-700 dark:text-purple-300"
          >
            IECS-IEDIS
          </a>
        </span>
      </footer>
    </div>
  );
}
