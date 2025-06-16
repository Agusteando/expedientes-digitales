
"use client";
import { useState, useRef } from "react";
import { PlusCircleIcon, PencilSquareIcon, TrashIcon, ArrowPathIcon } from "@heroicons/react/24/solid";

export default function PlantelListAdminPanel({ initialPlanteles = [], onRefresh }) {
  const [planteles, setPlanteles] = useState(initialPlanteles);
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const addInputRef = useRef();

  // Simple refetch pattern
  async function refetchPlanteles() {
    if (onRefresh) return onRefresh();
    setMsg("Cargando...");
    try {
      const res = await fetch("/api/admin/planteles/list", { credentials: "same-origin" });
      if (!res.ok) throw new Error("No se pudo cargar planteles.");
      setPlanteles(await res.json());
      setMsg("");
    } catch (e) {
      setMsg("No se pudo actualizar.");
    }
  }

  async function handleAddPlantel(e) {
    e.preventDefault();
    if (addName.trim().length < 2) {
      setMsg("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    setAddLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/planteles/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: addName.trim() }),
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo agregar plantel");
      }
      setAddOpen(false);
      setAddName("");
      setMsg("Plantel agregado correctamente.");
      await refetchPlanteles();
    } catch (e) {
      setMsg(e.message || "Error al agregar");
    } finally {
      setAddLoading(false);
    }
  }

  function handleEditOpen(id, val) {
    setEditId(id);
    setEditVal(val);
  }
  function handleEditCancel() {
    setEditId(null);
    setEditVal("");
  }
  async function handleEditSubmit(e) {
    e.preventDefault();
    if (editVal.trim().length < 2) return setMsg("Nombre inválido.");
    setEditLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/planteles/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name: editVal.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo renombrar plantel");
      }
      setMsg("Plantel renombrado.");
      setEditId(null); setEditVal("");
      await refetchPlanteles();
    } catch (e) {
      setMsg(e.message || "Error al renombrar");
    } finally {
      setEditLoading(false);
    }
  }
  function handleDeleteTry(id) {
    setDeleteId(id);
    setMsg("Confirma para borrar (acción irreversible)");
  }
  function handleDeleteCancel() {
    setDeleteId(null); setMsg("");
  }
  async function handleDeleteConfirm() {
    if (!deleteId) return;
    setDeleteLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/planteles/${deleteId}`, {
        method: "DELETE",
        credentials: "same-origin"
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo borrar plantel");
      }
      setMsg("Plantel eliminado.");
      setDeleteId(null);
      await refetchPlanteles();
    } catch (e) {
      setMsg(e.message || "Error al borrar");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <section className="w-full bg-white border border-cyan-200 shadow-xl rounded-2xl p-4 mb-6">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-bold text-cyan-800 text-lg">
          <span>Administrar Planteles</span>
          <button
            className="ml-4 flex items-center gap-1 px-3 py-1 bg-cyan-700 hover:bg-cyan-900 transition text-white text-xs rounded-full shadow font-bold"
            onClick={() => setAddOpen(true)}
            type="button"
            aria-label="Agregar nuevo plantel"
          >
            <PlusCircleIcon className="w-5 h-5 text-white" /> Nuevo Plantel
          </button>
        </div>
        <button className="p-1" aria-label="Recargar" onClick={refetchPlanteles} title="Refrescar">
          <ArrowPathIcon className="w-5 h-5 text-cyan-400" />
        </button>
      </header>
      {msg && (
        <div className="mb-2 text-center text-xs font-semibold text-slate-700">{msg}</div>
      )}
      <div className="w-full overflow-x-auto">
        <table className="min-w-full table-auto border rounded-xl text-xs sm:text-sm">
          <thead>
            <tr className="bg-cyan-50 border-b border-cyan-100">
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Nombre</th>
              <th className="px-3 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {planteles.map((p) => (
              <tr key={p.id} className="border-b border-cyan-50">
                <td className="px-3 py-2">{p.id}</td>
                <td className="px-3 py-2 font-semibold">
                  {editId === p.id ? (
                    <form onSubmit={handleEditSubmit} className="flex gap-1">
                      <input
                        type="text"
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        className="rounded border border-cyan-200 px-2 py-1 text-xs"
                        disabled={editLoading}
                        autoFocus
                        style={{ minWidth: 80 }}
                        maxLength={80}
                        aria-label="Nuevo nombre del plantel"
                      />
                      <button
                        type="submit"
                        disabled={editLoading || !editVal.trim()}
                        className="bg-cyan-700 text-white py-1 px-3 rounded shadow text-xs font-bold hover:bg-cyan-900"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        className="py-1 px-2 text-xs hover:text-red-500"
                        onClick={handleEditCancel}
                        disabled={editLoading}
                      >
                        Cancelar
                      </button>
                    </form>
                  ) : (
                    p.name
                  )}
                </td>
                <td className="px-3 py-2 flex gap-1">
                  <button
                    onClick={() => handleEditOpen(p.id, p.name)}
                    className="hover:bg-cyan-50 px-2 py-1 rounded"
                    title="Renombrar plantel"
                    aria-label="Renombrar"
                  >
                    <PencilSquareIcon className="w-5 h-5 text-cyan-700" />
                  </button>
                  <button
                    onClick={() => handleDeleteTry(p.id)}
                    className="hover:bg-red-50 px-2 py-1 rounded"
                    title="Eliminar plantel"
                    aria-label="Eliminar"
                  >
                    <TrashIcon className="w-5 h-5 text-red-600" />
                  </button>
                  {deleteId === p.id && (
                    <span className="ml-2 flex gap-1 items-center text-red-600 font-bold">
                      <button
                        onClick={handleDeleteConfirm}
                        disabled={deleteLoading}
                        className="bg-red-700 hover:bg-red-900 text-white px-3 py-1 rounded-full font-bold text-xs shadow"
                        type="button"
                      >
                        Confirmar borrar
                      </button>
                      <button
                        onClick={handleDeleteCancel}
                        className="text-xs font-bold px-2 py-1"
                        type="button"
                      >
                        Cancelar
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Add plantel modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl px-7 py-8 max-w-sm w-[95vw] shadow-xl border border-cyan-100 flex flex-col items-center">
            <h3 className="font-bold text-lg text-cyan-800 mb-2">Nuevo Plantel</h3>
            <form onSubmit={handleAddPlantel} className="w-full flex flex-col items-stretch gap-3">
              <label className="text-xs font-medium text-cyan-800 mb-1">Nombre del plantel</label>
              <input
                ref={addInputRef}
                type="text"
                className="rounded border border-cyan-300 px-3 py-2 text-base"
                maxLength={80}
                required
                autoFocus
                value={addName}
                onChange={e => setAddName(e.target.value)}
                disabled={addLoading}
                placeholder="Ej: Plantel Centro"
              />
              <div className="flex gap-2 justify-end items-center pt-1">
                <button
                  type="button"
                  disabled={addLoading}
                  className="text-xs font-bold px-3 py-1 rounded hover:text-cyan-700"
                  onClick={() => { setAddOpen(false); setAddName(""); }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-cyan-700 hover:bg-cyan-900 text-white text-xs font-bold rounded-full px-5 py-2 transition"
                  disabled={addLoading || !addName.trim()}
                >
                  {addLoading ? "Agregando..." : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
