
"use client";
import { useState, useEffect } from "react";
import { BuildingLibraryIcon, IdentificationIcon, KeyIcon, HomeIcon, CalendarDaysIcon, Bars3BottomLeftIcon, BanknotesIcon, ClockIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

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

  // Load ficha tecnica initial values
  useEffect(() => {
    if (open && user) {
      setIsLoading(true);
      fetch(`/api/admin/user/${user.id}/docs`).then(async r => {
        const d = await r.json();
        // For demo, get user/ficha by inference from parent or user, but would be better to fetch user details via API
        // We'll assume all ficha fields are in the user object passed in as "user"
        setFicha({
          rfc: user.rfc || "",
          curp: user.curp || "",
          domicilioFiscal: user.domicilioFiscal || "",
          fechaIngreso: user.fechaIngreso ? user.fechaIngreso.substring(0,10) : "",
          puesto: user.puesto || "",
          sueldo: user.sueldo !== null && user.sueldo !== undefined ? String(user.sueldo) : "",
          horarioLaboral: user.horarioLaboral || "",
          plantelId: user.plantelId || "",
        });
        setIsLoading(false);
        setError("");
      });
    }
  }, [open, user]);

  function handleChange(e) {
    setFicha(f => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
    setSuccess("");
  }
  function handlePlantelChange(e) {
    setFicha(f => ({ ...f, plantelId: e.target.value }));
  }

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
          <h2 className="font-bold text-lg text-cyan-900 mt-1 mb-2">Ficha técnica del empleado</h2>
          {isLoading || !ficha ? (
            <div className="text-slate-400 py-6 text-center">Cargando...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-y-3">
                <div>
                  <label className="font-semibold text-xs text-cyan-700 flex items-center gap-1">
                    <IdentificationIcon className="w-4 h-4" /> RFC
                  </label>
                  <input
                    className="w-full rounded-lg border border-cyan-200 px-3 py-2 text-base bg-white"
                    name="rfc"
                    value={ficha.rfc}
                    onChange={handleChange}
                    required
                    disabled={!canEdit || isSaving}
                  />
                </div>
                <div>
                  <label className="font-semibold text-xs text-cyan-700 flex items-center gap-1">
                    <KeyIcon className="w-4 h-4" /> CURP
                  </label>
                  <input
                    className="w-full rounded-lg border border-cyan-200 px-3 py-2 text-base bg-white"
                    name="curp"
                    value={ficha.curp}
                    onChange={handleChange}
                    required
                    disabled={!canEdit || isSaving}
                  />
                </div>
                <div>
                  <label className="font-semibold text-xs text-cyan-700 flex items-center gap-1">
                    <HomeIcon className="w-4 h-4" /> Domicilio fiscal
                  </label>
                  <input
                    className="w-full rounded-lg border border-cyan-200 px-3 py-2 text-base bg-white"
                    name="domicilioFiscal"
                    value={ficha.domicilioFiscal}
                    onChange={handleChange}
                    required
                    disabled={!canEdit || isSaving}
                  />
                </div>
                <div>
                  <label className="font-semibold text-xs text-cyan-700 flex items-center gap-1">
                    <CalendarDaysIcon className="w-4 h-4" /> Fecha de ingreso
                  </label>
                  <input
                    className="w-full rounded-lg border border-cyan-200 px-3 py-2 text-base bg-white"
                    name="fechaIngreso"
                    type="date"
                    value={ficha.fechaIngreso}
                    onChange={handleChange}
                    required
                    disabled={!canEdit || isSaving}
                  />
                </div>
                <div>
                  <label className="font-semibold text-xs text-cyan-700 flex items-center gap-1">
                    <Bars3BottomLeftIcon className="w-4 h-4" /> Puesto
                  </label>
                  <input
                    className="w-full rounded-lg border border-cyan-200 px-3 py-2 text-base bg-white"
                    name="puesto"
                    value={ficha.puesto}
                    onChange={handleChange}
                    required
                    disabled={!canEdit || isSaving}
                  />
                </div>
                <div>
                  <label className="font-semibold text-xs text-cyan-700 flex items-center gap-1">
                    <BanknotesIcon className="w-4 h-4" /> Sueldo mensual (MXN)
                  </label>
                  <input
                    className="w-full rounded-lg border border-cyan-200 px-3 py-2 text-base bg-white"
                    name="sueldo"
                    type="number"
                    min="0"
                    step="0.01"
                    value={ficha.sueldo}
                    onChange={handleChange}
                    required
                    disabled={!canEdit || isSaving}
                  />
                </div>
                <div>
                  <label className="font-semibold text-xs text-cyan-700 flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" /> Horario laboral
                  </label>
                  <input
                    className="w-full rounded-lg border border-cyan-200 px-3 py-2 text-base bg-white"
                    name="horarioLaboral"
                    value={ficha.horarioLaboral}
                    onChange={handleChange}
                    required
                    placeholder="Ej: 9:00-17:00"
                    disabled={!canEdit || isSaving}
                  />
                </div>
                <div>
                  <label className="font-semibold text-xs text-cyan-700 flex items-center gap-1">
                    <BuildingLibraryIcon className="w-4 h-4" /> Plantel asignado
                  </label>
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
                </div>
              </div>
              {error && (
                <div className="mt-4 px-3 py-2 rounded-lg bg-red-100 text-red-700 font-semibold text-center">{error}</div>
              )}
              {success && (
                <div className="mt-4 px-3 py-2 rounded-lg bg-green-100 text-emerald-800 font-semibold text-center">{success}</div>
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
              {!canEdit && (
                <div className="mt-4 text-xs text-cyan-700 font-semibold text-center">Sólo lectura</div>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  );
}
