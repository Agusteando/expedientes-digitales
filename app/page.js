
"use client";

import Image from "next/image";
import Link from "next/link";
import { UserPlusIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-tr from-[#ece9fc] via-[#f2f7ff] to-[#e4faea] dark:from-[#212139] dark:via-[#243047] dark:to-[#1a493a] bg-fixed overflow-x-hidden">
      {/* Fixed nav brand for desktop, in-card for mobile */}
      <nav className="hidden md:flex z-50 fixed top-0 left-0 w-full justify-center pointer-events-none select-none py-6">
        <div className="flex gap-3 items-center bg-white/80 dark:bg-slate-900/90 px-7 py-3 rounded-2xl shadow-md border border-slate-100 dark:border-slate-800 pointer-events-auto">
          <Image
            src="/IMAGOTIPO-IECS-IEDIS.png"
            alt="IECS-IEDIS"
            width={38}
            height={38}
            priority
            className="rounded-xl bg-white object-contain"
            style={{ boxShadow: "0 4px 18px 0 rgba(80,40,220,0.07)" }}
          />
          <span className="font-fredoka font-bold text-lg xl:text-xl pl-1 text-purple-800 dark:text-fuchsia-200 tracking-tight">
            IECS-IEDIS
          </span>
        </div>
      </nav>

      {/* Centered SaaS hero glass card */}
      <main className="w-full flex flex-col items-center justify-center flex-1 py-10">
        <div className="w-full max-w-[98vw] xs:max-w-[410px] md:max-w-xl lg:max-w-2xl mx-auto p-0 sm:p-0">
          <section
            className="relative flex flex-col items-center justify-center mx-auto
                       bg-white/90 dark:bg-slate-900/95 border border-slate-100 dark:border-slate-800
                       shadow-2xl rounded-3xl px-4 py-8 xs:px-8 sm:py-10 md:px-16
                       mb-12 backdrop-blur-[12px]
                       transition-all duration-200"
            style={{ boxShadow: "0 6px 40px 0 rgba(120,60,180,0.14)" }}
          >
            {/* Logo–brand block: in card for mobile, hidden for desktop */}
            <div className="md:hidden flex flex-col items-center mb-5 select-none">
              <div className="relative w-16 h-16 xs:w-20 xs:h-20 mb-2">
                <Image
                  src="/IMAGOTIPO-IECS-IEDIS.png"
                  alt="IECS-IEDIS"
                  fill
                  className="object-contain bg-white rounded-xl"
                />
              </div>
              <span className="font-fredoka font-bold text-lg text-purple-800 dark:text-fuchsia-200 tracking-tight">
                IECS-IEDIS
              </span>
            </div>

            {/* Platform headline */}
            <h1 className="font-fredoka text-2xl xs:text-3xl sm:text-4xl md:text-4xl text-center font-extrabold text-purple-900 dark:text-fuchsia-100 mb-2 tracking-tight select-none">
              Expediente Laboral Digital
            </h1>
            {/* Subheadline */}
            <p className="text-base xs:text-lg sm:text-xl font-semibold text-slate-700 dark:text-slate-200 text-center mb-7 max-w-lg px-2 select-none">
              Acceso seguro para empleados y administración de IECS-IEDIS. Sube documentos y firma digitalmente tu contrato en un solo lugar.
            </p>

            {/* CTA buttons: always full width on mobile, side-by-side with gap on desktop */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-7">
              <Link
                href="/login"
                className="
                  group flex items-center justify-center w-full py-4 px-5 rounded-full
                  bg-gradient-to-r from-teal-600 to-cyan-500
                  text-white font-extrabold text-lg md:text-xl drop-shadow-lg
                  focus:outline-none focus:ring-4 focus:ring-cyan-400
                  shadow-lg hover:from-teal-800 hover:to-cyan-700
                  transition min-h-[56px] min-w-0
                "
                style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
              >
                <UserPlusIcon className="w-7 h-7 sm:w-8 sm:h-8 mr-3 -ml-2" aria-hidden="true" />
                <span>
                  Soy Empleado/a o Candidato
                </span>
              </Link>
              <Link
                href="/admin/login"
                className="
                  group flex items-center justify-center w-full py-4 px-5 rounded-full
                  bg-gradient-to-r from-fuchsia-700 to-purple-700
                  text-white font-extrabold text-lg md:text-xl drop-shadow-lg
                  focus:outline-none focus:ring-4 focus:ring-fuchsia-400
                  shadow-lg hover:from-fuchsia-800 hover:to-purple-900
                  transition min-h-[56px] min-w-0
                "
                style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
              >
                <ShieldCheckIcon className="w-7 h-7 sm:w-8 sm:h-8 mr-3 -ml-2" aria-hidden="true" />
                <span>
                  Soy Administrador/a
                </span>
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Optional brand visual for desktop (hidden mobile) */}
      <div className="hidden md:flex pointer-events-none fixed bottom-0 left-0 w-full items-end justify-center z-0 select-none">
        <Image
          src="/IMAGOTIPO-IECS-IEDIS.png"
          alt=""
          width={180}
          height={38}
          className="opacity-5 blur-[1.5px] mb-8"
          draggable={false}
          aria-hidden
          style={{ pointerEvents: "none" }}
        />
      </div>
    </div>
  );
}
