
"use client";
import { useState } from "react";
import { ArrowTrendingUpIcon, CheckCircleIcon, UserPlusIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid";

export default function PlantelEmployeeProgressTable({ employees, adminCanApprove = false }) {
  const [loadingId, setLoadingId] = useState(null);
  const [errorId, setErrorId] = useState(null);
  const [successId, setSuccessId] = useState(null);

  if (employees.length === 0) {
    return <div className="w-full text-sm text-slate-500">No empleados aún asignados.</div>;
  }

  function percentComplete(user) {
    const steps = user.checklistItems?.filter(x => x.required !== false) || [];
    const done = steps.filter(x => x.fulfilled).length;
    let count = done;
    if (user.signatures) {
      if (user.signatures.find(s => s.type === "reglamento" && ["completed", "signed"].includes(s.status))) count++;
      if (user.signatures.find(s => s.type === "contrato" && ["completed", "signed"].includes(s.status))) count++;
    }
    return Math.round((count / 12) * 100);
  }

  async function handleApprove(userId) {
    setLoadingId(userId);
    setErrorId(null);
    setSuccessId(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "No se pudo aprobar.");
      setSuccessId(userId);
      setTimeout(() => setSuccessId(null), 1800);
      // Suggestion: Ideally, after approval, you would use a onUserApproved callback to parent to refresh list.
      // For now: trigger reload
      window.location.reload();
    } catch (e) {
      setErrorId(userId);
    }
    setLoadingId(null);
  }

  function renderStatus(user) {
    if (user.role === "employee" && user.isApproved)
      return (<span className="inline-flex gap-2 items-center text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100"><CheckCircleIcon className="w-5 h-5 text-emerald-500" />Empleado</span>);
    if (user.role === "candidate") {
      const contratoSigned = user.signatures && user.signatures.find(s => s.type === "contrato" && ["completed", "signed"].includes(s.status));
      if (user.isApproved)
        return (<span className="inline-flex gap-2 items-center text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100"><CheckCircleIcon className="w-4 h-4 text-emerald-400" />Aprobado como empleado</span>);
      else if (contratoSigned)
        return adminCanApprove
          ? (
            <button
              onClick={() => handleApprove(user.id)}
              disabled={loadingId && loadingId === user.id}
              className="bg-cyan-700 hover:bg-emerald-700 text-white rounded-full px-4 py-1 font-bold text-xs flex flex-row gap-2 items-center shadow transition"
              aria-label="Aprobar candidato">
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              {loadingId === user.id ? "Aprobando..." : "Aprobar"}
            </button>
          ) : (
            <span className="inline-flex items-center text-xs font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-100"><UserPlusIcon className="w-4 h-4 mr-1" /> Firmó contrato, pendiente aprobación</span>
          );
      else return (<span className="inline-flex items-center text-xs text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-100"><UserPlusIcon className="w-4 h-4" />Candidato</span>);
    }
    return (<span className="inline-block text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">Otro</span>);
  }

  return (
    <div className="overflow-x-auto w-full rounded-xl border border-cyan-100 mt-1">
      <table className="table-auto w-full text-xs xs:text-sm">
        <thead>
          <tr className="bg-cyan-50 border-b border-cyan-100">
            <th className="px-1 py-2 text-left">Nombre</th>
            <th className="px-1 py-2">Correo</th>
            <th className="px-1 py-2">Progreso</th>
            <th className="px-1 py-2">Listo</th>
            <th className="px-1 py-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => {
            const percent = percentComplete(emp);
            return (
              <tr key={emp.id} className="border-b border-cyan-50">
                <td className="font-semibold px-1 py-1">{emp.name}</td>
                <td className="px-1 py-1">{emp.email}</td>
                <td className="px-1 py-1">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-28 xs:w-32 rounded-full bg-cyan-100 overflow-hidden">
                      <div className={`h-full ${percent > 94 ? "bg-emerald-400" : percent > 65 ? "bg-cyan-400" : percent > 33 ? "bg-yellow-400" : "bg-red-300" }`} style={{ width: percent+"%" }} />
                    </div>
                    <span className="text-[11px] xs:text-sm font-bold text-slate-800">{percent}%</span>
                  </div>
                </td>
                <td>
                  {emp.expedienteComplete
                    ? <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                    : <ArrowTrendingUpIcon className="w-5 h-5 text-yellow-500" />}
                </td>
                <td>
                  {renderStatus(emp)}
                  {(errorId === emp.id) && <span className="block text-red-500 text-xs mt-1">Error al aprobar.</span>}
                  {(successId === emp.id) && <span className="block text-emerald-700 text-xs mt-1">¡Aprobado!</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
