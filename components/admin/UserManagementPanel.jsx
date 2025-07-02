
"use client";
import { useState, useEffect, useMemo } from "react";
import UserManagementTable from "./UserManagementTable";
import BulkActionBar from "./BulkActionBar";
import UserDocsDrawer from "./UserDocsDrawer";
import UserFichaTecnicaDrawer from "./UserFichaTecnicaDrawer";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

export default function UserManagementPanel({
  users,
  planteles,
  adminRole,
  plantelesPermittedIds,
  canAssignPlantel
}) {
  const [filter, setFilter] = useState("");
  const [plantelFilter, setPlantelFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("todos");
  const [selection, setSelection] = useState({});
  const [docsDrawer, setDocsDrawer] = useState({ open: false, user: null });
  const [fichaDrawer, setFichaDrawer] = useState({ open: false, user: null });
  const [feedback, setFeedback] = useState({ type: null, message: "" });

  const adminsPlanteles = adminRole === "superadmin"
    ? planteles.map(p => p.id)
    : plantelesPermittedIds || [];

  const editablePlanteles = planteles.filter(p => adminsPlanteles.includes(p.id));

  const usersFiltered = useMemo(() => {
    return (users || [])
      .filter(u =>
        (!filter || (
          String(u.name || "").toLowerCase().includes(filter.toLowerCase()) ||
          String(u.email || "").toLowerCase().includes(filter.toLowerCase())
        )) &&
        (!plantelFilter || String(u.plantelId || "") === String(plantelFilter)) &&
        (roleFilter === "all" || u.role === roleFilter) &&
        (statusFilter === "all" ||
         (statusFilter === "ready" && u.readyForApproval) ||
         (statusFilter === "employee" && u.role === "employee") ||
         (statusFilter === "incomplete" && !u.readyForApproval && u.role === "candidate")) &&
        (activeFilter === "todos" || (activeFilter === "activos" ? u.isActive : !u.isActive))
      );
  }, [users, filter, plantelFilter, roleFilter, statusFilter, activeFilter]);

  const selectedUserIds = useMemo(
    () => Object.entries(selection).filter(([k,v]) => v).map(([k]) => Number(k)),
    [selection]
  );
  const allSelected = usersFiltered.length > 0 && selectedUserIds.length === usersFiltered.length;

  function handleSelectUser(userId, on) {
    setSelection(sel => ({ ...sel, [userId]: on }));
  }
  function handleSelectAll(on) {
    if (on)
      setSelection(Object.fromEntries(usersFiltered.map(u => [u.id, true])));
    else
      setSelection({});
  }
  async function handleAssignPlantel(userId, plantelId) {
    setFeedback({ type: "info", message: "Asignando..." });
    try {
      const res = await fetch(`/api/admin/user/${userId}/plantel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plantelId })
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error de servidor");
      setFeedback({ type: "success", message: "Plantel actualizado" });
      setTimeout(() => setFeedback({ type: null, message: "" }), 1100);
      window.location.reload();
    } catch (e) {
      setFeedback({ type: "error", message: String(e.message || e) });
    }
  }
  async function handleApproveCandidate(userId) {
    setFeedback({ type: "info", message: "Aprobando..." });
    try {
      const res = await fetch(`/api/admin/user/${userId}/approve`, {
        method: "POST"
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error de servidor");
      setFeedback({ type: "success", message: "Aprobado correctamente" });
      setTimeout(() => setFeedback({ type: null, message: "" }), 1100);
      window.location.reload();
    } catch (e) {
      setFeedback({ type: "error", message: String(e.message || e) });
    }
  }
  async function handleBulkAssign(plantelId) {
    setFeedback({ type: "info", message: "Asignando en lote..." });
    try {
      const res = await fetch(`/api/admin/users/assign-plantel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedUserIds, plantelId })
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error de servidor");
      setFeedback({ type: "success", message: "Usuarios asignados" });
      setTimeout(() => setFeedback({ type: null, message: "" }), 1100);
      window.location.reload();
    } catch (e) {
      setFeedback({ type: "error", message: String(e.message || e) });
    }
  }
  // Receive eligible IDs (from BulkActionBar)
  async function handleBulkApprove(eligibleUserIds) {
    if (!eligibleUserIds || !eligibleUserIds.length) {
      setFeedback({ type: "error", message: "Ningún usuario seleccionado cumple requisitos." });
      return;
    }
    setFeedback({ type: "info", message: "Aprobando..." });
    try {
      const res = await fetch(`/api/admin/users/bulk-approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: eligibleUserIds })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error de servidor");
      setFeedback({ type: "success", message: (data.approved?.length || 0) + " usuarios aprobados" });
      setTimeout(() => setFeedback({ type: null, message: "" }), 1100);
      window.location.reload();
    } catch (e) {
      setFeedback({ type: "error", message: String(e.message || e) });
    }
  }
  // Activate/deactivate single
  async function handleSetActive(userId, isActive) {
    setFeedback({ type: "info", message: isActive ? "Activando..." : "Dando de baja..." });
    try {
      const res = await fetch(`/api/admin/user/${userId}/active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error en el estatus");
      setFeedback({ type: "success", message: isActive ? "Usuario activado" : "Usuario dado de baja" });
      setTimeout(() => setFeedback({ type: null, message: "" }), 1100);
      window.location.reload();
    } catch (e) {
      setFeedback({ type: "error", message: String(e.message || e) });
    }
  }
  // Bulk activate/deactivate
  async function handleBulkSetActive(isActive) {
    setFeedback({ type: "info", message: isActive ? "Activando..." : "Dando de baja..." });
    for (let userId of selectedUserIds) {
      await handleSetActive(userId, isActive);
    }
    setFeedback({ type: "success", message: isActive ? "Usuarios activados" : "Usuarios dados de baja" });
    setTimeout(() => setFeedback({ type: null, message: "" }), 1100);
    window.location.reload();
  }

  // User delete
  async function handleDelete(userId) {
    setFeedback({ type: "info", message: "Eliminando usuario..." });
    try {
      const res = await fetch(`/api/admin/user/${userId}/delete`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar");
      setFeedback({ type: "success", message: "Usuario eliminado" });
      setTimeout(() => setFeedback({ type: null, message: "" }), 1200);
      window.location.reload();
    } catch (e) {
      setFeedback({ type: "error", message: String(e.message || e) });
    }
  }

  function handleOpenDocs(user) { setDocsDrawer({ open: true, user }); }
  function closeDocsDrawer() { setDocsDrawer({ open: false, user: null }); }
  function handleOpenFichaTecnica(user) { setFichaDrawer({ open: true, user }); }
  function closeFichaDrawer() { setFichaDrawer({ open: false, user: null }); }

  return (
    <section className="w-full bg-white border border-cyan-200 shadow-xl rounded-2xl p-4 mb-8">
      <header className="mb-4">
        <h2 className="text-xl font-bold text-cyan-900 mb-1">Asignar empleados y candidatos a plantel</h2>
        <div className="flex flex-wrap items-center gap-3 mt-2 mb-1 text-sm">
          <input
            className="border border-cyan-200 rounded px-2 py-1 text-sm"
            placeholder="Buscar nombre o correo"
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          <select
            className="border border-cyan-200 rounded px-2 py-1 text-sm"
            value={plantelFilter}
            onChange={e => setPlantelFilter(e.target.value)}
          >
            <option value="">Plantel (todos)</option>
            {planteles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select
            className="border border-cyan-200 rounded px-2 py-1 text-sm"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="candidate">Candidatos</option>
            <option value="employee">Empleados</option>
          </select>
          <select
            className="border border-cyan-200 rounded px-2 py-1 text-sm"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="ready">Listos para aprobar</option>
            <option value="employee">Aprobados</option>
            <option value="incomplete">Incompletos</option>
          </select>
          <select
            className="border border-cyan-200 rounded px-2 py-1 text-sm"
            value={activeFilter}
            onChange={e => setActiveFilter(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="activos">Sólo activos</option>
            <option value="bajas">Sólo bajas</option>
          </select>
        </div>
        {feedback.message && (
          <div className={`mt-2 px-3 py-1 rounded font-bold text-xs ${feedback.type === "success" ? "bg-emerald-50 text-emerald-700" : feedback.type === "error" ? "bg-red-50 text-red-700" : "bg-cyan-50 text-cyan-700"}`}>
            {feedback.type === "success" && <CheckCircleIcon className="w-5 h-5 mr-1 inline" />}
            {feedback.type === "error" && <XCircleIcon className="w-5 h-5 mr-1 inline" />}
            {feedback.message}
          </div>
        )}
      </header>
      <UserManagementTable
        users={usersFiltered}
        planteles={planteles}
        adminsPlanteles={adminsPlanteles}
        role={adminRole}
        selection={selection}
        selectedUserIds={selectedUserIds}
        allSelected={allSelected}
        canAssignPlantel={canAssignPlantel}
        onSelectUser={handleSelectUser}
        onSelectAll={handleSelectAll}
        onAssignPlantel={handleAssignPlantel}
        onApproveCandidate={handleApproveCandidate}
        onDocs={handleOpenDocs}
        onFichaTecnica={handleOpenFichaTecnica}
        onSetActive={handleSetActive}
        onDelete={handleDelete}
      />
      <BulkActionBar
        users={usersFiltered}
        planteles={planteles}
        adminRole={adminRole}
        selectedUserIds={selectedUserIds}
        allSelected={allSelected}
        canAssignPlantel={canAssignPlantel}
        onBulkAssign={handleBulkAssign}
        onBulkApprove={handleBulkApprove}
        onBulkSetActive={handleBulkSetActive}
      />
      <UserDocsDrawer
        open={docsDrawer.open}
        user={docsDrawer.user}
        onClose={closeDocsDrawer}
      />
      <UserFichaTecnicaDrawer
        open={fichaDrawer.open}
        user={fichaDrawer.user}
        planteles={planteles}
        canEdit={fichaDrawer.open && fichaDrawer.user && (adminRole === "superadmin" || adminsPlanteles.includes(fichaDrawer.user.plantelId))}
        editablePlanteles={editablePlanteles}
        onClose={closeFichaDrawer}
      />
    </section>
  );
}
