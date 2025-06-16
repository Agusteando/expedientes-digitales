
"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function AdminNav({ session }) {
  // LOG: show role clearly for every nav render
  console.log("[AdminNav.jsx] session prop:", session);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const searchParams = useSearchParams();
  const forceAdminView = searchParams.get("adminview") === "1";

  useEffect(() => {
    if (!open) return;
    function handle(e) {
      if (!dropdownRef.current?.contains(e.target)) setOpen(false);
    }
    window.addEventListener("mousedown", handle);
    return () => window.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <nav className="w-full flex items-center justify-between px-6 py-3 bg-white/95 shadow border-b border-purple-100 fixed top-0 left-0 z-30">
      <a href="/admin/inicio" className="font-bold text-xl text-purple-800 tracking-tight select-none">
        Expedientes Digitales
      </a>
      <div className="flex items-center gap-3">
        {/* LOG: show why dropdown renders or not */}
        {console.log("[AdminNav] session.role:", session?.role)}
        {session.role === "superadmin" && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(!open)}
              className="rounded px-3 py-2 bg-slate-50 border font-semibold text-xs text-slate-800 hover:bg-slate-100 select-none shadow flex items-center gap-1"
              type="button"
              aria-haspopup="listbox"
              aria-expanded={open}
              title="Cambiar panel"
            >
              Vista: {forceAdminView ? "Administrador" : "Superadmin"}
              <svg width={14} height={14} className="inline" viewBox="0 0 20 20"><path d="M5 8l5 5 5-5H5z" fill="currentColor"/></svg>
            </button>
            {open && (
              <div className="absolute right-0 mt-1 min-w-max bg-white border rounded shadow z-50 select-none animate-fade-in flex flex-col">
                <button
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-purple-50 ${!forceAdminView ? "font-bold bg-purple-50" : ""}`}
                  onClick={() => { setOpen(false); router.replace("/admin/inicio"); }}
                  tabIndex={0}
                  type="button"
                >Superadmin</button>
                <button
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-cyan-50 ${forceAdminView ? "font-bold bg-cyan-50" : ""}`}
                  onClick={() => { setOpen(false); router.replace("/admin/inicio?adminview=1"); }}
                  tabIndex={0}
                  type="button"
                >Administrador de plantel</button>
              </div>
            )}
          </div>
        )}
        <span className="text-xs sm:text-sm text-slate-700 font-semibold">{session.name}</span>
        <Image
          alt="profile"
          src={session.picture || "/IMAGOTIPO-IECS-IEDIS.png"}
          width={32}
          height={32}
          className="rounded-full bg-slate-100"
        />
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-full text-xs shadow"
            title="Cerrar sesión"
          >Cerrar sesión</button>
        </form>
      </div>
      <style jsx global>{`
        .animate-fade-in { animation: fadein .20s both; }
        @keyframes fadein { from { opacity:0; transform:scale(.98);} to { opacity:1; transform:scale(1);} }
      `}</style>
    </nav>
  );
}
