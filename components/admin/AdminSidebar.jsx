
"use client";
import { useState } from "react";
import { UserGroupIcon, BuildingOffice2Icon, ShieldCheckIcon, Cog8ToothIcon, TableCellsIcon, ArrowLeftCircleIcon, ArrowRightCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

// Anchor targets are section IDs on main page
const navs = [
  { id: "user-management",   label: "Usuarios",      icon: UserGroupIcon },
  { id: "plantel-progress",  label: "Progreso x Plantel", icon: TableCellsIcon },
  { id: "plantel-list-admin",label: "Planteles (CRUD)",   icon: BuildingOffice2Icon },
  { id: "plantel-admin-matrix-crud", label: "Admins por Plantel", icon: ShieldCheckIcon },
];

export default function AdminSidebar({ className = "" }) {
  const [open, setOpen] = useState(false);

  // Responsive: show/hide on mobile
  return (
    <nav className={
      "fixed left-0 top-0 z-40 bg-gradient-to-b from-white via-cyan-50/90 to-emerald-50/85 shadow-lg border-r border-cyan-100 h-full flex flex-col transition-all duration-200 " +
      (open ? "w-48" : "w-11") +
      " " + className
    }>
      <button
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setOpen(!open)}
        className="m-2 mb-6 mt-4 flex flex-row gap-0.5 items-center text-cyan-700"
      >
        {open ? <ArrowLeftCircleIcon className="w-7 h-7" /> : <ArrowRightCircleIcon className="w-7 h-7" />}
        <span className={open ? "ml-2 font-bold text-cyan-900 text-lg" : "hidden"}>Panel</span>
      </button>
      <div className="flex-1 flex flex-col gap-2">
        {navs.map(n => (
          <a key={n.id}
            href={`#${n.id}`}
            className={
              "mx-1.5 flex items-center gap-2 px-3 py-3 rounded-lg transition text-cyan-800 font-bold hover:bg-cyan-100 focus:bg-cyan-200 " +
              (open ? "justify-start" : "justify-center")
            }
            tabIndex={0}
          >
            <n.icon className="w-6 h-6" />
            {open && <span className="text-base">{n.label}</span>}
          </a>
        ))}
      </div>
      <div className="flex flex-col gap-2 mt-auto mb-3 px-2">
        <a href="/admin" className={"text-xs py-2 px-3 font-semibold rounded bg-cyan-100 text-cyan-900 hover:bg-cyan-200 transition flex items-center gap-2 " + (open ? "" : "justify-center")}>
          <Cog8ToothIcon className="w-5 h-5" />
          {open && <span>Login admin</span>}
        </a>
      </div>
      <style jsx>{`
        nav { min-width: 2.75rem; width: ${open ? "12rem" : "2.75rem"}; }
        @media (max-width: 768px) {
          nav { position: fixed; top: 0; left: 0; width: ${open ? "15rem" : "2.75rem"}; }
        }
      `}</style>
    </nav>
  );
}
