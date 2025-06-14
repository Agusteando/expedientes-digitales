
"use client";
import { useState, useRef } from "react";
import { ArrowRightOnRectangleIcon, UserPlusIcon, CheckCircleIcon, ChevronDoubleDownIcon, ChevronDoubleUpIcon, SparklesIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

// Suggest plantel based on heuristics (here: uses first plantel, customize as needed)
function getSuggestedPlantel(user, planteles) {
  // Example: guess by email domain, or simply choose the first plantel.
  // TODO: improve with HR logic, prior records, location.
  return planteles.length ? planteles[0].id : "";
}

/**
 * Props:
 *   - users: array (user objects)
 *   - planteles: array (planteles)
 *   - onAssign: async function(assignBatch, plantelId)
 *   - assignLoading: boolean
 *   - compact: boolean (optional)
 *   - showSuggested: boolean (optional)
 */
export default function PlantelAssignmentTable({ users, planteles, onAssign, assignLoading, compact, showSuggested }) {
  const [selection, setSelection] = useState({});
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [selectedPlantel, setSelectedPlantel] = useState(""); // bulk plantel dropdown
  const [filter, setFilter] = useState("");
  const lastClickedIndex = useRef(null);

  // Returns an array of selected user IDs
  const selectedUserIds = users.filter(u => !!selection[u.id]).map(u => u.id);

  // Filtered list by search
  const filteredUsers = !filter.trim()
    ? users
    : users.filter(u =>
        u.name.toLowerCase().includes(filter.trim().toLowerCase()) ||
        u.email.toLowerCase().includes(filter.trim().toLowerCase())
      );

  // Select all/none
  function selectAll() {
    const next = {};
    filteredUsers.forEach(u => {
      next[u.id] = selectedPlantel || getSuggestedPlantel(u, planteles) || "";
    });
    setSelection(next);
  }
  function unselectAll() {
    setSelection({});
  }
  function allSelected() {
    return filteredUsers.length > 0 && filteredUsers.every(u => !!selection[u.id]);
  }

  function handleUserSelect(e, user, idx) {
    let next = { ...selection };
    if (selection[user.id]) delete next[user.id];
    else next[user.id] = selection[user.id] || selectedPlantel || getSuggestedPlantel(user, planteles) || "";
    setSelection(next);
    lastClickedIndex.current = idx;
  }

  function handleBulkPlantelChange(e) {
    const val = e.target.value;
    setSelectedPlantel(val);
    // Apply to all selected
    const nextSel = { ...selection };
    Object.keys(nextSel).forEach(id => (nextSel[id] = val));
    setSelection(nextSel);
  }

  function setUserPlantel(userId, value) {
    setSelection(sel => ({ ...sel, [userId]: value }));
  }

  async function handleAssign() {
    setError(""); setSuccess("");
    const assignBatch = filteredUsers.filter(u => selection[u.id]);
    if (!assignBatch.length) {
      setError("Selecciona al menos un usuario y un plantel.");
      return;
    }
    // Ensure all selected have a plantel
    const plantelesUsed = Array.from(new Set(assignBatch.map(u => selection[u.id]).filter(Boolean)));
    if (plantelesUsed.length !== 1) {
      setError("Todos los seleccionados deben tener el mismo plantel para asignación.");
      return;
    }
    try {
      await onAssign(assignBatch, plantelesUsed[0]);
      setSuccess("Asignado correctamente.");
      setSelection({});
      setSelectedPlantel("");
      setTimeout(() => setSuccess(""), 1500);
    } catch (e) {
      setError("No se pudo asignar plantel.");
    }
  }

  if (!users.length) {
    return (
      <div className="w-full text-center text-sm text-emerald-900 bg-emerald-50 border border-emerald-100 rounded-xl py-5 mb-2 font-semibold">
        ¡Todos los usuarios están asignados a un plantel!
      </div>
    );
  }

  return (
    <section className="w-full bg-white border border-cyan-200 rounded-2xl shadow-xl px-4 py-6 mt-2 mb-8">
      <header className="font-bold text-cyan-800 text-base mb-3 flex items-center gap-2">
        <UserPlusIcon className="w-6 h-6 text-cyan-400 mr-1" />
        Usuarios nuevos <span className="text-slate-500 font-semibold text-sm">({users.length} sin plantel)</span>
        {showSuggested && (
          <span className="flex items-center gap-1 px-2 py-0.5 ml-4 bg-cyan-50 border border-cyan-100 rounded-full text-xs font-semibold text-cyan-700">
            <SparklesIcon className="w-4 h-4" /> Sugerencia automática de plantel
          </span>
        )}
      </header>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
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
        <button
          className={"flex flex-row gap-1 items-center px-3 py-1 rounded-full font-bold text-xs border transition " + (allSelected() ? "bg-cyan-800 text-white border-cyan-800" : "bg-white border-cyan-900 text-cyan-900 hover:bg-cyan-50")}
          onClick={allSelected() ? unselectAll : selectAll}
          type="button"
        >
          {allSelected() ? <ChevronDoubleUpIcon className="w-4 h-4" /> : <ChevronDoubleDownIcon className="w-4 h-4" />}
          {allSelected() ? "Deseleccionar todos" : "Seleccionar todos"}
        </button>
        <select
          className="rounded border-cyan-300 bg-white px-2 py-1"
          value={selectedPlantel}
          onChange={handleBulkPlantelChange}
        >
          <option value="">Plantel para seleccionados...</option>
          {planteles.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {!!selectedUserIds.length && (
          <span className="text-xs text-cyan-700 font-bold ml-2">Seleccionados: {selectedUserIds.length}</span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className={"min-w-full text-xs xs:text-sm table-auto mb-3 " + (compact ? "text-xs" : "")}>
          <thead>
            <tr className="border-b border-cyan-100 text-cyan-700 font-semibold">
              <th className="px-2 py-1 text-left">#</th>
              <th className="px-2 py-1 text-left">Nombre</th>
              <th className="px-2 py-1 text-left">Correo</th>
              {showSuggested && <th className="px-2 py-1 text-left">Sugerido</th>}
              <th className="px-2 py-1 text-left">Plantel</th>
              <th className="px-2 py-1 text-center">Seleccionar</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u, idx) => {
              const isSelected = !!selection[u.id];
              const suggestedId = getSuggestedPlantel(u, planteles);
              const selectedPlantelId = selection[u.id] || "";
              const isSuggested = selectedPlantelId === suggestedId && !!selectedPlantelId;
              return (
                <tr key={u.id} className={`border-b border-cyan-50 hover:bg-cyan-50/30 ${isSelected ? "bg-cyan-50" : ""}`}>
                  <td className="px-2 py-1">
                    {isSelected ? <CheckCircleIcon className="inline w-4 h-4 text-emerald-500" /> : idx + 1}
                  </td>
                  <td className="px-2 py-1 font-semibold">{u.name}</td>
                  <td className="px-2 py-1">{u.email}</td>
                  {showSuggested && (
                    <td className="px-2 py-1">
                      {suggestedId
                        ? <span className={"px-2 py-0.5 rounded-full text-xs font-semibold " + (isSuggested ? "bg-emerald-100 text-emerald-700" : "bg-cyan-50 text-cyan-700")}>
                            {planteles.find(p => p.id === suggestedId)?.name || "Sugerido"}
                          </span>
                        : <span className="text-slate-400">—</span>
                      }
                    </td>
                  )}
                  <td className="px-2 py-1 whitespace-nowrap">
                    <select
                      className="rounded border-cyan-200 px-3 py-1"
                      value={selectedPlantelId}
                      disabled={!isSelected}
                      onChange={e => setUserPlantel(u.id, e.target.value)}
                      onClick={e => e.stopPropagation()}
                    >
                      <option value="">Plantel...</option>
                      {planteles.map(p =>
                        <option value={p.id} key={p.id}>{p.name}</option>
                      )}
                    </select>
                  </td>
                  <td className="px-2 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => {
                        e.stopPropagation();
                        handleUserSelect(e, u, idx);
                      }}
                      className="accent-cyan-600 w-4 h-4"
                    />
                  </td>
                </tr>
              );
            })}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={showSuggested ? 6 : 5} className="text-center text-slate-400 py-5">No se encontraron usuarios.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-row items-center gap-3 mt-3">
        <button
          className="bg-cyan-700 hover:bg-cyan-900 text-white rounded-full px-7 py-2 font-bold flex flex-row gap-2 items-center transition shadow-md"
          onClick={handleAssign}
          disabled={assignLoading}
          type="button"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          Asignar seleccionados
        </button>
        {assignLoading && <span className="font-bold text-cyan-600 animate-pulse">Asignando...</span>}
        {success && <span className="font-bold text-emerald-700">{success}</span>}
        {error && <span className="font-bold text-red-600">{error}</span>}
      </div>
      <div className="pt-2 text-xs text-slate-600">
        Selecciona usuarios y elige el plantel adecuado. Sugerencia automática de plantel disponible.
      </div>
    </section>
  );
}
