
"use client";
import { ArrowTrendingUpIcon, CheckCircleIcon } from "@heroicons/react/24/solid";

export default function PlantelEmployeeProgressTable({ employees }) {
  if (employees.length === 0) {
    return <div className="w-full text-sm text-slate-500">No empleados asignados aún.</div>;
  }

  function percentComplete(user) {
    const steps = user.checklistItems?.filter(x => x.required !== false) || [];
    const done = steps.filter(x => x.fulfilled).length;
    // 10 steps + 2 signatures
    let count = done;
    if (user.signatures) {
      if (user.signatures.find(s => s.type === "reglamento" && ["completed", "signed"].includes(s.status))) count++;
      if (user.signatures.find(s => s.type === "contrato" && ["completed", "signed"].includes(s.status))) count++;
    }
    return Math.round((count / 12) * 100);
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
