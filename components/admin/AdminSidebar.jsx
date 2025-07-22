
"use client";
import { useState } from "react";
import {
  UserGroupIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  Cog8ToothIcon,
  TableCellsIcon,
  XMarkIcon,
  Bars3Icon
} from "@heroicons/react/24/solid";

const navs = [
  { id: "user-management", label: "Usuarios", icon: UserGroupIcon },
  { id: "plantel-progress", label: "Progreso", icon: TableCellsIcon },
  { id: "plantel-list-admin", label: "Planteles", icon: BuildingOffice2Icon },
  { id: "plantel-admin-matrix-crud", label: "Admins x Plantel", icon: ShieldCheckIcon },
];

// Responsive, fixed-on-desktop, sliding modal on mobile
export default function AdminSidebar({ mobileOpen, setMobileOpen }) {
  const content = (
    <nav className="flex flex-col items-stretch h-full w-56 min-w-[12rem] bg-gradient-to-b from-white via-cyan-50/90 to-emerald-100/95 border-r border-cyan-200 shadow-2xl">
      <header className="pt-6 pb-2 px-4 flex items-center gap-2 mb-2">
        <span className="font-bold uppercase text-cyan-700 tracking-tight text-xl select-none">
          Panel
        </span>
        {setMobileOpen &&
          <button aria-label="Cerrar menú" onClick={() => setMobileOpen(false)} className="ml-auto text-cyan-400 hover:text-cyan-800 md:hidden">
            <XMarkIcon className="w-8 h-8" />
          </button>
        }
      </header>
      <div className="flex-1 flex flex-col gap-1 px-2">
        {navs.map((n) => (
          <a
            key={n.id}
            href={`#${n.id}`}
            onClick={() => setMobileOpen && setMobileOpen(false)}
            className="
              flex items-center gap-4 px-4 py-3 my-0.5 rounded-lg font-bold text-base md:text-lg
              transition hover:bg-cyan-100 focus:bg-cyan-200 text-cyan-900"
            tabIndex={0}
          >
            <n.icon className="w-8 h-8 text-cyan-700 shrink-0" />
            <span>{n.label}</span>
          </a>
        ))}
      </div>
      <footer className="flex flex-col items-stretch gap-2 py-5 px-4 mt-auto">
        <a 
          href="/admin" 
          className="text-base py-2 px-4 font-semibold rounded bg-cyan-100 text-cyan-900 hover:bg-cyan-200 transition flex items-center gap-2"
        >
          <Cog8ToothIcon className="w-7 h-7 mr-1 text-cyan-500" />
          Login admin
        </a>
      </footer>
    </nav>
  );
  // On desktop: static as left sidebar. On mobile: slides in over a scrim.
  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block md:sticky md:top-0 md:h-screen">
        {content}
      </div>
      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="fixed z-50 inset-0 flex">
          <div className="bg-black/25 w-full h-full" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
}

// Nav button for mobile
export function AdminMobileSidebarToggle({ onClick }) {
  return (
    <button
      aria-label="Abrir menú"
      onClick={onClick}
      className="fixed z-40 bottom-4 right-4 bg-cyan-700 hover:bg-cyan-900 text-white shadow-lg rounded-full p-4 md:hidden"
    >
      <Bars3Icon className="w-8 h-8" />
    </button>
  );
}
