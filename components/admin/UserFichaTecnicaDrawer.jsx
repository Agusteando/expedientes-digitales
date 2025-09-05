
"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  BuildingLibraryIcon,
  IdentificationIcon,
  KeyIcon,
  HomeIcon,
  CalendarDaysIcon,
  Bars3BottomLeftIcon,
  ClockIcon,
  ArrowDownOnSquareStackIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
  UserIcon,
  ArrowDownLeftIcon,
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import Image from "next/image";

// Dynamic Puestos: load active from API for select
const FIELDS = [
  { key: "rfc", label: "RFC", icon: IdentificationIcon },
  { key: "curp", label: "CURP", icon: KeyIcon },
  { key: "domicilioFiscal", label: "Domicilio fiscal", icon: HomeIcon },
  { key: "nss", label: "NSS", icon: ShieldCheckIcon },
  { key: "fechaIngreso", label: "Fecha de ingreso", icon: CalendarDaysIcon },
  { key: "puesto", label: "Puesto", icon: Bars3BottomLeftIcon },
  { key: "horarioLaboral", label: "Horario laboral", icon: ClockIcon },
  { key: "plantelId", label: "Plantel asignado", icon: BuildingLibraryIcon },
  { key: "sustituyeA", label: "Sustituye a", icon: UserIcon },
  { key: "fechaBajaSustituido", label: "Quién fue baja el", icon: ArrowDownLeftIcon },
];

function classNames(...c) { return c.filter(Boolean).join(" "); }

