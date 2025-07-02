
"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function AdminNav({ session }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const searchParams = useSearchParams();
  const forceAdminView = searchParams.get("adminview") === "1";
  const isSuperadmin = session.role === "superadmin";
  const isImpersonated = session.role === "admin" && session._impersonatedBy;

  // UI for showing impersonation
  const [switching, setSwitching] = useState(false);
  const [adminCandidates, setAdminCandidates] = useState([]);
  const [chooseAdmin, setChooseAdmin] = useState(false);
  const [adminSearch, setAdminSearch] = useState("");
  const [impMsg, setImpMsg] = useState("");

  // Dropdown close
  useEffect(() => {
    if (!open) return;
    function handler(e) { if (!dropdownRef.current?.contains(e.target)) setOpen(false); }
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  // Fetch admin candidates for impersonation ON demand
  async function fetchAdmins() {
    setImpMsg("");
    const res = await fetch("/api/admin/list-admins", { credentials: "same-origin" });
    if (!res.ok) {
      setAdminCandidates([]);
      setImpMsg("No se pudo cargar admins");
      return;
    }
    setAdminCandidates(await res.json());
  }

  // Handle toggle menu ("Superadmin" or "Admin de plantel")
  async function handleSwitchImpersonation(mode) {
    setSwitching(true);
    setImpMsg("");
    setOpen(false);

    if (mode === "adminview") {
      // If only one admin, impersonate immediately
      await fetchAdmins();
      if (adminCandidates.length === 1) {
        const adminId = adminCandidates[0].id;
        try {
          const res = await fetch("/api/auth/impersonate", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ adminId })
          });
          if (!res.ok) throw new Error((await res.json()).error || "No se pudo impersonar");
          router.replace("/admin/inicio?adminview=1");
        } catch (e) {
          setImpMsg(String(e.message || e));
        }
      } else {
        setChooseAdmin(true);
      }
    } else {
      // mode === "superadmin": end impersonation
      try {
        await fetch("/api/auth/impersonate", { method: "DELETE", credentials: "same-origin" });
        router.replace("/admin/inicio");
      } catch {
        setImpMsg("No se pudo restaurar sesión");
      }
    }
    setSwitching(false);
  }

  // Confirm choice for which admin to impersonate
  async function doImpersonate(adminId) {
    setImpMsg("Impersonificando…");
    setSwitching(true);
    try {
      const res = await fetch("/api/auth/impersonate", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId })
      });
      if (!res.ok) throw new Error((await res.json()).error || "No se pudo impersonar");
      setChooseAdmin(false);
      setImpMsg("");
      router.replace("/admin/inicio?adminview=1");
    } catch (e) {
      setImpMsg(String(e.message || e));
    }
    setSwitching(false);
  }

  return (
    <>
      {/* Impersonation banner */}
      {isImpersonated && (
        <div className="fixed z-[9999] top-0 left-0 w-full bg-yellow-100 text-yellow-900 text-center py-2 px-4 flex items-center justify-center gap-3 font-bold text-xs shadow border-b-2 border-yellow-300 animate-fade-in">
          Estás impersonificando a un administrador ({session.email}, {session.name}). &nbsp;
          <button
            className="px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-900 text-white text-xs font-bold shadow-sm"
            onClick={() => handleSwitchImpersonation("superadmin")}
            disabled={switching}
            type="button"
          >
            Dejar de impersonificar
          </button>
        </div>
      )}
      <nav className="w-full flex items-center justify-between px-6 py-3 bg-white/95 shadow border-b border-purple-100 fixed top-0 left-0 z-30" style={{marginTop: isImpersonated ? 48 : 0}}>
        <a href="/admin/inicio" className="flex items-center gap-2">
          {/* IECS-IEDIS Logo: signia.png replaces text */}
          <span className="flex items-center">
            <Image
              src="/signia.png"
              alt="IECS-IEDIS"
              width={120}
              height={40}
              className="object-contain rounded bg-white shadow-sm"
              priority
            />
          </span>
        </a>
        <div className="flex items-center gap-3">
          {isSuperadmin && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpen(!open)}
                className="rounded px-3 py-2 bg-slate-50 border font-semibold text-xs text-slate-800 hover:bg-slate-100 select-none shadow flex items-center gap-1"
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                title="Cambiar panel"
              >
                Vista: {forceAdminView ? "Administrador de plantel" : "Superadmin"}
                <svg width={14} height={14} className="inline" viewBox="0 0 20 20"><path d="M5 8l5 5 5-5H5z" fill="currentColor"/></svg>
              </button>
              {open && (
                <div className="absolute right-0 mt-1 min-w-max bg-white border rounded shadow z-50 select-none animate-fade-in flex flex-col">
                  <button
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-purple-50 ${!forceAdminView ? "font-bold bg-purple-50" : ""}`}
                    onClick={() => handleSwitchImpersonation("superadmin")}
                    tabIndex={0}
                    type="button"
                  >Superadmin</button>
                  <button
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-cyan-50 ${forceAdminView ? "font-bold bg-cyan-50" : ""}`}
                    onClick={() => handleSwitchImpersonation("adminview")}
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
      {/* Admin pick modal, if multiple admins */}
      {chooseAdmin && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[10000]">
          <div className="bg-white rounded-2xl px-8 py-7 w-[90vw] max-w-2xl flex flex-col items-center border border-yellow-200 shadow-2xl">
            <h3 className="font-bold text-lg text-yellow-900 mb-4">Selecciona el administrador a impersonar</h3>
            <input
              type="text"
              placeholder="Buscar nombre o correo..."
              className="mb-4 border border-cyan-200 px-3 py-2 rounded w-full text-base"
              value={adminSearch}
              onChange={e => setAdminSearch(e.target.value)}
            />
            <div className="overflow-y-auto w-full max-h-48 mb-4">
              {adminCandidates.filter(a =>
                !adminSearch ||
                a.email.toLowerCase().includes(adminSearch.toLowerCase()) ||
                a.name.toLowerCase().includes(adminSearch.toLowerCase())
              ).length === 0 ? (
                <div className="text-center text-slate-500">No hay administradores</div>
              ) : (
                <table className="w-full text-xs text-slate-800">
                  <tbody>
                    {adminCandidates.filter(a =>
                      !adminSearch ||
                      a.email.toLowerCase().includes(adminSearch.toLowerCase()) ||
                      a.name.toLowerCase().includes(adminSearch.toLowerCase())
                    ).map((a) => (
                      <tr key={a.id} className="hover:bg-cyan-50 transition">
                        <td className="py-1 px-2">
                          <Image src={a.picture || "/IMAGOTIPO-IECS-IEDIS.png"} width={24} height={24} alt="" className="rounded-full inline" />
                        </td>
                        <td className="py-1 px-2">{a.name}</td>
                        <td className="py-1 px-2">{a.email}</td>
                        <td className="py-1 px-2">
                          <button
                            className="px-3 py-1 bg-yellow-700 text-white rounded-full font-bold text-xs shadow"
                            disabled={switching}
                            onClick={() => doImpersonate(a.id)}
                          >Impersonar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <button
              className="mt-4 bg-slate-100 px-4 py-2 rounded-full shadow font-bold text-slate-700"
              onClick={() => { setChooseAdmin(false); setImpMsg(""); }}
              disabled={switching}
              type="button"
            >
              Cancelar
            </button>
            {impMsg && (
              <div className="w-full text-center text-xs text-emerald-700 font-bold mt-3">{impMsg}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
