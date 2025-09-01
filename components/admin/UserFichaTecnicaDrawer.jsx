
"use client";
import { useState, useEffect } from "react";
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
} from "@heroicons/react/24/outline";
import Image from "next/image";

// PUESTO OPTIONS
const PUESTO_OPTIONS = [
  "MUSICA",
  "COORD GRAL",
  "INGLES KII",
  "TIT BI",
  "COORD PED ",
  "COMPRAS",
  "ESPAÑOL KI",
  "JEFA COCINA",
  "TIT MBI",
  "INNOVACION ",
  "APOYO ADMON",
  " EXP CORPORAL",
  "COORD GRAL INGLES",
  "COORD DEPORTES",
  "INGLES KIII",
  "DESARROLLO HUMANO",
  "COORD GUARDE ME",
  "COORD PSICOL PA",
  "AUX DISEÑO",
  "INGLES 4",
  "COMANDANTE",
  "TIT LB ",
  "TIT LB",
  "INVENTARIOS",
  "COORD INGLES PB",
  "COORD GUARDE TOL",
  "COORD INGLES PA",
  "COORD DISEÑO",
  "AUX DRA",
  "BIOLOGIA Y QUIMICA",
  "COORD. INGLES",
  "COORD MKT TOL",
  "INGLES 1",
  "ORIENTADOR",
  "ESPAÑOL 5 ",
  "INGLES KI-KII-KIII",
  "COORD ESPAÑOL PB ",
  "DIRECTOR ESCOLAR",
  "INGLÉS 1",
  "CONTADOR GENERAL",
  "TIT MB",
  "COORD MKT ME",
  "INGLES 3",
  "ESPAÑOL 4",
  "ESPAÑOL 2",
  "COORD PEDAGOCICA",
  "AUX LCMA",
  "AUX LC",
  "AUX MA",
  "INGLÉS 2",
  "RH",
  "ADMON PB",
  "INTENDENCIA ",
  "TIT LA",
  "NUTRIOLOGA",
  "ESPAÑOL 6",
  "INTEDENCIA",
  "ESPAÑOL KIII",
  "TRABAJADORA SOCIAL",
  "JEFE DE MTTO",
  "BANCOS",
  "QUIMICA",
  "ADMON PA",
  "SUB COORD ARTES",
  "COORD PEDAGOGICO",
  "COMPUTACION ",
  "TI ",
  "AUX L",
  "MAESTRO DE BASQUETBOL",
  "AUX MBIIA",
  "VIGILANTE COMODIN",
  "AUX INGLÉS",
  "FCYE & HISTORIA",
  "BIOLOGIA",
  "EDUCACION FISICA",
  "APRECIACIÓN ARTISTICA",
  "AUX LBI",
  "COMPUTACIÓN",
  "ENEFERMERA",
  "TIT KIII",
  "TIT KII",
  "ARTES",
  "AUX ",
  "DOCENTE",
  "TI",
  "TENIS",
  "AJEDREZ",
  "BASQUETBOL",
  "CHOFER",
  "AUX BII",
  "COOR PEDAGOGICO",
  "SUB COORD DESARROLLO HUMANO",
  "TOCHO",
  "AUX RECLUTAMIENTO",
  "INTENDECIA",
  "COMPUTACIÓN & TI",
  "SUB DIRECTOR SEC",
  "COMODIN",
  "AUX COMPRAS",
  "FISICA",
  "MEDICO ESCOLAR",
  "COMMUNITY MANAGER",
  "AUX CAFETERIAS ",
  "AUX DOCENTE INGLÉS",
  "GEOGRAFIA",
  // --------- NUEVOS PUESTOS -----------
  "MATENIMIENTO",
  "ADMON ESCOLAR",
  "AUX MERCADOTECNIA",
  "MAKER",
  "ESPAÑOL",
  "INGLES",
  "FC&E"
];

// Updated FIELDS: puesto now handled as a select (see render below)
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
            nss: f.nss ?? "",
            fechaIngreso: f.fechaIngreso ? String(f.fechaIngreso).substring(0, 10) : "",
            puesto: f.puesto ?? "",
            horarioLaboral: f.horarioLaboral ?? "",
            plantelId: f.plantelId || "",
            sustituyeA: f.sustituyeA ?? "",
            fechaBajaSustituido: f.fechaBajaSustituido ? String(f.fechaBajaSustituido).substring(0, 10) : "",
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
        (ficha[key] && String(ficha[key]).trim() !== "")
      ).length
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
                      <select
                        name="puesto"
                        value={ficha.puesto}
                        onChange={handleChange}
                        disabled={!canEdit || isSaving}
                        className="w-full rounded-lg border border-cyan-200 px-3 py-2 text-base bg-white"
                      >
                        <option value="">Seleccionar puesto...</option>
                        {[...new Set(PUESTO_OPTIONS)].sort((a, b) =>
                          a.trim().localeCompare(b.trim(), "es", {sensitivity: "base"})
                        ).map(opt =>
                          <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                        )}
                      </select>
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
