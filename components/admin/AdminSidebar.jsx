
"use client";
import {
  UserGroupIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  Cog8ToothIcon,
  TableCellsIcon,
  XMarkIcon,
  Bars3Icon,
} from "@heroicons/react/24/solid";
import { useState } from "react";

const navs = [
  { id: "user-management", label: "Usuarios", icon: UserGroupIcon },
  { id: "plantel-progress", label: "Progreso", icon: TableCellsIcon },
  { id: "plantel-list-admin", label: "Planteles", icon: BuildingOffice2Icon },
  { id: "plantel-admin-matrix-crud", label: "Admins x Plantel", icon: ShieldCheckIcon },
];

const NAVBAR_HEIGHT = 68;

export default function AdminSidebar({ mobileOpen, setMobileOpen }) {
  // Flex-col, occupies bottom of navbar to bottom of screen
  const common =
    `flex flex-col items-stretch bg-gradient-to-b from-white via-cyan-50/90 to-emerald-100/95 border-r border-cyan-200 shadow-2xl h-[calc(100vh-${NAVBAR_HEIGHT}px)] pt-2`;
  const iconSize = "w-7 h-7";
  const labelStyle = "text-[16px] sm:text-base font-bold";
  // Top "Panel" label only on desktop/modal
  const header = (
    <header className="flex items-center gap-2 mb-3 px-4 pt-2 pb-1">
      <span className="font-bold uppercase text-cyan-700 tracking-tight text-lg select-none">
        Panel
      </span>
      {setMobileOpen &&
        <button aria-label="Cerrar menú" onClick={() => setMobileOpen(false)} className="ml-auto text-cyan-400 hover:text-cyan-800 md:hidden">
          <XMarkIcon className="w-8 h-8" />
        </button>
      }
    </header>
  );

  const navLinks = navs.map((n) => (
    <a
      key={n.id}
      href={`#${n.id}`}
      onClick={() => setMobileOpen && setMobileOpen(false)}
      className="
        flex items-center gap-3 px-4 py-2 my-0.5 rounded-lg font-semibold transition
        hover:bg-cyan-100 focus:bg-cyan-200 text-cyan-900
        group"
      tabIndex={0}
    >
      <n.icon className={`${iconSize} text-cyan-700 group-hover:text-fuchsia-600 transition shrink-0`} />
      <span className={labelStyle}>{n.label}</span>
    </a>
  ));

  const footer = (
    <footer className="flex flex-col items-stretch gap-2 py-3 px-4 mt-auto">
      <a 
        href="/admin" 
        className="text-sm py-2 px-4 font-semibold rounded bg-cyan-100 text-cyan-900 hover:bg-cyan-200 transition flex items-center gap-2"
      >
        <Cog8ToothIcon className="w-6 h-6 mr-1 text-cyan-500" />
        Login admin
      </a>
    </footer>
  );

  // TRUE sidebar for desktop/tablet: sticky under navbar
  return (
    <>
      <div
        className={`
          hidden md:flex
          md:flex-col md:sticky
          md:top-[${NAVBAR_HEIGHT}px] md:w-52 lg:w-56 xl:w-64
          md:min-w-[13rem] lg:min-w-[15rem] xl:min-w-[16rem]
        `}
        style={{ height: `calc(100vh - ${NAVBAR_HEIGHT}px)` }}
      >
        <div className={common + " w-full"}>
          {header}
          <nav className="flex-1 flex flex-col gap-0.5">{navLinks}</nav>
          {footer}
        </div>
      </div>
      {/* Modal on mobile */}
      {mobileOpen && (
        <div className="fixed z-50 inset-0 flex" style={{ top: NAVBAR_HEIGHT }}>
          <div className="bg-black/25 w-full h-full" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 w-5/6 max-w-xs">
            <div className={common + " w-full max-w-xs rounded-r-2xl border"}>
              {header}
              <nav className="flex-1 flex flex-col gap-0.5">{navLinks}</nav>
              {footer}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function AdminMobileSidebarToggle({ onClick }) {
  return (
    <button
      aria-label="Abrir menú"
      onClick={onClick}
      className="fixed z-40 bottom-4 right-4 bg-cyan-700 hover:bg-cyan-900 text-white shadow-lg rounded-full p-4 md:hidden"
      style={{ boxShadow: '0 4px 20px 4px rgba(0, 185, 218, 0.11)' }}
    >
      <Bars3Icon className="w-7 h-7" />
    </button>
  );
}
