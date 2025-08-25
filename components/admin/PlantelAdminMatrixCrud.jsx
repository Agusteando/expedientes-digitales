"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  PlusCircleIcon,
  TrashIcon,
  CheckCircleIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ChevronDoubleRightIcon,
  ChevronDoubleLeftIcon,
  UserPlusIcon,
  SquaresPlusIcon,
} from "@heroicons/react/24/outline";

/**
 * Rethought UX:
 * - Left: searchable admin list with selection for bulk ops.
 * - Right: per-admin "transfer list" (Disponibles ⇄ Asignados) with search, multi-select, and move controls.
 * - Bulk: pick multiple admins, open a plantel picker modal, Assign or Unassign in one shot.
 * - Immediate, optimistic updates with clear feedback. No N×M grid.
 */

function escapeRegex(v) {
  return v.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}

export default function PlantelAdminAssigner() {
  const [matrix, setMatrix] = useState({ admins: [], planteles: [] });
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [msg, setMsg] = useState("");

  // Optimistic assignment overrides keyed by `${adminId}-${plantelId}` => boolean
  const [optimistic, setOptimistic] = useState({});
  const [busyMap, setBusyMap] = useState({}); // same keys => true while saving

  // UI state
  const [adminQuery, setAdminQuery] = useState("");
  const [plantelQuery, setPlantelQuery] = useState("");
  const [activeAdminId, setActiveAdminId] = useState(null);
  const [selectedAdminIds, setSelectedAdminIds] = useState(new Set());
  const [leftSelectedPlanteles, setLeftSelectedPlanteles] = useState(new Set());
  const [rightSelectedPlanteles, setRightSelectedPlanteles] = useState(new Set());

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [removeTarget, setRemoveTarget] = useState(null);

  // Bulk modal
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkPlantelQuery, setBulkPlantelQuery] = useState("");
  const [bulkSelectedPlanteles, setBulkSelectedPlanteles] = useState(new Set());
  const [bulkMode, setBulkMode] = useState("assign"); // 'assign' | 'unassign'

  const rightPaneRef = useRef(null);

  // Fetch everything
  async function fetchMatrix() {
    setLoading(true);
    setFetchError("");
    setMsg("");
    try {
      const res = await fetch("/api/admin/plantel-admin-matrix", {
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error("No se pudo cargar la información.");
      const d = await res.json();
      setMatrix({ admins: d.admins || [], planteles: d.planteles || [] });
      // Initialize active admin if not set
      if (!activeAdminId && (d.admins || []).length) {
        setActiveAdminId(d.admins[0].id);
      }
    } catch (e) {
      setFetchError(e.message || "Error de red");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMatrix();
  }, []);

  // Build server assignment dictionary
  const serverAssignment = useMemo(() => {
    const dict = {};
    for (const a of matrix.admins) {
      for (const p of a.plantelesAdmin || []) {
        dict[`${a.id}-${p.id}`] = true;
      }
    }
    return dict;
  }, [matrix.admins]);

  function isAssigned(adminId, plantelId) {
    const k = `${adminId}-${plantelId}`;
    if (optimistic[k] !== undefined) return optimistic[k];
    return !!serverAssignment[k];
  }

  function adminAssignedCount(a) {
    let n = 0;
    for (const p of matrix.planteles) {
      if (isAssigned(a.id, p.id)) n++;
    }
    return n;
  }

  // Filters
  const adminsFiltered = useMemo(() => {
    if (!adminQuery.trim()) return matrix.admins;
    const q = adminQuery.trim().toLowerCase();
    return matrix.admins.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q)
    );
  }, [matrix.admins, adminQuery]);

  const allPlantelesFiltered = useMemo(() => {
    if (!plantelQuery.trim()) return matrix.planteles;
    const re = new RegExp(escapeRegex(plantelQuery.trim()), "i");
    return matrix.planteles.filter((p) => re.test(p.name));
  }, [matrix.planteles, plantelQuery]);

  // Active admin object
  const activeAdmin = useMemo(
    () => matrix.admins.find((a) => a.id === activeAdminId) || null,
    [matrix.admins, activeAdminId]
  );

  // Split planteles for active admin into left (disponibles) and right (asignados)
  const { leftList, rightList } = useMemo(() => {
    const L = [];
    const R = [];
    if (!activeAdmin) return { leftList: L, rightList: R };
    for (const p of allPlantelesFiltered) {
      (isAssigned(activeAdmin.id, p.id) ? R : L).push(p);
    }
    return { leftList: L, rightList: R };
  }, [allPlantelesFiltered, activeAdmin, optimistic, serverAssignment]);

  // Keyboard helpers
  useEffect(() => {
    // Keep focus in right pane on admin change for faster flow
    if (rightPaneRef.current) {
      rightPaneRef.current.focus();
    }
    // Clear selections when switching admin
    setLeftSelectedPlanteles(new Set());
    setRightSelectedPlanteles(new Set());
  }, [activeAdminId]);

  // Toggle one relation
  async function toggleAssignment(adminId, plantelId, nextState) {
    const key = `${adminId}-${plantelId}`;
    setOptimistic((s) => ({ ...s, [key]: nextState }));
    setBusyMap((s) => ({ ...s, [key]: true }));
    setMsg("");
    setFetchError("");
    try {
      const resp = await fetch("/api/admin/plantel-admin-matrix/toggle", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, plantelId, assigned: nextState }),
      });
      if (!resp.ok) throw new Error((await resp.json()).error || "Error en el servidor.");
      setMsg(nextState ? "Asignado" : "Removido");
    } catch (e) {
      setFetchError(e.message || "Error");
      setOptimistic((s) => ({ ...s, [key]: !nextState })); // revert
    } finally {
      setBusyMap((s) => ({ ...s, [key]: false }));
    }
  }

  // Batch toggle with minimal requests
  async function toggleMany(adminIds, plantelIds, setTo) {
    setMsg("");
    setFetchError("");
    const tasks = [];
    for (const aid of adminIds) {
      for (const pid of plantelIds) {
        const current = isAssigned(aid, pid);
        if (current !== setTo) tasks.push(toggleAssignment(aid, pid, setTo));
      }
    }
    if (tasks.length === 0) {
      setMsg("Sin cambios.");
      return;
    }
    await Promise.all(tasks);
  }

  // Transfer-list actions for active admin
  async function moveSelectedRight() {
    if (!activeAdmin) return;
    const ids = Array.from(leftSelectedPlanteles);
    if (ids.length === 0) return;
    await toggleMany([activeAdmin.id], ids, true);
    setLeftSelectedPlanteles(new Set());
  }
  async function moveSelectedLeft() {
    if (!activeAdmin) return;
    const ids = Array.from(rightSelectedPlanteles);
    if (ids.length === 0) return;
    await toggleMany([activeAdmin.id], ids, false);
    setRightSelectedPlanteles(new Set());
  }
  async function moveAllRight() {
    if (!activeAdmin) return;
    const ids = leftList.map((p) => p.id);
    if (!ids.length) return;
    await toggleMany([activeAdmin.id], ids, true);
    setLeftSelectedPlanteles(new Set());
  }
  async function moveAllLeft() {
    if (!activeAdmin) return;
    const ids = rightList.map((p) => p.id);
    if (!ids.length) return;
    await toggleMany([activeAdmin.id], ids, false);
    setRightSelectedPlanteles(new Set());
  }

  // Add admin
  async function handleAddAdmin(e) {
    e.preventDefault();
    setAddLoading(true);
    setMsg("");
    setFetchError("");
    try {
      const res = await fetch("/api/admin/plantel-admin-matrix/add-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name: addName.trim(), email: addEmail.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "No se pudo crear el administrador.");
      setAddOpen(false);
      setAddName("");
      setAddEmail("");
      setMsg("Administrador creado.");
      await fetchMatrix();
    } catch (e) {
      setFetchError(e.message || "Error de red");
    } finally {
      setAddLoading(false);
    }
  }

  // Remove admin
  async function handleRemoveAdmin(id) {
    setLoading(true);
    setMsg("");
    setFetchError("");
    try {
      const res = await fetch(`/api/admin/plantel-admin-matrix/remove-admin?id=${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error((await res.json()).error || "No se pudo eliminar.");
      setMsg("Eliminado.");
      setRemoveTarget(null);
      await fetchMatrix();
      if (activeAdminId === id) {
        setActiveAdminId(matrix.admins.find((a) => a.id !== id)?.id || null);
      }
    } catch (e) {
      setFetchError(e.message || "Error de red");
    } finally {
      setLoading(false);
    }
  }

  // Bulk modal actions
  function openBulkAssign() {
    if (selectedAdminIds.size === 0) return;
    setBulkMode("assign");
    setBulkPlantelQuery("");
    setBulkSelectedPlanteles(new Set());
    setBulkOpen(true);
  }
  function openBulkUnassign() {
    if (selectedAdminIds.size === 0) return;
    setBulkMode("unassign");
    setBulkPlantelQuery("");
    setBulkSelectedPlanteles(new Set());
    setBulkOpen(true);
  }
  async function handleBulkApply() {
    setBulkLoading(true);
    setMsg("");
    setFetchError("");
    try {
      const adminIds = Array.from(selectedAdminIds);
      const plantelIds = Array.from(bulkSelectedPlanteles);
      await toggleMany(adminIds, plantelIds, bulkMode === "assign");
      setMsg(bulkMode === "assign" ? "Asignaciones aplicadas." : "Remociones aplicadas.");
      setBulkOpen(false);
      setBulkSelectedPlanteles(new Set());
    } catch (e) {
      setFetchError(e.message || "Error");
    } finally {
      setBulkLoading(false);
    }
  }

  // Helpers for selection toggles
  function toggleAdminCheckbox(id) {
    const next = new Set(selectedAdminIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedAdminIds(next);
  }
  function clearBulkSelection() {
    setSelectedAdminIds(new Set());
  }

  const bulkFilteredPlanteles = useMemo(() => {
    if (!bulkPlantelQuery.trim()) return matrix.planteles;
    const re = new RegExp(escapeRegex(bulkPlantelQuery.trim()), "i");
    return matrix.planteles.filter((p) => re.test(p.name));
  }, [matrix.planteles, bulkPlantelQuery]);

  // Item render helpers
  function AdminRow({ a }) {
    const assigned = adminAssignedCount(a);
    const total = matrix.planteles.length;
    const selected = selectedAdminIds.has(a.id);
    const isActive = activeAdminId === a.id;
    return (
      <button
        type="button"
        onClick={() => setActiveAdminId(a.id)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded border ${
          isActive ? "border-cyan-500 bg-cyan-50" : "border-transparent hover:bg-slate-50"
        } text-left`}
      >
        <input
          type="checkbox"
          className="accent-cyan-700 w-4 h-4 mt-0.5"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            toggleAdminCheckbox(a.id);
          }}
          aria-label="Seleccionar para edición masiva"
          onClick={(e) => e.stopPropagation()}
        />
        <Image
          src={a.picture || "/IMAGOTIPO-IECS-IEDIS.png"}
          width={22}
          height={22}
          alt=""
          className="rounded-full"
        />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-cyan-900 truncate">{a.name}</div>
          <div className="text-[11px] text-slate-500 truncate font-mono">{a.email}</div>
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          <span className="font-mono text-cyan-700">{assigned}/{total}</span>
          {a.isActive ? (
            <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
          ) : (
            <XMarkIcon className="w-4 h-4 text-slate-300" />
          )}
        </div>
        <div className="ml-1">
          <button
            className="text-red-700 hover:bg-red-100 rounded-full px-2 py-1"
            title="Eliminar admin"
            onClick={(e) => {
              e.stopPropagation();
              setRemoveTarget(a);
            }}
            disabled={loading}
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </button>
    );
  }

  function PlantelChip({ p, onRemove }) {
    const k = activeAdmin ? `${activeAdmin.id}-${p.id}` : "";
    const busy = busyMap[k];
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-100 text-cyan-800 text-xs">
        <span className="truncate">{p.name}</span>
        <button
          className="rounded-full hover:bg-cyan-200 p-0.5 disabled:opacity-50"
          onClick={() => onRemove(p)}
          disabled={!activeAdmin || busy || loading}
          title="Quitar"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  function ListItem({ p, selected, onToggle, side }) {
    const k = activeAdmin ? `${activeAdmin.id}-${p.id}` : "";
    const busy = busyMap[k];
    const assigned = activeAdmin ? isAssigned(activeAdmin.id, p.id) : false;
    // Side 'left' are disponibles, 'right' are asignados
    return (
      <label className="flex items-center gap-2 px-2 py-2 rounded hover:bg-slate-50 cursor-pointer">
        <input
          type="checkbox"
          className="accent-cyan-700 w-4 h-4"
          checked={selected}
          onChange={onToggle}
          disabled={busy || loading}
          aria-label={p.name}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate">{p.name}</div>
        </div>
        {activeAdmin && (
          <div className="flex items-center gap-1">
            {assigned ? (
              <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            ) : null}
            {busy ? <ArrowPathIcon className="w-4 h-4 animate-spin text-cyan-700" /> : null}
          </div>
        )}
      </label>
    );
  }

  return (
    <section className="w-full bg-white border border-cyan-200 shadow-xl rounded-2xl p-4">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 font-bold text-cyan-800 text-lg">
          Administradores ↔ Planteles
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-cyan-400 absolute top-2 left-2" />
            <input
              className="pl-8 pr-3 py-2 rounded border border-cyan-200 text-sm w-[220px] bg-white font-mono"
              placeholder="Filtrar admin/correo"
              value={adminQuery}
              onChange={(e) => setAdminQuery(e.target.value)}
              aria-label="Buscar administrador"
            />
          </div>
          <button
            className="flex items-center gap-1 px-3 py-1.5 bg-cyan-700 hover:bg-cyan-900 text-white text-xs rounded-full shadow font-bold"
            onClick={() => setAddOpen(true)}
            type="button"
            aria-label="Agregar nuevo admin"
          >
            <PlusCircleIcon className="w-5 h-5 text-white" />
            Nuevo
          </button>
          <button
            className="flex items-center px-2 py-1.5 border border-cyan-300 rounded text-xs hover:bg-cyan-50"
            onClick={() => fetchMatrix()}
            type="button"
            title="Recargar datos"
          >
            <ArrowPathIcon className="w-4 h-4 text-cyan-600" />
          </button>
        </div>
      </header>

      {(msg || fetchError) ? (
        <div className={`mb-3 text-center text-xs font-semibold ${msg ? "text-emerald-800" : "text-red-700"}`}>
          {msg || fetchError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left column: Admin list + bulk bar */}
        <aside className="lg:col-span-4 xl:col-span-3 border rounded-xl">
          <div className="px-3 py-2 border-b bg-slate-50 flex items-center justify-between">
            <div className="text-xs font-semibold text-cyan-700">
              Admins ({adminsFiltered.length})
            </div>
            {selectedAdminIds.size > 0 ? (
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-cyan-800">
                  {selectedAdminIds.size} seleccionados
                </span>
                <button
                  className="text-xs rounded-full px-2 py-1 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={openBulkAssign}
                  title="Asignar planteles a los admins seleccionados"
                >
                  Asignar
                </button>
                <button
                  className="text-xs rounded-full px-2 py-1 bg-red-700 text-white hover:bg-red-800"
                  onClick={openBulkUnassign}
                  title="Quitar planteles de los admins seleccionados"
                >
                  Quitar
                </button>
                <button
                  className="text-xs rounded-full px-2 py-1 border border-slate-300 hover:bg-slate-50"
                  onClick={clearBulkSelection}
                  title="Limpiar selección"
                >
                  Limpiar
                </button>
              </div>
            ) : (
              <div className="text-[11px] text-slate-500">Selecciona para editar en lote</div>
            )}
          </div>
          <div className="max-h-[60vh] overflow-auto p-2 space-y-1">
            {adminsFiltered.map((a) => (
              <AdminRow key={a.id} a={a} />
            ))}
            {adminsFiltered.length === 0 ? (
              <div className="text-xs text-center text-slate-500 py-8">Sin resultados</div>
            ) : null}
          </div>
        </aside>

        {/* Right column: Transfer list for the active admin */}
        <main className="lg:col-span-8 xl:col-span-9 border rounded-xl focus:outline-none" tabIndex={-1} ref={rightPaneRef}>
          <div className="px-3 py-2 border-b bg-slate-50 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="font-semibold text-cyan-800">
                {activeAdmin ? activeAdmin.name : "Selecciona un admin"}
              </div>
              {activeAdmin ? (
                <div className="text-xs text-slate-600 font-mono">
                  {adminAssignedCount(activeAdmin)}/{matrix.planteles.length}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 text-cyan-300 absolute top-2 left-2" />
                <input
                  className="pl-7 pr-2 py-1.5 rounded border border-cyan-200 text-xs sm:text-sm w-[220px] bg-white font-mono"
                  placeholder="Filtrar plantel"
                  value={plantelQuery}
                  onChange={(e) => setPlantelQuery(e.target.value)}
                  aria-label="Buscar plantel"
                />
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="text-xs rounded-full px-2 py-1 bg-cyan-100 hover:bg-cyan-200"
                  title="Asignar todos los visibles"
                  onClick={moveAllRight}
                  disabled={!activeAdmin || leftList.length === 0 || loading}
                >
                  <SquaresPlusIcon className="w-4 h-4 inline mr-1" />
                  Asignar visibles
                </button>
                <button
                  className="text-xs rounded-full px-2 py-1 bg-slate-100 hover:bg-slate-200"
                  title="Quitar todos los visibles"
                  onClick={moveAllLeft}
                  disabled={!activeAdmin || rightList.length === 0 || loading}
                >
                  Quitar visibles
                </button>
              </div>
            </div>
          </div>

          {activeAdmin ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3">
              {/* Left list (disponibles) */}
              <div className="md:col-span-5 border rounded-lg">
                <div className="px-3 py-2 border-b bg-white text-xs font-semibold text-slate-600">
                  Disponibles ({leftList.length})
                </div>
                <div className="max-h-[52vh] overflow-auto">
                  {leftList.map((p) => {
                    const selected = leftSelectedPlanteles.has(p.id);
                    return (
                      <ListItem
                        key={p.id}
                        p={p}
                        selected={selected}
                        onToggle={() => {
                          const next = new Set(leftSelectedPlanteles);
                          if (selected) next.delete(p.id);
                          else next.add(p.id);
                          setLeftSelectedPlanteles(next);
                        }}
                        side="left"
                      />
                    );
                  })}
                  {leftList.length === 0 ? (
                    <div className="text-xs text-center text-slate-500 py-8">
                      No hay elementos
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Middle controls */}
              <div className="md:col-span-2 flex flex-col items-center justify-center gap-2">
                <button
                  className="rounded-full border px-3 py-2 hover:bg-slate-50 disabled:opacity-50"
                  onClick={moveSelectedRight}
                  disabled={leftSelectedPlanteles.size === 0 || !activeAdmin}
                  title="Asignar seleccionados"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
                <button
                  className="rounded-full border px-3 py-2 hover:bg-slate-50 disabled:opacity-50"
                  onClick={moveSelectedLeft}
                  disabled={rightSelectedPlanteles.size === 0 || !activeAdmin}
                  title="Quitar seleccionados"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <button
                  className="rounded-full border px-3 py-2 hover:bg-slate-50 disabled:opacity-50"
                  onClick={moveAllRight}
                  disabled={leftList.length === 0 || !activeAdmin}
                  title="Asignar todos los visibles"
                >
                  <ChevronDoubleRightIcon className="w-5 h-5" />
                </button>
                <button
                  className="rounded-full border px-3 py-2 hover:bg-slate-50 disabled:opacity-50"
                  onClick={moveAllLeft}
                  disabled={rightList.length === 0 || !activeAdmin}
                  title="Quitar todos los visibles"
                >
                  <ChevronDoubleLeftIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Right list (asignados) */}
              <div className="md:col-span-5 border rounded-lg">
                <div className="px-3 py-2 border-b bg-white text-xs font-semibold text-slate-600">
                  Asignados ({rightList.length})
                </div>
                <div className="max-h-[52vh] overflow-auto">
                  {rightList.map((p) => {
                    const selected = rightSelectedPlanteles.has(p.id);
                    return (
                      <ListItem
                        key={p.id}
                        p={p}
                        selected={selected}
                        onToggle={() => {
                          const next = new Set(rightSelectedPlanteles);
                          if (selected) next.delete(p.id);
                          else next.add(p.id);
                          setRightSelectedPlanteles(next);
                        }}
                        side="right"
                      />
                    );
                  })}
                  {rightList.length === 0 ? (
                    <div className="text-xs text-center text-slate-500 py-8">
                      No hay elementos
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Chips of assigned for quick removal */}
              <div className="md:col-span-12">
                <div className="flex flex-wrap gap-2 mt-1">
                  {rightList.slice(0, 40).map((p) => (
                    <PlantelChip
                      key={`chip-${p.id}`}
                      p={p}
                      onRemove={async (pp) => {
                        await toggleMany([activeAdmin.id], [pp.id], false);
                      }}
                    />
                  ))}
                  {rightList.length > 40 ? (
                    <div className="text-[11px] text-slate-500">+{rightList.length - 40} más</div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-sm text-slate-500">Selecciona un administrador.</div>
          )}
        </main>
      </div>

      {/* Add admin modal */}
      {addOpen ? (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-xl p-7 w-full max-w-sm shadow-xl border border-cyan-100">
            <h3 className="font-bold text-lg text-cyan-800 mb-3">Nuevo administrador</h3>
            <form className="w-full flex flex-col gap-3" onSubmit={handleAddAdmin}>
              <input
                type="text"
                required
                maxLength={64}
                className="rounded border border-cyan-200 px-3 py-2 text-base"
                placeholder="Nombre completo"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
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
                onChange={(e) => setAddEmail(e.target.value)}
                disabled={addLoading}
              />
              <div className="flex gap-2 mt-2 justify-end">
                <button
                  type="button"
                  className="text-xs font-bold px-3 py-1 rounded hover:text-cyan-700"
                  disabled={addLoading}
                  onClick={() => setAddOpen(false)}
                >
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
      ) : null}

      {/* Remove admin modal */}
      {removeTarget ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 w-full max-w-sm border border-red-100 shadow-lg text-center">
            <h3 className="font-bold text-lg text-red-800 mb-4">¿Eliminar a {removeTarget.name}?</h3>
            <div className="text-xs text-slate-800 mb-5">
              Esta acción es irreversible y elimina la cuenta de administrador.
            </div>
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
      ) : null}

      {/* Bulk assign/unassign modal */}
      {bulkOpen ? (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl border border-cyan-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg text-cyan-800">
                {bulkMode === "assign" ? "Asignar planteles" : "Quitar planteles"}
              </h3>
              <div className="text-xs text-slate-600">
                {selectedAdminIds.size} admins
              </div>
            </div>
            <div className="mb-3">
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 text-cyan-300 absolute top-2.5 left-2" />
                <input
                  className="pl-7 pr-2 py-1.5 rounded border border-cyan-200 text-sm w-full bg-white font-mono"
                  placeholder="Filtrar plantel"
                  value={bulkPlantelQuery}
                  onChange={(e) => setBulkPlantelQuery(e.target.value)}
                  aria-label="Buscar plantel para edición masiva"
                />
              </div>
            </div>
            <div className="max-h-[45vh] overflow-auto border rounded">
              {bulkFilteredPlanteles.map((p) => {
                const sel = bulkSelectedPlanteles.has(p.id);
                return (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 px-3 py-2 border-b last:border-b-0 hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="accent-cyan-700 w-4 h-4"
                      checked={sel}
                      onChange={() => {
                        const next = new Set(bulkSelectedPlanteles);
                        if (sel) next.delete(p.id);
                        else next.add(p.id);
                        setBulkSelectedPlanteles(next);
                      }}
                    />
                    <span className="text-sm">{p.name}</span>
                  </label>
                );
              })}
              {bulkFilteredPlanteles.length === 0 ? (
                <div className="text-xs text-center text-slate-500 py-8">Sin resultados</div>
              ) : null}
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="text-xs text-slate-600">
                {bulkSelectedPlanteles.size} seleccionados
              </div>
              <div className="flex gap-2">
                <button
                  className="text-xs font-bold px-3 py-1 rounded hover:text-cyan-700"
                  disabled={bulkLoading}
                  onClick={() => setBulkOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  className={`text-xs font-bold rounded-full px-5 py-2 text-white ${
                    bulkMode === "assign" ? "bg-cyan-700 hover:bg-cyan-900" : "bg-red-700 hover:bg-red-900"
                  }`}
                  disabled={bulkLoading || bulkSelectedPlanteles.size === 0}
                  onClick={handleBulkApply}
                >
                  {bulkLoading ? "Aplicando..." : bulkMode === "assign" ? "Asignar" : "Quitar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
