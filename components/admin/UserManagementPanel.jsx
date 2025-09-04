
"use client";
import { useState, useEffect, useMemo } from "react";
import UserManagementTable from "./UserManagementTable";
import BulkActionBar from "./BulkActionBar";
import UserDocsDrawer from "./UserDocsDrawer";
import UserFichaTecnicaDrawer from "./UserFichaTecnicaDrawer";
import { CheckCircleIcon, XCircleIcon, ChevronLeftIcon, ChevronRightIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

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

  // Export loading state
  const [exporting, setExporting] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const adminsPlanteles = adminRole === "superadmin"
    ? planteles.map(p => p.id)
    : plantelesPermittedIds || [];

  const editablePlanteles = planteles.filter(p => adminsPlanteles.includes(p.id));

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [filter, plantelFilter, roleFilter, statusFilter, activeFilter, users.length]);

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
  const totalPages = Math.max(1, Math.ceil(usersFiltered.length / pageSize));
  const paginatedUsers = useMemo(
    () => usersFiltered.slice((page - 1) * pageSize, page * pageSize),
    [usersFiltered, page, pageSize]
  );

  const selectedUserIds = useMemo(
    () => Object.entries(selection).filter(([k,v]) => v).map(([k]) => Number(k)),
    [selection]
  );
  const allSelected = paginatedUsers.length > 0 && selectedUserIds.length >= paginatedUsers.length;

  function handleSelectUser(userId, on) {
    setSelection(sel => ({ ...sel, [userId]: on }));
  }
  function handleSelectAll(on) {
    if (on)
      setSelection(sel => ({
        ...sel,
        ...Object.fromEntries(paginatedUsers.map(u => [u.id, true]))
      }));
    else
      setSelection(sel => {
        const ns = { ...sel };
        paginatedUsers.forEach(u => { delete ns[u.id]; });
        return ns;
      });
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
  // Remove approve
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
  // Removed handleBulkApprove and handleApproveCandidate

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

  async function handleExcelExport() {
    setExporting(true);
    setFeedback({ type: "info", message: "Generando reporte..." });
    try {
      const res = await fetch(`/api/admin/users/export-excel`, {
        method: "GET",
        headers: { "Accept": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error("No se pudo generar el Excel: " + txt.slice(0, 200));
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const el = document.createElement("a");
      el.href = url;
      const today = new Date();
      el.download = `ExpedientePorPlantel_${today.toISOString().slice(0,10)}.xlsx`;
      el.style.display = "none";
      document.body.appendChild(el);
      el.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        el.remove();
      }, 750);
      setFeedback({ type: "success", message: "Descarga iniciada" });
      setExporting(false);
      setTimeout(() => setFeedback({ type: null, message: "" }), 1300);
    } catch (e) {
      setFeedback({ type: "error", message: `${e.message || e}` });
      setExporting(false);
    }
  }

  // Pagination controls (mobile-first, sticky)
  function PaginationBar() {
    return (
      <div className="w-full flex flex-wrap flex-row gap-2 justify-between items-center mt-1 mb-4 px-1 text-xs">
        <div>
          <span className="font-semibold mr-3">
            Página {page} / {totalPages} ({usersFiltered.length} usuario{usersFiltered.length === 1 ? "" : "s"})
          </span>
          <span>
            Filas por página:&nbsp;
            <select
              className="border border-cyan-200 rounded px-1 py-0.5"
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            >
              {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </span>
        </div>
        <div className="flex gap-1">
          <button
            className="px-3 py-1 rounded font-bold bg-cyan-50 border border-cyan-200 hover:bg-cyan-200 text-cyan-900 cursor-pointer disabled:opacity-60"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            tabIndex={0}
            aria-label="Página anterior"
          >
            <ChevronLeftIcon className="w-5 h-5 inline mb-0.5" />
          </button>
          <button
            className="px-3 py-1 rounded font-bold bg-cyan-50 border border-cyan-200 hover:bg-cyan-200 text-cyan-900 cursor-pointer disabled:opacity-60"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            tabIndex={0}
            aria-label="Página siguiente"
          >
            <ChevronRightIcon className="w-5 h-5 inline mb-0.5" />
          </button>
        </div>
      </div>
    );
  }

  // -- Export Button: shown to admin/superadmin only, sticky right above the table
  function ExportBar() {
    if (!["superadmin", "admin"].includes(adminRole)) return null;
    return (
      <div className="flex w-full items-center justify-end mb-2">
        <button
          type="button"
          onClick={handleExcelExport}
          disabled={exporting}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-700 to-cyan-700 hover:from-cyan-700 hover:to-fuchsia-700 text-white font-bold px-4 py-2 rounded-full shadow transition text-xs sm:text-base disabled:opacity-70"
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          {exporting ? "Generando Excel…" : "Exportar Excel por plantel"}
        </button>
      </div>
    );
  }

  return (
    <section id="user-management" className="w-full bg-white border border-cyan-200 shadow-xl rounded-2xl p-4 mb-8">
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
      <ExportBar />
      <PaginationBar />
      <UserManagementTable
        users={paginatedUsers}
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
        onDocs={handleOpenDocs}
        onFichaTecnica={handleOpenFichaTecnica}
        onSetActive={handleSetActive}
        onDelete={handleDelete}
      />
      <PaginationBar />
      <BulkActionBar
        users={paginatedUsers}
        planteles={planteles}
        adminRole={adminRole}
        selectedUserIds={selectedUserIds}
        allSelected={allSelected}
        canAssignPlantel={canAssignPlantel}
        onBulkAssign={handleBulkAssign}
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
        isSuperadmin={adminRole === "superadmin"}
      />
    </section>
  );
}
