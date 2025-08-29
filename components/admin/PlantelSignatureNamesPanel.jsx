
"use client";
import { useState, useEffect } from "react";
import { PencilSquareIcon, ArrowPathIcon, CheckCircleIcon } from "@heroicons/react/24/solid";

// Plantel signatures management panel for superadmins
export default function PlantelSignatureNamesPanel() {
  const [planteles, setPlanteles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [msg, setMsg] = useState("");
  const [edit, setEdit] = useState({});
  const [isDirty, setIsDirty] = useState({});

  async function fetchPlanteles() {
    setLoading(true);
    setMsg("");
    const r = await fetch("/api/admin/planteles/list", { credentials: "same-origin" });
    const d = await r.json();
    setPlanteles(d || []);
    setLoading(false);
  }

  useEffect(() => { fetchPlanteles(); }, []);

  function handleEdit(id, field, value) {
    setEdit(e => ({ ...e, [id]: { ...e[id], [field]: value } }));
    setIsDirty(d => ({ ...d, [id]: true }));
  }

  async function handleSave(plantel) {
    setSavingId(plantel.id);
    setMsg("");
    const data = {
      direccion: edit[plantel.id]?.direccion ?? plantel.direccion ?? "",
      administracion: edit[plantel.id]?.administracion ?? plantel.administracion ?? "",
      coordinacionGeneral: edit[plantel.id]?.coordinacionGeneral ?? plantel.coordinacionGeneral ?? "",
    };
    try {
      const resp = await fetch(`/api/admin/planteles/${plantel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(data),
      });
      if (!resp.ok) throw new Error((await resp.json()).error || "Error al guardar");
      setMsg(`Guardado "${plantel.label || plantel.name}"`);
      setIsDirty(d => ({ ...d, [plantel.id]: false }));
      await fetchPlanteles();
    } catch (e) {
      setMsg(e.message || "Error guardando");
    }
    setSavingId(null);
  }

  return (
    <section className="w-full bg-white border border-cyan-200 shadow-xl rounded-2xl p-4 mb-6">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-bold text-cyan-800 text-lg">
          <span>Firmas por Plantel</span>
        </div>
        <button className="p-1" aria-label="Recargar" onClick={fetchPlanteles} title="Refrescar">
          <ArrowPathIcon className="w-5 h-5 text-cyan-400" />
        </button>
      </header>
      {msg && (
        <div className="mb-3 text-center text-xs font-bold text-cyan-700 flex items-center gap-2 justify-center">
          <CheckCircleIcon className="w-4 h-4" /> {msg}
        </div>
      )}
      {loading ? (
        <div className="text-center my-10 font-semibold text-slate-500">Cargando...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border rounded-xl text-xs sm:text-sm mb-3">
            <thead>
              <tr className="bg-cyan-50 border-b border-cyan-100">
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Plantel</th>
                <th className="px-3 py-2">Dirección</th>
                <th className="px-3 py-2">Administración</th>
                <th className="px-3 py-2">Coordinación General</th>
                <th className="px-3 py-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {planteles.map(p => (
                <tr key={p.id} className="border-b border-cyan-50">
                  <td className="px-3 py-2">{p.id}</td>
                  <td className="px-3 py-2 font-semibold">{p.label || p.name}</td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      className="border border-cyan-200 rounded px-2 py-1 w-full"
                      defaultValue={p.direccion || ""}
                      onChange={e => handleEdit(p.id, "direccion", e.target.value)}
                      disabled={savingId === p.id}
                      maxLength={80}
                      placeholder="Nombre dirección"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      className="border border-cyan-200 rounded px-2 py-1 w-full"
                      defaultValue={p.administracion || ""}
                      onChange={e => handleEdit(p.id, "administracion", e.target.value)}
                      disabled={savingId === p.id}
                      maxLength={80}
                      placeholder="Nombre administración"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      className="border border-cyan-200 rounded px-2 py-1 w-full"
                      defaultValue={p.coordinacionGeneral || ""}
                      onChange={e => handleEdit(p.id, "coordinacionGeneral", e.target.value)}
                      disabled={savingId === p.id}
                      maxLength={80}
                      placeholder="Nombre coordinación general"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleSave(p)}
                      className={`rounded-full px-2 py-1 text-xs font-bold bg-cyan-700 text-white hover:bg-cyan-900 flex items-center gap-1 disabled:opacity-60`}
                      disabled={savingId === p.id || !isDirty[p.id]}
                      title="Guardar"
                    >
                      <PencilSquareIcon className="w-4 h-4" />Guardar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-slate-500">
            Estos datos aparecerán automáticamente como firmas en los PDFs generados de ficha técnica.
          </div>
        </div>
      )}
    </section>
  );
}
