
"use client";
import { useState, useRef, useMemo, useEffect } from "react";
import { UserPlusIcon, BuildingLibraryIcon, ArrowRightOnRectangleIcon, ChevronDoubleUpIcon, ChevronDoubleDownIcon, MagnifyingGlassIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

export default function AssignEmployeesSection({
  unassignedUsers = [],
  planteles = [],
  userRole,
  adminPlantelIds = [],
  multiplePlantelesForAdmin = false,
  defaultAssignPlantelId,
  onAssign
}) {
  const [filter, setFilter] = useState("");
  const filteredUsers = !filter.trim()
    ? unassignedUsers
    : unassignedUsers.filter(u =>
        u.name?.toLowerCase().includes(filter.trim().toLowerCase()) ||
        u.email?.toLowerCase().includes(filter.trim().toLowerCase())
      );

  // Log both full input and the actually rendered users
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("[DEBUG-client] AssignEmployeesSection unassignedUsers (raw, first 10):", Array.isArray(unassignedUsers) ? unassignedUsers.slice(0,10) : unassignedUsers, "total:", Array.isArray(unassignedUsers) ? unassignedUsers.length : "no array");
      console.log("[DEBUG-client] AssignEmployeesSection filtered (rendered) users (first 10):", filteredUsers.slice(0,10), "total:", filteredUsers.length);
    }
  }, [unassignedUsers, filter, filteredUsers.length]);

  const [selection, setSelection] = useState({});
  const selectedUserIds = filteredUsers.filter(u => selection[u.id]).map(u => u.id);
  const allSelected = filteredUsers.length > 0 && filteredUsers.every(u => !!selection[u.id]);
  function selectAll() {
    const next = {};
    filteredUsers.forEach(u => { next[u.id] = true; });
    setSelection(next);
  }
  function unselectAll() {
    setSelection({});
  }
  function handleUserSelect(user, idx) {
    let next = { ...selection };
    if (selection[user.id]) delete next[user.id];
    else next[user.id] = true;
    setSelection(next);
  }
  const isSuperadmin = userRole === "superadmin";
  const adminCanChoosePlantel = !isSuperadmin && multiplePlantelesForAdmin;
  const canBulkAssign = selectedUserIds.length > 0;
  const [targetPlantelId, setTargetPlantelId] = useState(defaultAssignPlantelId || "");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function doAssign() {
    setError(""); setSuccess("");
    if (!canBulkAssign) {
      setError("Selecciona usuarios primero.");
      return;
    }
    if (!targetPlantelId) {
      setError("Elige un plantel.");
      return;
    }
    setLoading(true);
    try {
      await onAssign({ userIds: selectedUserIds, plantelId: targetPlantelId });
      setSuccess("Usuarios asignados correctamente.");
      setSelection({});
      setTimeout(() => setSuccess(""), 1600);
      window.location.reload();
    } catch (e) {
      setError((e?.message) || "No se pudo asignar usuarios.");
    }
    setLoading(false);
  }

  useMemo(() => {
    if (!isSuperadmin && !targetPlantelId && planteles.length === 1) {
      setTargetPlantelId(String(planteles[0].id));
    }
  }, [isSuperadmin, planteles.length]);

  function getSuggestedPlantel(u) {
    if (planteles.length === 1) return planteles[0];
    return null;
  }

  return (
    <section className="w-full bg-white border border-cyan-200 rounded-2xl shadow-xl px-4 py-6 mb-8">
      <header className="font-bold text-cyan-800 text-base mb-4 flex items-center gap-2">
        <UserPlusIcon className="w-6 h-6 text-cyan-400 mr-1" />
        Asignar empleados y candidatos a plantel
        <span className="ml-2 px-2 py-0.5 text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-100 rounded-full">
          Sin asignar: {unassignedUsers.length}
        </span>
      </header>
      <div className="flex flex-wrap items-center gap-4 mb-3">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-2 py-1">
          <MagnifyingGlassIcon className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            className="bg-transparent outline-none font-medium text-xs"
            placeholder="Buscar usuario por nombre o correo..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
        {isSuperadmin && (
          <select
            className="rounded border-cyan-300 bg-white px-2 py-1"
            value={targetPlantelId}
            onChange={e => setTargetPlantelId(e.target.value)}
          >
            <option value="">Elige plantel para asignar...</option>
            {planteles.map(p => (
              <option value={p.id} key={p.id}>{p.name}</option>
            ))}
          </select>
        )}
        {adminCanChoosePlantel && (
          <select
            className="rounded border-cyan-300 bg-white px-2 py-1"
            value={targetPlantelId}
            onChange={e => setTargetPlantelId(e.target.value)}
          >
            <option value="">Elige plantel para asignar...</option>
            {planteles.filter(p => adminPlantelIds.includes(p.id)).map(p =>
              <option value={p.id} key={p.id}>{p.name}</option>
            )}
          </select>
        )}
        {!isSuperadmin && !adminCanChoosePlantel && planteles.length === 1 && (
          <div className="px-3 py-1 bg-cyan-50 border border-cyan-100 rounded text-cyan-700 font-bold text-xs">
            Plantel objetivo: {planteles[0].name}
          </div>
        )}
        <button
          className={"flex flex-row gap-1 items-center px-3 py-1 rounded-full font-bold text-xs border transition " +
            (allSelected ? "bg-cyan-800 text-white border-cyan-800" : "bg-white border-cyan-900 text-cyan-900 hover:bg-cyan-50")}
          onClick={allSelected ? unselectAll : selectAll}
          type="button"
          aria-label={allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
          disabled={filteredUsers.length === 0}
        >
          {allSelected ? <ChevronDoubleUpIcon className="w-4 h-4" /> : <ChevronDoubleDownIcon className="w-4 h-4" />}
          {allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
        </button>
        {selectedUserIds.length > 0 && (
          <span className="ml-2 text-xs text-cyan-700 font-bold">Seleccionados: {selectedUserIds.length}</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs xs:text-sm table-auto mb-3">
          <thead>
            <tr className="border-b border-cyan-100 text-cyan-700 font-semibold">
              <th className="px-2 py-1 text-left">#</th>
              <th className="px-2 py-1 text-left">Nombre</th>
              <th className="px-2 py-1 text-left">Correo</th>
              <th className="px-2 py-1 text-left">Rol</th>
              {isSuperadmin && <th className="px-2 py-1 text-left">Sugerido</th>}
              <th className="px-2 py-1 text-center">Seleccionar</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u, idx) => {
              const isSelected = !!selection[u.id];
              const suggested = isSuperadmin ? getSuggestedPlantel(u) : null;
              let roleDisplay = u.role === "employee"
                ? <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Empleado</span>
                : u.role === "candidate"
                  ? (u.isApproved
                      ? <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">Candidato aprobado</span>
                      : <span className="text-xs font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full">Candidato</span>)
                  : <span className="text-xs text-slate-500">{u.role}</span>;
              return (
                <tr key={u.id} className={`border-b border-cyan-50 hover:bg-cyan-50/30 ${isSelected ? "bg-cyan-50" : ""}`}>
                  <td className="px-2 py-1">{isSelected ? <CheckCircleIcon className="inline w-4 h-4 text-emerald-500" /> : idx + 1}</td>
                  <td className="px-2 py-1 font-semibold">{u.name}</td>
                  <td className="px-2 py-1">{u.email}</td>
                  <td className="px-2 py-1">{roleDisplay}</td>
                  {isSuperadmin && (
                    <td className="px-2 py-1">
                      {suggested
                        ? <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-semibold">{suggested.name}</span>
                        : <span className="text-slate-400">—</span>
                      }
                    </td>
                  )}
                  <td className="px-2 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleUserSelect(u, idx)}
                      className="accent-cyan-600 w-4 h-4"
                      aria-label={"Seleccionar usuario " + u.name}
                    />
                  </td>
                </tr>
              );
            })}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={isSuperadmin ? 6 : 5} className="text-center text-slate-400 py-5">No se encontraron usuarios.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-row items-center gap-3 mt-3">
        <button
          className="bg-cyan-700 hover:bg-cyan-900 text-white rounded-full px-7 py-2 font-bold flex flex-row gap-2 items-center transition shadow-md disabled:opacity-80"
          onClick={doAssign}
          disabled={!canBulkAssign || !targetPlantelId || loading}
          type="button"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          {loading ? "Asignando..." : "Asignar seleccionados"}
        </button>
        {success && <span className="font-bold text-emerald-700">{success}</span>}
        {error && <span className="font-bold text-red-600">{error}</span>}
      </div>
      <div className="pt-2 text-xs text-slate-600">
        Selecciona empleados o candidatos no asignados para asignar al plantel.
      </div>
    </section>
  );
}
