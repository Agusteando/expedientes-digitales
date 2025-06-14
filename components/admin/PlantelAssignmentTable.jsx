
"use client";
import { useState, useRef } from "react";
import { ArrowRightOnRectangleIcon, UserPlusIcon, CheckCircleIcon, ChevronDoubleDownIcon, ChevronDoubleUpIcon } from "@heroicons/react/24/outline";

/**
 * Props:
 *   - users: array
 *   - planteles: array
 *   - onAssign: async function(assignBatch, plantelId)
 *   - assignLoading: boolean
 */
export default function PlantelAssignmentTable({ users, planteles, onAssign, assignLoading }) {
  const [selection, setSelection] = useState({});
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const lastClickedIndex = useRef(null);
  const [selectedPlantel, setSelectedPlantel] = useState(""); // bulk plantel dropdown
  const [lastUserClicked, setLastUserClicked] = useState(null);

  // Returns an array of selected user IDs
  const selectedUserIds = users.filter(u => !!selection[u.id]).map(u => u.id);

  // Select all users logic
  function selectAll() {
    const next = {};
    users.forEach(u => {
      next[u.id] = selectedPlantel || "";
    });
    setSelection(next);
  }
  function unselectAll() {
    setSelection({});
  }
  function allSelected() {
    return users.length > 0 && users.every(u => !!selection[u.id]);
  }

  // Checkbox/row clicking logic
  function handleUserClick(e, user, idx) {
    let nextSelection = { ...selection };
    if (e.type === "dblclick") {
      if (allSelected()) unselectAll();
      else selectAll();
      setLastUserClicked(null);
      return;
    }

    // Range selection with shift
    if (e.shiftKey && lastClickedIndex.current !== null && lastClickedIndex.current !== idx) {
      const [from, to] = [lastClickedIndex.current, idx].sort((a, b) => a - b);
      const dragIds = users.slice(from, to + 1).map(u => u.id);
      dragIds.forEach(id => {
        nextSelection[id] = selectedPlantel || "";
      });
      setSelection(nextSelection);
      setLastUserClicked(user.id);
      return;
    }

    // Ctrl/cmd toggling
    if (e.ctrlKey || e.metaKey) {
      if (selection[user.id]) {
        delete nextSelection[user.id];
      } else {
        nextSelection[user.id] = selectedPlantel || "";
      }
      setSelection(nextSelection);
      setLastUserClicked(user.id);
      lastClickedIndex.current = idx;
      return;
    }

    // Single select or toggle
    if (selection[user.id]) {
      delete nextSelection[user.id];
      setSelection(nextSelection);
    } else {
      nextSelection[user.id] = selectedPlantel || "";
      setSelection(nextSelection);
    }
    setLastUserClicked(user.id);
    lastClickedIndex.current = idx;
  }

  // Bulk set plantel for all selected users
  function handleBulkPlantelChange(e) {
    const val = e.target.value;
    setSelectedPlantel(val);
    const nextSel = { ...selection };
    Object.keys(nextSel).forEach(id => (nextSel[id] = val));
    setSelection(nextSel);
  }

  // Per-row dropdown change (individual plantel choice)
  function setUserPlantel(userId, value) {
    setSelection(sel => ({ ...sel, [userId]: value }));
  }

  // Handle assignment action
  async function handleAssign() {
    setError(""); setSuccess("");

    const assignBatch = users.filter(u => selection[u.id]);
    if (!assignBatch.length) {
      setError("Selecciona al menos un usuario y un plantel.");
      return;
    }

    // Make sure all selected have the same plantel selected for now
    const uniquePlanteles = Array.from(new Set(assignBatch.map(u => selection[u.id]).filter(Boolean)));
    if (uniquePlanteles.length !== 1) {
      setError("Debes seleccionar el mismo plantel para todos los usuarios seleccionados.");
      return;
    }
    const selectedPlantelId = uniquePlanteles[0];

    try {
      await onAssign(assignBatch, selectedPlantelId);
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
      <div className="flex flex-row flex-wrap gap-2 mb-2 items-center">
        <button
          className={"flex flex-row gap-1 items-center px-3 py-1 rounded-full font-bold text-xs border transition " + (allSelected() ? "bg-cyan-800 text-white border-cyan-800" : "bg-white border-cyan-900 text-cyan-900 hover:bg-cyan-50")}
          onClick={allSelected() ? unselectAll : selectAll}
          type="button"
          title={allSelected() ? "Deseleccionar todos" : "Seleccionar todos"}
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
        <table className="min-w-full text-xs xs:text-sm table-auto mb-3">
          <thead>
            <tr className="border-b border-cyan-100 text-cyan-700 font-semibold">
              <th className="px-2 py-1 text-left">#</th>
              <th className="px-2 py-1 text-left">Nombre</th>
              <th className="px-2 py-1 text-left">Correo</th>
              <th className="px-2 py-1 text-left">Plantel</th>
              <th className="px-2 py-1 text-left">Seleccionar</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, idx) => (
              <tr key={u.id} className={`border-b border-cyan-50 hover:bg-cyan-50/30 ${selection[u.id] ? "bg-cyan-50" : ""}`}
                onClick={e => handleUserClick(e, u, idx)}
                onDoubleClick={e => handleUserClick({ ...e, type: 'dblclick' }, u, idx)}
                tabIndex={0}
                style={{ cursor: "pointer" }}
              >
                <td className="px-2 py-1">
                  {selection[u.id] ? <CheckCircleIcon className="inline w-4 h-4 text-emerald-500" /> : idx + 1}
                </td>
                <td className="px-2 py-1 font-semibold">{u.name}</td>
                <td className="px-2 py-1">{u.email}</td>
                <td className="px-2 py-1 whitespace-nowrap">
                  <select
                    className="rounded border-cyan-200 px-3 py-1"
                    value={selection[u.id] || ""}
                    disabled={!selection[u.id]}
                    onChange={e => setUserPlantel(u.id, e.target.value)}
                    onClick={e => e.stopPropagation()}
                  >
                    <option value="">Plantel...</option>
                    {planteles.map(p =>
                      <option value={p.id} key={p.id}>{p.name}</option>
                    )}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <input
                    type="checkbox"
                    checked={!!selection[u.id]}
                    onChange={e => {
                      e.stopPropagation();
                      setSelection(sel => {
                        const next = { ...sel };
                        if (selection[u.id]) {
                          delete next[u.id];
                        } else {
                          next[u.id] = selectedPlantel || "";
                        }
                        return next;
                      });
                      lastClickedIndex.current = idx;
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-row items-center gap-3">
        <button
          className="bg-cyan-700 hover:bg-cyan-900 text-white rounded-full px-6 py-2 font-bold flex flex-row gap-2 items-center transition"
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
      <div className="pt-1 text-xs text-slate-600">
        <span className="font-bold">Tips: </span>
        <span>Ctrl/Cmd para selección múltiple, Shift para rango, Doble clic para seleccionar/deseleccionar todos.</span>
      </div>
    </section>
  );
}
