
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function MainNav() {
  const [open, setOpen] = useState(false);

  // Hide nav on subroutes (admin, dashboard, expediente, auth, register)
  if (
    typeof window !== "undefined" &&
    /^(\/(admin|dashboard|expediente|login|register|empleado))(\/|$)/.test(window.location.pathname)
  ) {
    return null;
  }

  return (
    <nav className="w-full flex items-center justify-between px-3 xs:px-6 py-3 bg-white/95 shadow border-b border-purple-100 fixed top-0 left-0 z-40">
      <Link href="/" className="flex items-center gap-2 select-none">
        <span className="relative w-9 h-9">
          <Image
            src="/signia.png"
            alt="Signia"
            fill
            style={{ objectFit: "contain" }}
            className="bg-white rounded shadow-sm"
            priority
          />
        </span>
        <span className="ml-2 font-bold text-xl text-purple-800 tracking-tight">Signia</span>
      </Link>
      <div className="hidden sm:flex items-center gap-5 font-semibold text-sm">
        <Link href="/" className="text-purple-800 hover:text-fuchsia-700 px-2 py-1 transition">Inicio</Link>
        <Link
          href="/empleado"
          className="text-cyan-700 hover:text-fuchsia-700 px-2 py-1 transition"
        >
          Acceso de Empleado
        </Link>
        <Link
          href="/admin"
          className="text-fuchsia-700 hover:text-cyan-700 px-2 py-1 transition"
        >
          Acceso de Administrador
        </Link>
      </div>
      <button onClick={() => setOpen(!open)} className="sm:hidden outline-none" aria-label="Abrir menú">
        <svg width={30} height={30} viewBox="0 0 24 24" fill="none"
          className="text-purple-700">
          <rect width="24" height="24" rx="5" fill="#ede9fe"/>
          <path d="M7 7h10M7 12h10M7 17h10" stroke="#a21caf" strokeWidth="2.1" strokeLinecap="round"/>
        </svg>
      </button>
      {/* Mobile menu */}
      {open && (
        <div
          className="absolute top-full right-2 w-60 bg-white border rounded-2xl shadow-2xl py-2 z-50 flex flex-col items-stretch text-base font-bold animate-fade-in"
        >
          <Link href="/" className="px-6 py-3 hover:bg-purple-50 text-purple-900" onClick={() => setOpen(false)}>Inicio</Link>
          <Link href="/empleado" className="px-6 py-3 hover:bg-cyan-50 text-cyan-700" onClick={() => setOpen(false)}>Acceso de Empleado</Link>
          <Link href="/admin" className="px-6 py-3 hover:bg-fuchsia-50 text-fuchsia-700" onClick={() => setOpen(false)}>Acceso de Administrador</Link>
        </div>
      )}
      <style jsx global>{`
        @keyframes fade-in { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in .21s both; }
      `}</style>
    </nav>
  );
}
