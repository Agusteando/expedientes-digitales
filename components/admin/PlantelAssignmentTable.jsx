
"use client";
import { useEffect, useState } from "react";
import { ArrowRightOnRectangleIcon, UserPlusIcon } from "@heroicons/react/24/outline";

export default function PlantelAssignmentTable() {
  const [users, setUsers] = useState([]);
  const [planteles, setPlanteles] = useState([]);
  const [selection, setSelection] = useState({});
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // On mount, fetch all unassigned users and planteles
  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch("/api/admin/users/unassigned").then(r => r.json()),
      fetch("/api/admin/planteles/list").then(r => r.json())
    ]).then(([usersData, plantelesData]) => {
      if (mounted) {
        setUsers(usersData || []);
        setPlanteles(plantelesData || []);
      }
    });
    return () => { mounted = false; }
  }, []);

  // Handle assignment action
  async function handleAssign() {
    setPending(true);
    setError(""); setSuccess("");
    // Map: user id => plantel id (assigned)
    const assignBatch = users.filter(u => selection[u.id]);
    if (assignBatch.length === 0) {
      setError("Selecciona al menos un usuario y un plantel.");
      setPending(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/users/assign-plantel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: assignBatch.map(u => u.id),
          plantelId: selection[assignBatch[0].id], // for simplicity, all assigned to same plantel
        }),
      });
      if (!res.ok) {
        setError("No se pudo asignar plantel.");
      } else {
        setSuccess("Asignado correctamente.");
        setUsers(prev => prev.filter(u => !assignBatch.some(a => a.id === u.id)));
        setSelection({});
      }
    } catch {
      setError("Error de red.");
    }
    setPending(false);
    setTimeout(() => setSuccess(""), 1700);
  }

  if (users.length === 0) {
    return (
      <div className="w-full text-center text-sm text-emerald-900 bg-emerald-50 border border-emerald-100 rounded-xl py-3 mb-2">
        No hay usuarios sin plantel asignado.
      </div>
    );
  }
  return (
    <section className="w-full bg-white/95 border border-cyan-100 rounded-2xl shadow p-4 mt-2 mb-4">
      <header className="font-bold text-cyan-800 text-base mb-2 flex items-center gap-1">
        <UserPlusIcon className="w-6 h-6 text-cyan-400 mr-1" />Usuarios nuevos por asignar a plantel
      </header>
      <table className="min-w-full text-xs xs:text-sm table-auto mb-3">
        <thead>
          <tr className="border-b border-cyan-100 text-cyan-700 font-semibold">
            <th className="px-2 py-1 text-left">Nombre</th>
            <th className="px-2 py-1 text-left">Correo</th>
            <th className="px-2 py-1 text-left">Plantel</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="border-b border-cyan-50 hover:bg-cyan-50/30">
              <td className="px-2 py-1 font-semibold">{u.name}</td>
              <td className="px-2 py-1">{u.email}</td>
              <td className="px-2 py-1">
                <select
                  className="rounded border-cyan-200 px-3 py-1"
                  value={selection[u.id] || ""}
                  onChange={e => setSelection(sel => ({ ...sel, [u.id]: e.target.value }))}
                >
                  <option value="">Plantel...</option>
                  {planteles.map(p =>
                    <option value={p.id} key={p.id}>{p.name}</option>
                  )}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-row items-center gap-3">
        <button
          className="bg-cyan-700 hover:bg-cyan-900 text-white rounded-full px-6 py-2 font-bold flex flex-row gap-2 items-center transition"
          onClick={handleAssign}
          disabled={pending}
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          Asignar Seleccionados
        </button>
        {pending && <span className="font-bold text-cyan-600 animate-pulse">Asignando...</span>}
        {success && <span className="font-bold text-emerald-700">{success}</span>}
        {error && <span className="font-bold text-red-600">{error}</span>}
      </div>
    </section>
  );
}
