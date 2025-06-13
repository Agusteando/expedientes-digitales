
"use client";
import { UserGroupIcon } from "@heroicons/react/24/outline";

export default function PlantelStatsCard({ plantel }) {
  const color =
    plantel.progress.percent > 90 ? "bg-emerald-200"
    : plantel.progress.percent > 66 ? "bg-cyan-200"
    : plantel.progress.percent > 33 ? "bg-yellow-100"
    : "bg-red-100";
  return (
    <div className={`rounded-xl shadow border border-cyan-100 p-4 mb-2 bg-white/90`}>
      <div className="flex items-center font-extrabold text-base text-cyan-800 mb-2">
        <UserGroupIcon className="w-6 h-6 mr-2 text-cyan-400" />
        {plantel.name}
      </div>
      <div className="flex flex-row gap-6 items-center mb-2">
        <span className="text-cyan-600 font-bold">Empleados: {plantel.progress.total}</span>
        <span className="text-cyan-900 font-bold">Completos: {plantel.progress.completed}</span>
        <span className="font-bold text-xs text-slate-700">{plantel.progress.percent}%</span>
      </div>
      <div className="w-full h-4 rounded-full overflow-hidden border bg-cyan-50 border-cyan-100 mb-1">
        <div className={color+" h-full rounded"} style={{width: plantel.progress.percent+"%"}} />
      </div>
    </div>
  );
}