export default function UserFichaTecnicaDrawer({
  open,
  user,
  planteles = [],
  canEdit = false,
  editablePlanteles = [],
  onClose,
  isSuperadmin = false // not used now, manual entry removed
}) {
  const [ficha, setFicha] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // For downloads
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [zipDownloading, setZipDownloading] = useState(false);
  const [zipQueued, setZipQueued] = useState(false);

  // Dynamic puestos
  const [puestos, setPuestos] = useState([]);
  const [puestosLoading, setPuestosLoading] = useState(false);

  // Searchable dropdown state
  const [puestoOpen, setPuestoOpen] = useState(false);
  const [puestoFilter, setPuestoFilter] = useState("");
  const [puestoActiveIndex, setPuestoActiveIndex] = useState(-1);
  const puestoInputRef = useRef(null);
  const puestoListRef = useRef(null);
  const puestoButtonRef = useRef(null);

  useEffect(() => {
    if (!open || !user) return;
    async function loadFicha() {
      setIsLoading(true);
      setFicha(null);
      setSuccess(""); setError("");
      try {
        const res = await fetch(`/api/admin/user/${user.id}/ficha-tecnica-data`);
        const d = await res.json();
        if (!res.ok) { setError(d.error || "No se puede leer ficha."); setIsLoading(false); return; }
        const f = d.ficha || {};
        setFicha({
          rfc: f.rfc ?? "",
          curp: f.curp ?? "",
          domicilioFiscal: f.domicilioFiscal ?? "",
          nss: f.nss ?? "",
          fechaIngreso: f.fechaIngreso ? String(f.fechaIngreso).substring(0, 10) : "",
          puesto: f.puesto ?? "",
          horarioLaboral: f.horarioLaboral ?? "",
          plantelId: f.plantelId || "",
          sustituyeA: f.sustituyeA ?? "",
          fechaBajaSustituido: f.fechaBajaSustituido ? String(f.fechaBajaSustituido).substring(0, 10) : "",
        });
      } catch {
        setError("No se puede leer ficha.");
      }
      setIsLoading(false);
    }
    loadFicha();
  }, [open, user]);

  useEffect(() => {
    async function loadPuestos() {
      if (!open) return;
      setPuestosLoading(true);
      try {
        const r = await fetch("/api/admin/puestos/list?active=1", { cache: "no-store" });
        const d = await r.json();
        if (r.ok) setPuestos(d.puestos || []);
      } catch {
        // ignore
      }
      setPuestosLoading(false);
    }
    loadPuestos();
  }, [open]);

  function handleChange(e) {
    setFicha(f => ({ ...f, [e.target.name]: e.target.value }));
    setError(""); setSuccess("");
  }
  function handlePlantelChange(e) {
    setFicha(f => ({ ...f, plantelId: e.target.value }));
    setError(""); setSuccess("");
  }

  // Progress
  const filledCount = ficha
    ? FIELDS.filter(({ key }) => (ficha[key] && String(ficha[key]).trim() !== "")).length
    : 0;
  const fichaPct = Math.round((filledCount / FIELDS.length) * 100);

  async function handleSave(e) {
    e.preventDefault();
    setIsSaving(true);
    setSuccess("");
    setError("");
    try {
      const { sueldo, ...toSend } = ficha || {};
      const res = await fetch(`/api/admin/user/${user.id}/ficha-tecnica`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSend)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo guardar");
        setIsSaving(false);
        return;
      }
      setSuccess("¡Ficha guardada exitosamente!");
      setIsSaving(false);
      setTimeout(onClose, 900);
    } catch (e) {
      setError("Error de red o servidor");
      setIsSaving(false);
    }
  }

  async function downloadFichaPdf() {
    setPdfDownloading(true);
    setError(""); setSuccess("");
    try {
      const res = await fetch(`/api/admin/user/${user.id}/ficha-tecnica/pdf`);
      if (!res.ok) throw new Error((await res.text()).slice(0,140));
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `FichaTecnica_${user.name.replace(/\W+/g,"_")}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      setPdfDownloading(false);
    } catch (e) {
      setError("No se pudo descargar PDF");
      setPdfDownloading(false);
    }
  }

  async function downloadTodoZip() {
    setZipDownloading(true);
    setZipQueued(false);
    setError(""); setSuccess("");
    try {
      const res = await fetch(`/api/admin/user/${user.id}/ficha-tecnica/zip`);
      if (res.status === 429) { setZipQueued(true); setZipDownloading(false); return; }
      if (!res.ok) throw new Error((await res.text()).slice(0,120));
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `Expediente_${user.name.replace(/\W+/g,"_")}.zip`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      setZipDownloading(false);
    } catch (e) {
      setError("No se pudo descargar ZIP");
      setZipDownloading(false);
    }
  }

  // ---- Searchable Select for Puestos (no manual entry) ----
  const puestosFiltered = useMemo(() => {
    const q = puestoFilter.trim().toLowerCase();
    const list = Array.isArray(puestos) ? puestos : [];
    if (!q) return list;
    return list.filter(p => p.name.toLowerCase().includes(q));
  }, [puestos, puestoFilter]);

  const selectedPuestoInCatalog = useMemo(() => {
    const v = (ficha?.puesto || "").trim();
    if (!v) return null;
    return puestos.find(p => p.name === v) || null;
  }, [ficha?.puesto, puestos]);

  const isPuestoOutOfCatalog = useMemo(() => {
    const v = (ficha?.puesto || "").trim();
    if (!v) return false;
    return !puestos.some(p => p.name === v);
  }, [ficha?.puesto, puestos]);

  const closePuestoDropdown = useCallback(() => {
    setPuestoOpen(false);
    setPuestoActiveIndex(-1);
  }, []);

  // Keyboard navigation
  function handlePuestoKeyDown(e) {
    if (!puestoOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setPuestoOpen(true);
        setTimeout(() => puestoInputRef.current?.focus(), 0);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      closePuestoDropdown();
      puestoButtonRef.current?.focus();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setPuestoActiveIndex(i => {
        const n = puestosFiltered.length;
        if (n === 0) return -1;
        return (i + 1) % n;
      });
      scrollActiveIntoView();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setPuestoActiveIndex(i => {
        const n = puestosFiltered.length;
        if (n === 0) return -1;
        return (i - 1 + n) % n;
      });
      scrollActiveIntoView();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const idx = puestoActiveIndex;
      if (idx >= 0 && idx < puestosFiltered.length) {
        const sel = puestosFiltered[idx];
        setFicha(f => ({ ...f, puesto: sel.name }));
        closePuestoDropdown();
        puestoButtonRef.current?.focus();
      }
      return;
    }
  }

  function scrollActiveIntoView() {
    const listEl = puestoListRef.current;
    if (!listEl) return;
    const idx = puestoActiveIndex;
    if (idx < 0) return;
    const itemEl = listEl.querySelector(`[data-index="${idx}"]`);
    if (itemEl && itemEl.scrollIntoView) {
      itemEl.scrollIntoView({ block: "nearest" });
    }
  }

  // Click outside to close
  const dropdownWrapperRef = useRef(null);
  useEffect(() => {
    function onDocClick(e) {
      if (!puestoOpen) return;
      if (!dropdownWrapperRef.current?.contains(e.target)) {
        closePuestoDropdown();
      }
    }
    window.addEventListener("mousedown", onDocClick);
    return () => window.removeEventListener("mousedown", onDocClick);
  }, [puestoOpen, closePuestoDropdown]);

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex justify-end">
      <div className="w-full max-w-md h-full bg-white shadow-2xl overflow-y-scroll border-l border-cyan-200 px-0 pt-0 relative">
        <button
          className="absolute right-3 top-3 text-cyan-800 font-bold rounded-full bg-cyan-50 p-2"
          onClick={onClose}
          aria-label="Cerrar"
        >✕</button>
        <div className="p-6 pb-2 flex items-center gap-3 border-b border-cyan-100">
          <Image
            src={user.picture || "/IMAGOTIPO-IECS-IEDIS.png"}
            width={48}
            height={48}
            alt=""
            className="rounded-full bg-white border border-cyan-100"
          />
          <div>
            <div className="font-bold text-cyan-900">{user.name}</div>
            <div className="text-xs text-slate-400">{user.email}</div>
            <div className="text-xs font-bold text-cyan-600 mt-1">
              {user.role === "employee" ? "Empleado" : "Candidato"}
            </div>
          </div>
        </div>
        <form className="px-6 py-4 flex flex-col gap-3" onSubmit={handleSave}>
          <h2 className="font-bold text-lg text-cyan-900 mt-1 mb-3">Ficha técnica del empleado</h2>
          {isLoading || !ficha ? (
            <div className="text-slate-400 py-6 text-center">Cargando...</div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xs font-bold text-cyan-800">
                  Progreso ficha: {filledCount} / {FIELDS.length}
                </span>
                <div className="flex-1">
                  <div className="w-full h-2 rounded-full bg-cyan-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        fichaPct > 90 ? "bg-emerald-400" : fichaPct > 50 ? "bg-cyan-400" : "bg-yellow-400"
                      }`}
                      style={{ width: `${fichaPct}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500">{fichaPct}%</span>
              </div>
              <div className="grid grid-cols-1 gap-y-3">
                {FIELDS.map(f =>
                  <div key={f.key}>
                    <label className="font-semibold text-xs text-cyan-700 flex items-center gap-1">
                      <f.icon className="w-4 h-4" /> {f.label}
                    </label>
                    {f.key === "fechaIngreso" || f.key === "fechaBajaSustituido" ? (
                      <input
                        className="w-full rounded-lg border border-cyan-200 px-3 py-2 text-base bg-white"
                        name={f.key}
                        type="date"
                        value={ficha[f.key]}
                        onChange={handleChange}
                        disabled={!canEdit || isSaving}
                      />
                    ) : f.key === "plantelId" ? (
                      <select
                        name="plantelId"
                        value={ficha.plantelId || ""}
                        onChange={handlePlantelChange}
                        disabled={!canEdit || isSaving}
                        className="w-full rounded-lg border border-cyan-200 px-3 py-2 text-base bg-white"
                      >
                        <option value="">Seleccionar plantel...</option>
                        {(canEdit ? editablePlanteles : planteles).map(p =>
                          <option key={p.id} value={p.id}>{p.name}</option>
                        )}
                      </select>
                    ) : f.key === "puesto" ? (
                      <div ref={dropdownWrapperRef} className="relative">
                        {/* Selected button */}
                        <button
                          type="button"
                          ref={puestoButtonRef}
                          onClick={() => {
                            if (!canEdit || isSaving) return;
                            setPuestoOpen(o => !o);
                            setPuestoFilter("");
                            setPuestoActiveIndex(-1);
                            setTimeout(() => puestoInputRef.current?.focus(), 0);
                          }}
                          onKeyDown={handlePuestoKeyDown}
                          disabled={!canEdit || isSaving || puestosLoading}
                          className={classNames(
                            "w-full inline-flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-base bg-white",
                            canEdit && !isSaving ? "border-cyan-200 hover:bg-cyan-50" : "border-slate-200 text-slate-500 cursor-not-allowed"
                          )}
                          aria-haspopup="listbox"
                          aria-expanded={puestoOpen}
                          aria-controls="puesto-listbox"
                        >
                          <span className="truncate text-left">
                            {ficha.puesto
                              ? ficha.puesto
                              : (puestosLoading ? "Cargando puestos..." : "Seleccionar puesto…")}
                          </span>
                          <ChevronUpDownIcon className="w-5 h-5 text-slate-500" />
                        </button>

                        {/* Out-of-catalog warning */}
                        {ficha.puesto && isPuestoOutOfCatalog && (
                          <div className="mt-1 text-[11px] flex items-start gap-1 text-yellow-800 bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
                            <ExclamationTriangleIcon className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>
                              El puesto seleccionado no está en el catálogo activo. Puedes conservarlo tal cual o elegir uno del catálogo.
                              Si necesitas editar el catálogo, solicita a un superadmin.
                            </span>
                          </div>
                        )}

                        {/* Dropdown */}
                        {puestoOpen && (
                          <div className="absolute z-10 mt-1 w-full bg-white border border-cyan-200 rounded-xl shadow-xl">
                            <div className="p-2 border-b border-cyan-100 bg-cyan-50/40">
                              <div className="relative">
                                <MagnifyingGlassIcon className="w-4 h-4 text-cyan-400 absolute left-2 top-2.5" />
                                <input
                                  ref={puestoInputRef}
                                  value={puestoFilter}
                                  onChange={e => { setPuestoFilter(e.target.value); setPuestoActiveIndex(0); }}
                                  onKeyDown={handlePuestoKeyDown}
                                  placeholder="Buscar puesto…"
                                  className="w-full pl-7 pr-2 py-2 rounded border border-cyan-200 text-sm bg-white"
                                />
                                {puestoFilter && (
                                  <button
                                    type="button"
                                    className="absolute right-2 top-1.5 p-1 rounded-full hover:bg-slate-100"
                                    onClick={() => { setPuestoFilter(""); setPuestoActiveIndex(0); puestoInputRef.current?.focus(); }}
                                    aria-label="Limpiar"
                                  >
                                    <XMarkIcon className="w-4 h-4 text-slate-500" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <ul
                              id="puesto-listbox"
                              role="listbox"
                              ref={puestoListRef}
                              className="max-h-60 overflow-auto py-1"
                              aria-label="Opciones de puesto"
                            >
                              {puestosFiltered.length === 0 && (
                                <li className="px-3 py-2 text-sm text-slate-500">Sin coincidencias</li>
                              )}
                              {puestosFiltered.map((p, idx) => {
                                const selected = ficha.puesto === p.name;
                                const active = puestoActiveIndex === idx;
                                return (
                                  <li
                                    key={p.id}
                                    role="option"
                                    aria-selected={selected}
                                    data-index={idx}
                                    className={classNames(
                                      "px-3 py-2 cursor-pointer flex items-center justify-between",
                                      active ? "bg-cyan-50" : "",
                                      selected ? "font-semibold text-cyan-800" : "text-slate-800"
                                    )}
                                    onMouseEnter={() => setPuestoActiveIndex(idx)}
                                    onClick={() => {
                                      setFicha(f => ({ ...f, puesto: p.name }));
                                      closePuestoDropdown();
                                      puestoButtonRef.current?.focus();
                                    }}
                                  >
                                    <span className="truncate">{p.name}</span>
                                    {selected && <CheckCircleIcon className="w-4 h-4 text-emerald-600" />}
                                  </li>
                                );
                              })}
                            </ul>
                            <div className="flex items-center justify-between gap-2 px-2 py-2 border-t border-cyan-100 bg-slate-50/60">
                              <button
                                type="button"
                                className="text-xs px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200"
                                onClick={() => { setPuestoFilter(""); closePuestoDropdown(); puestoButtonRef.current?.focus(); }}
                              >
                                Cerrar
                              </button>
                              <button
                                type="button"
                                className="text-xs px-3 py-1 rounded-full bg-white border border-slate-200 hover:bg-slate-100"
                                onClick={() => {
                                  setFicha(f => ({ ...f, puesto: "" }));
                                  setPuestoFilter("");
                                  closePuestoDropdown();
                                  puestoButtonRef.current?.focus();
                                }}
                                disabled={!canEdit || isSaving}
                              >
                                Quitar selección
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        className="w-full rounded-lg border border-cyan-200 px-3 py-2 text-base bg-white"
                        name={f.key}
                        value={ficha[f.key]}
                        onChange={handleChange}
                        disabled={!canEdit || isSaving}
                      />
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col md:flex-row gap-3 mt-7">
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-full bg-fuchsia-700 hover:bg-fuchsia-900 text-white font-bold shadow transition text-sm disabled:opacity-70"
                  onClick={downloadFichaPdf}
                  disabled={pdfDownloading || isSaving}
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  {pdfDownloading ? "Descargando PDF..." : "Descargar ficha PDF"}
                </button>
                <button
                  type="button"
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-full bg-cyan-700 hover:bg-cyan-900 text-white font-bold shadow transition text-sm disabled:opacity-70 ${zipQueued ? "cursor-wait" : ""}`}
                  onClick={downloadTodoZip}
                  disabled={zipDownloading || zipQueued || isSaving}
                >
                  <ArrowDownOnSquareStackIcon className="w-5 h-5" />
                  {zipDownloading ? "Descargando ZIP..." : zipQueued ? "En cola…" : "Descargar todo ZIP"}
                </button>
              </div>
              {error && (
                <div className="mt-4 px-3 py-2 rounded-lg bg-red-100 text-red-700 font-semibold text-center">{error}</div>
              )}
              {success && (
                <div className="mt-4 px-3 py-2 rounded-lg bg-green-100 text-emerald-800 font-semibold text-center">{success}</div>
              )}
              {!canEdit && (
                <div className="mt-4 text-xs text-cyan-700 font-semibold text-center">Sólo lectura</div>
              )}
              {canEdit && (
                <button
                  type="submit"
                  className="mt-7 py-3 rounded-full w-full bg-gradient-to-r from-cyan-700 to-teal-600 text-white font-extrabold shadow-lg text-base hover:from-emerald-700 hover:to-cyan-800"
                  disabled={isSaving}
                >
                  {isSaving ? "Guardando..." : "Guardar ficha técnica"}
                </button>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  );
}
