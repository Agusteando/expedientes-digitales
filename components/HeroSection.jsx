
"use client";

import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Hero gradient */}
      <div className="relative mt-2 bg-gradient-to-b from-[#4a18c6] via-[#5620d8] to-[#32107e]">
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center space-y-6">
          
          {/* Logos row: fixed height, fill mode */}
          <div className="flex justify-center items-center gap-8 h-20">
            <div className="relative h-full w-auto">
              <Image
                src="/signia.png"
                alt="Signia"
                fill
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
            <div className="relative h-full w-auto">
              <Image
                src="/IMAGOTIPO-IECS-IEDIS.png"
                alt="IECS-IEDIS"
                fill
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white">
            Expediente Laboral Digital
          </h1>
          <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
            Administra, sube y firma tus documentos laborales de manera segura.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/empleado"
              className="flex-1 max-w-xs px-6 py-3 rounded-full text-white font-bold shadow-lg
                         bg-[#00acc1] hover:scale-105 hover:bg-[#0097b2] transform transition"
            >
              <span className="text-sm sm:text-base whitespace-nowrap">
                Soy Empleado/a o Candidato/a
              </span>
            </Link>
            <Link
              href="/admin"
              className="flex-1 max-w-xs px-6 py-3 rounded-full text-white font-bold shadow-lg
                         bg-[#ec407a] hover:scale-105 hover:bg-[#d80061] transform transition"
            >
              <span className="text-sm sm:text-base whitespace-nowrap">
                Soy Administrador/a
              </span>
            </Link>
          </div>
        </div>

        <svg
          className="absolute -bottom-2 left-0 w-full"
          viewBox="0 0 1600 80"
          preserveAspectRatio="none"
        >
          <path
            d="M0 0C400 120 1200 120 1600 0V80H0V0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
