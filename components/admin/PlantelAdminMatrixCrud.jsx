
"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { PlusCircleIcon, TrashIcon, CheckCircleIcon, XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function PlantelAdminMatrixCrud() {
  const [loading, setLoading] = useState(false);
  const [matrix, setMatrix] = useState({ admins: [], planteles: [] });
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [editState, setEditState] = useState({});
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);

  // Filter UX
  const [rowFilter, setRowFilter] = useState("");
  const matrixRef = useRef();

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

  // -- FILTERED VIEW: --
  const adminsFiltered = matrix.admins.filter(a =>
    !rowFilter ||
    a.name.toLowerCase().includes(rowFilter.trim().toLowerCase()) ||
    a.email.toLowerCase().includes(rowFilter.trim().toLowerCase())
  );

  return (
    <section className="w-full bg-white border border-cyan-200 shadow-xl rounded-2xl p-4 mb-8 transition-all duration-200"
             id="plantel-admin-matrix-crud"
             ref={matrixRef}
    >
      <header className="flex flex-wrap items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-3 font-bold text-cyan-800 text-lg">
          Administradores de planteles
        </div>
        <div className="flex flex-row gap-2 items-center">
          <form
            className="relative mr-2"
            onSubmit={e => { e.preventDefault(); }}
            autoComplete="off"
          >
            <MagnifyingGlassIcon className="w-5 h-5 text-cyan-400 absolute top-2.5 left-2" />
            <input
              className="pl-8 pr-2 py-2 rounded border border-cyan-200 text-xs sm:text-sm transition w-[120px] xs:w-[150px] sm:w-[200px] bg-white font-mono"
              placeholder="Filtrar admin/correo"
              value={rowFilter}
              onChange={e => setRowFilter(e.target.value)}
            />
          </form>
          <button
            className="flex items-center gap-1 px-3 py-1 bg-cyan-700 hover:bg-cyan-900 transition text-white text-xs rounded-full shadow font-bold"
            onClick={() => setAddOpen(true)}
            type="button"
            aria-label="Agregar nuevo admin"
          >
            <PlusCircleIcon className="w-5 h-5 text-white" />Nuevo Admin
          </button>
        </div>
      </header>
      {(msg || error) && (
        <div className={`mb-2 text-center text-xs font-semibold ${msg ? "text-emerald-800" : "text-red-700"}`}>{msg || error}</div>
      )}
      <div className="w-full overflow-x-auto border rounded-lg bg-slate-50 relative">
        <table className="min-w-fit w-full table-auto text-xs md:text-sm border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 bg-white z-30 px-2 py-3 font-bold text-left border-r-2 border-cyan-100 min-w-[180px] shadow-md"
                  style={{ boxShadow: "4px 0 5px -4px #d1eafd" }}>
                Admin
              </th>
              <th className="sticky left-[180px] top-0 bg-white z-30 px-2 py-3 font-bold text-left border-r-2 border-cyan-50 min-w-[160px] shadow-md"
                  style={{ boxShadow: "4px 0 4px -5px #d1eafd" }}>
                Correo
              </th>
              {matrix.planteles.map((pl, i) => (
                <th
                  key={pl.id}
                  className={`sticky top-0 bg-white z-20 text-center font-bold py-3 px-2 border-b-2 border-cyan-50 min-w-[120px]`}
                >
                  <span className="block truncate font-semibold">{pl.label || pl.name}</span>
                </th>
              ))}
              <th className="sticky top-0 bg-white z-30 px-2 py-3 font-bold text-center border-l-2 border-cyan-50 min-w-[84px] shadow-md">Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {adminsFiltered.map((a) => (
              <tr key={a.id} className="bg-white border-b border-cyan-50">
                <td
                  className="sticky left-0 bg-white z-20 px-2 py-2 border-r-2 border-cyan-100 min-w-[180px] font-semibold shadow-md"
                  style={{ boxShadow: "4px 0 4px -6px #d1eafd" }}
                >
                  <div className="flex gap-2 items-center">
                    <Image src={a.picture || "/IMAGOTIPO-IECS-IEDIS.png"} width={22} height={22} alt="" className="rounded-full bg-slate-100" />
                    <span className="text-cyan-900 font-bold text-[14px] truncate">{a.name}</span>
                  </div>
                  {a.isActive
                    ? <CheckCircleIcon className="w-4 h-4 text-emerald-500 inline mb-1 ml-1" />
                    : <XMarkIcon className="w-4 h-4 text-slate-300 inline mb-1 ml-1" />
                  }
                </td>
                <td
                  className="sticky left-[180px] bg-white z-20 px-2 py-2 border-r-2 border-cyan-50 min-w-[160px] font-mono shadow"
                  style={{ boxShadow: "3px 0 3px -4px #d1eafd" }}
                >
                  <span className="text-slate-700 text-[13px]">{a.email}</span>
                </td>
                {matrix.planteles.map((pl, i) => {
                  const checked = isAssigned(a, pl.id);
                  const busy = !!editState[a.id + "-" + pl.id];
                  return (
                    <td
                      key={pl.id}
                      className="align-middle py-2 px-2 text-center bg-white"
                      style={{
                        minWidth: 120,
                        background: "#fff",
                        zIndex: 10,
                      }}
                    >
                      <input
                        type="checkbox"
                        className="accent-cyan-800 w-5 h-5"
                        checked={checked}
                        disabled={busy || loading}
                        onChange={ev => handleAssignToggle(a.id, pl.id, !checked)}
                        aria-label={`Administrador(a) ${a.name} para plantel ${pl.label || pl.name}`}
                      />
                    </td>
                  );
                })}
                <td className="py-2 px-2 text-center bg-white min-w-[84px]">
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
            {adminsFiltered.length === 0 && (
              <tr>
                <td colSpan={2 + matrix.planteles.length + 1} className="text-center py-4 text-slate-400">No hay administradores y/o filtro.</td>
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
