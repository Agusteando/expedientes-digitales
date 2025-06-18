
"use client";
import { useState, useEffect } from "react";
import { BuildingLibraryIcon, IdentificationIcon, KeyIcon, HomeIcon, CalendarDaysIcon, Bars3BottomLeftIcon, BanknotesIcon, ClockIcon, ArrowDownOnSquareStackIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

const FIELDS = [
  { key: "rfc", label: "RFC", icon: IdentificationIcon },
  { key: "curp", label: "CURP", icon: KeyIcon },
  { key: "domicilioFiscal", label: "Domicilio fiscal", icon: HomeIcon },
  { key: "fechaIngreso", label: "Fecha de ingreso", icon: CalendarDaysIcon },
  { key: "puesto", label: "Puesto", icon: Bars3BottomLeftIcon },
  { key: "sueldo", label: "Sueldo mensual (MXN)", icon: BanknotesIcon },
  { key: "horarioLaboral", label: "Horario laboral", icon: ClockIcon },
  { key: "plantelId", label: "Plantel asignado", icon: BuildingLibraryIcon },
];

const FIELD_COUNT = FIELDS.length;

export default function UserFichaTecnicaDrawer({
  open,
  user,
  planteles = [],
  canEdit = false,
  editablePlanteles = [],
  onClose
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

  useEffect(() => {
    if (open && user) {
      setIsLoading(true);
      setFicha(null);
      setSuccess(""); setError("");
      fetch(`/api/admin/user/${user.id}/ficha-tecnica-data`)
        .then(async res => {
          const d = await res.json();
          if (!res.ok) {
            setError(d.error || "No se puede leer ficha.");
            setIsLoading(false);
            return;
          }
          const f = d.ficha || {};
          setFicha({
            rfc: f.rfc ?? "",
            curp: f.curp ?? "",
            domicilioFiscal: f.domicilioFiscal ?? "",
            fechaIngreso: f.fechaIngreso ? String(f.fechaIngreso).substring(0, 10) : "",
            puesto: f.puesto ?? "",
            sueldo: f.sueldo !== null && f.sueldo !== undefined ? String(f.sueldo) : "",
            horarioLaboral: f.horarioLaboral ?? "",
            plantelId: f.plantelId || "",
          });
          setIsLoading(false);
          setError("");
        });
      setPdfDownloading(false);
      setZipDownloading(false);
      setZipQueued(false);
    }
  }, [open, user]);

  function handleChange(e) {
    setFicha(f => ({ ...f, [e.target.name]: e.target.value }));
    setError(""); setSuccess("");
  }
  function handlePlantelChange(e) {
    setFicha(f => ({ ...f, plantelId: e.target.value }));
    setError(""); setSuccess("");
  }
  // Progress: count non-empty fields (plantelId counts if set and mapped)
  const filledCount = ficha
    ? FIELDS.filter(({ key }) =>
        key === "sueldo"
          ? (ficha.sueldo !== "" && ficha.sueldo !== null)
          : (ficha[key] && String(ficha[key]).trim() !== "")
      ).length
    : 0;
  const fichaPct = Math.round((filledCount / FIELDS.length) * 100);

  async function handleSave(e) {
    e.preventDefault();
    setIsSaving(true);
    setSuccess("");
    setError("");
    try {
      const res = await fetch(`/api/admin/user/${user.id}/ficha-tecnica`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ficha, sueldo: ficha.sueldo ? String(ficha.sueldo) : undefined })
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
      if (res.status === 429) {
        setZipQueued(true);
        setZipDownloading(false);
        return;
      }
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
                        fichaPct > 90 ? 'bg-emerald-400'
                        : fichaPct > 50 ? 'bg-cyan-400'
                        : 'bg-yellow-400'}`
                      }
                      style={{width: `${fichaPct}%`}}
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
                    {f.key === "fechaIngreso" ? (
                      <input
                        className="w-full rounded-lg border border-cyan-200 px-3 py-2 text-base bg-white"
                        name="fechaIngreso"
                        type="date"
                        value={ficha.fechaIngreso}
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
                    ) : f.key === "sueldo" ? (
                      <input
                        className="w-full rounded-lg border border-cyan-200 px-3 py-2 text-base bg-white"
                        name="sueldo"
                        type="number"
                        min="0"
                        step="0.01"
                        value={ficha.sueldo}
                        onChange={handleChange}
                        disabled={!canEdit || isSaving}
                      />
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
