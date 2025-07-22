
"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { PlusCircleIcon, TrashIcon, CheckCircleIcon, XMarkIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

export default function PlantelAdminMatrixCrud() {
  const [loading, setLoading] = useState(false);
  const [matrix, setMatrix] = useState({ admins: [], planteles: [] });
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [editState, setEditState] = useState({}); // `{[adminId-plantelId]:bool}`
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);

  async function fetchMatrix() {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/plantel-admin-matrix", { credentials: "same-origin" });
      if (!res.ok) throw new Error("No se pudo cargar");
      const d = await res.json();
      setMatrix(d);
    } catch (e) {
      setError(e.message || "Error de red");
    }
    setLoading(false);
  }
  useEffect(() => {
    fetchMatrix();
  }, []);

  function isAssigned(admin, plantelId) {
    return admin.plantelesAdmin.some(p => p.id === plantelId);
  }

  async function handleAssignToggle(adminId, plantelId, assigned) {
    setEditState(st => ({ ...st, [adminId + "-" + plantelId]: true }));
    try {
      const res = await fetch("/api/admin/plantel-admin-matrix/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ adminId, plantelId, assigned })
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error de red");
      await fetchMatrix();
    } catch (e) {
      setError(e.message || "Error");
    }
    setEditState(st => ({ ...st, [adminId + "-" + plantelId]: false }));
  }

  async function handleAddAdmin(e) {
    e.preventDefault();
    setAddLoading(true);
    setMsg("");
    setError("");
    try {
      const res = await fetch("/api/admin/plantel-admin-matrix/add-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name: addName.trim(), email: addEmail.trim() })
      });
      if (!res.ok) throw new Error((await res.json()).error || "No se pudo crear admin");
      setMsg("Administrador creado.");
      setAddOpen(false);
      setAddName(""); setAddEmail("");
      await fetchMatrix();
    } catch (e) {
      setError(e.message || "Error de red");
    }
    setAddLoading(false);
  }

  async function handleRemoveAdmin(id) {
    setLoading(true); setMsg(""); setError("");
    try {
      const res = await fetch("/api/admin/plantel-admin-matrix/remove-admin?id="+id, {
        method: "DELETE",
        credentials: "same-origin"
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error de red");
      setMsg("Eliminado.");
      setRemoveTarget(null);
      await fetchMatrix();
    } catch (e) {
      setError(e.message || "Error de red");
    }
    setLoading(false);
  }

  return (
    <section className="w-full bg-white border border-cyan-200 shadow-xl rounded-2xl p-4 mb-8 overflow-x-auto">
      <header className="flex flex-wrap items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-3 font-bold text-cyan-800 text-lg">
          <ShieldCheckIcon className="w-6 h-6 text-fuchsia-700" />
          Administradores de planteles
        </div>
        <button
          className="flex items-center gap-1 px-3 py-1 bg-cyan-700 hover:bg-cyan-900 transition text-white text-xs rounded-full shadow font-bold"
          onClick={() => setAddOpen(true)}
        >
          <PlusCircleIcon className="w-5 h-5 text-white" />Nuevo Administrador
        </button>
      </header>
      {(msg || error) && (
        <div className={`mb-2 text-center text-xs font-semibold ${msg ? "text-emerald-800" : "text-red-700"}`}>
          {msg || error}
        </div>
      )}
      <div className="overflow-x-auto border rounded-lg bg-slate-50 pt-2">
        <table className="min-w-fit w-full table-auto text-xs md:text-sm">
          <thead>
            <tr className="bg-cyan-100">
              <th className="px-2 py-2 font-bold text-left">Admin</th>
              <th className="px-2 py-2 font-bold text-left">Correo</th>
              {matrix.planteles.map(pl => (
                <th key={pl.id} className="py-2 px-2 text-center font-bold">{pl.label || pl.name}</th>
              ))}
              <th className="px-2 py-2 font-bold text-center">Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {matrix.admins.map(a => (
              <tr key={a.id} className="bg-white border-b border-cyan-50">
                <td className="py-2 px-2 flex gap-2 items-center">
                  <Image src={a.picture || "/IMAGOTIPO-IECS-IEDIS.png"} width={28} height={28} alt="" className="rounded-full bg-slate-100" />
                  <span className="font-bold text-cyan-900">{a.name}</span>
                  {a.isActive ? <CheckCircleIcon className="w-4 h-4 text-emerald-500" /> : <XMarkIcon className="w-4 h-4 text-slate-300" />}
                </td>
                <td className="py-2 px-2">{a.email}</td>
                {matrix.planteles.map(pl => {
                  const checked = isAssigned(a, pl.id);
                  const busy = !!editState[a.id + "-" + pl.id];
                  return (
                    <td key={pl.id} className="py-2 px-2 text-center">
                      <input
                        type="checkbox"
                        className="accent-cyan-800 w-5 h-5"
                        checked={checked}
                        disabled={busy || loading}
                        onChange={ev =>
                          handleAssignToggle(a.id, pl.id, !checked)
                        }
                        aria-label={`Administrador(a) ${a.name} para plantel ${pl.label || pl.name}`}
                      />
                    </td>
                  );
                })}
                <td className="py-2 px-2 text-center">
                  <button
                    className="text-red-700 hover:bg-red-100 rounded-full px-2 py-1"
                    onClick={() => setRemoveTarget(a)}
                    disabled={loading}
                    title="Eliminar admin"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {matrix.admins.length === 0 && (
              <tr>
                <td colSpan={2 + matrix.planteles.length + 1} className="text-center py-4 text-slate-400">No hay administradores.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {addOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-xl p-7 max-w-xs w-full shadow-xl flex flex-col items-center border border-cyan-100">
            <h3 className="font-bold text-lg text-cyan-800 mb-3">Nuevo Administrador</h3>
            <form className="w-full flex flex-col gap-3" onSubmit={handleAddAdmin}>
              <input
                type="text"
                required
                maxLength={64}
                className="rounded border border-cyan-200 px-3 py-2 text-base"
                placeholder="Nombre completo"
                value={addName}
                onChange={e => setAddName(e.target.value)}
                disabled={addLoading}
                autoFocus
              />
              <input
                type="email"
                required
                maxLength={100}
                className="rounded border border-cyan-200 px-3 py-2 text-base"
                placeholder="Correo institucional"
                value={addEmail}
                onChange={e => setAddEmail(e.target.value)}
                disabled={addLoading}
              />
              <div className="flex gap-2 mt-2 justify-end">
                <button type="button" className="text-xs font-bold px-3 py-1 rounded hover:text-cyan-700" disabled={addLoading} onClick={() => setAddOpen(false)}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addLoading || !(addName && addEmail)}
                  className="bg-cyan-700 hover:bg-cyan-900 text-white text-xs font-bold rounded-full px-5 py-2"
                >
                  {addLoading ? "Guardando..." : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {removeTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 max-w-xs w-full border border-red-100 flex flex-col items-center shadow-lg text-center">
            <h3 className="font-bold text-lg text-red-800 mb-4">¿Eliminar a {removeTarget.name}?</h3>
            <div className="text-xs text-slate-800 mb-5">Esta acción es irreversible y elimina la cuenta de administrador.</div>
            <div className="flex flex-row justify-center gap-2 mt-2">
              <button
                className="bg-slate-200 px-4 py-2 rounded-full font-bold text-xs"
                onClick={() => setRemoveTarget(null)}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className="bg-red-700 hover:bg-red-900 text-white font-bold px-4 py-2 rounded-full text-xs"
                onClick={() => handleRemoveAdmin(removeTarget.id)}
                disabled={loading}
              >
                Confirmar borrar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
