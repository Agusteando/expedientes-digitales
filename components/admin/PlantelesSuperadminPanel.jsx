
"use client";
import { useState } from "react";
import { PencilIcon, TrashIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export default function PlantelesSuperadminPanel({ planteles, admins }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);

  async function handleRename(id) {
    setError("");
    try {
      await fetch(`/api/admin/planteles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setEditing(null); setName("");
      router.refresh();
    } catch {
      setError("Error al renombrar");
    }
  }
  async function handleDelete(id) {
    if (!confirm("¿Seguro que deseas eliminar este plantel?")) return;
    setDeleting(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/planteles/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      router.refresh();
    } catch (e) {
      setError(e.message || "Error");
    }
    setDeleting(null);
  }

  return (
    <section className="my-6 bg-white border rounded-2xl shadow p-4">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
        <UserGroupIcon className="w-6 h-6 text-cyan-600" />
        Planteles (gestión superadmin)
      </h2>
      {error && <div className="mb-2 text-red-700 font-semibold">{error}</div>}
      <table className="w-full table-auto text-sm rounded">
        <thead>
          <tr className="text-left border-b border-cyan-100">
            <th>Nombre</th>
            <th>Admins</th>
            <th className="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {planteles.map(plantel => (
            <tr key={plantel.id} className="border-b border-cyan-50">
              <td>
                {editing === plantel.id ? (
                  <form
                    onSubmit={e => { e.preventDefault(); handleRename(plantel.id); }}>
                    <input
                      className="border-b border-cyan-400 px-1"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />{" "}
                    <button type="submit" className="text-emerald-700 font-bold">Ok</button>
                    <button onClick={e => { e.preventDefault(); setEditing(null); setName(""); }} className="text-red-600 font-semibold ml-2">Cancelar</button>
                  </form>
                ) : (
                  plantel.name
                )}
              </td>
              <td>
                {(plantel.admins || []).map(a =>
                  <span className="px-2 py-1 rounded bg-cyan-50 border text-cyan-900 font-semibold mr-2" key={a.id}>
                    {admins.find(adm => adm.id === a.id)?.name || "Sin nombre"}
                  </span>
                )}
              </td>
              <td className="flex gap-3 justify-end">
                <button
                  className="text-cyan-700 hover:text-cyan-900 px-1"
                  onClick={() => { setEditing(plantel.id); setName(plantel.name); }}>
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button
                  className="text-red-600 hover:text-red-900 px-1"
                  onClick={() => handleDelete(plantel.id)}
                  disabled={deleting === plantel.id}>
                  <TrashIcon className="w-5 h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
