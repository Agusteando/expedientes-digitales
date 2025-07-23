
"use client";
import Image from "next/image";
import { CheckCircleIcon, XCircleIcon, ClockIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";

function getUserProgress(u, stepMeta) {
  const userKeys = stepMeta.filter(s => !s.adminUploadOnly && !s.isPlantelSelection).map(s => s.key);
  const checklist = (u.checklistItems || []).filter(i => userKeys.includes(i.type));
  const done = checklist.filter(i => i.fulfilled).length;
  return { done, total: userKeys.length, pct: userKeys.length ? done / userKeys.length : 0, complete: done === userKeys.length };
}

function getAdminProgress(u) {
  return !!((u.documents || []).find(d => d.type === "proyectivos" && d.status === "ACCEPTED"));
}

export default function PlantelUserProgressTable({ users, stepMeta }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[650px] w-full table-auto text-xs md:text-sm">
        <thead>
          <tr className="bg-cyan-100">
            <th className="px-2 py-2">Foto</th>
            <th className="px-2 py-2">Nombre</th>
            <th className="px-2 py-2">Rol</th>
            <th className="px-2 py-2">Docs usuario</th>
            <th className="px-2 py-2">Proyectivos (admin)</th>
            <th className="px-2 py-2">Expediente digital</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => {
            const up = getUserProgress(u, stepMeta);
            const adminDone = getAdminProgress(u);
            const fully = up.complete && adminDone;
            return (
              <tr key={u.id} className="bg-white border-b border-cyan-50">
                <td className="px-2 py-2">
                  <Image src={u.picture || "/IMAGOTIPO-IECS-IEDIS.png"} width={34} height={34} alt="" className="rounded-full border bg-slate-100" />
                </td>
                <td className="px-2 py-2 font-bold text-cyan-900">{u.name}<div className="text-xs text-slate-400">{u.email}</div></td>
                <td className="px-2 py-2">
                  <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${u.role === "employee" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-cyan-100 text-cyan-800 border border-cyan-200"}`}>
                    {u.role === "employee" ? "Empleado" : "Candidato"}
                  </span>
                </td>
                <td className="px-2 py-2">
                  <span className="font-mono text-xs">{up.done}/{up.total}</span>
                  <div className="flex w-20 h-2 rounded-full bg-cyan-100 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${up.complete ? "bg-emerald-400" : "bg-cyan-400"}`} style={{width: `${Math.round(up.pct*100)}%`}} />
                  </div>
                </td>
                <td className="px-2 py-2 text-center">
                  {adminDone
                    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs"><CheckCircleIcon className="w-4 h-4" />Proyectivos</span>
                    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs"><ClockIcon className="w-4 h-4" />Falta</span>
                  }
                </td>
                <td className="px-2 py-2 text-center">
                  {fully
                    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs"><CheckCircleIcon className="w-4 h-4" />Completo</span>
                    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs"><XCircleIcon className="w-4 h-4" />En proceso</span>
                  }
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
