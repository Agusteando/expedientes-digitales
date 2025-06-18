
"use client";
import { useState } from "react";
import PlantelUserProgressTable from "./PlantelUserProgressTable";
import { ClipboardDocumentListIcon, BuildingLibraryIcon } from "@heroicons/react/24/outline";

export default function PlantelProgressPanel({ planteles }) {
  const [openPlantelId, setOpenPlantelId] = useState(null);

  return (
    <section className="mb-10">
      <h2 className="text-2xl font-extrabold mb-6 text-cyan-900 flex items-center gap-2">
        <BuildingLibraryIcon className="w-7 h-7 text-cyan-700" />
        Progreso de empleados y candidatos por plantel
      </h2>
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-5 mb-10">
        {planteles.map(p => {
          const percent = Math.round((p.progress.completed / (p.progress.total || 1)) * 100);
          return (
            <div key={p.id}
              className="shadow-xl border border-cyan-200 rounded-3xl overflow-hidden bg-white hover:shadow-2xl transition relative flex flex-col"
            >
              <div className="px-6 py-5 flex flex-row items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-lg text-cyan-700 mb-1">{p.name}</div>
                  <div className="text-xs text-slate-600 font-semibold">Usuarios: <span className="text-cyan-900">{p.progress.total}</span></div>
                </div>
                <button className="px-4 py-2 rounded-full bg-cyan-600 hover:bg-cyan-800 text-white font-bold text-xs shadow flex items-center gap-2"
                  onClick={() => setOpenPlantelId(p.id)}
                >
                  <ClipboardDocumentListIcon className="w-5 h-5" />
                  Ver detalles
                </button>
              </div>
              <div className="px-6 pb-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-cyan-700 font-bold">Completos</span>
                  <span className="text-xs font-mono font-bold text-slate-500">{percent}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-cyan-100 overflow-hidden mb-3">
                  <div
                    className={`${percent > 90
                      ? "bg-emerald-400"
                      : percent > 50
                        ? "bg-cyan-400"
                        : "bg-yellow-400"} h-full rounded-full transition-all`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-2 text-xs font-bold mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Completos: {p.progress.completed}</span>
                  <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">Incompletos: {p.progress.total - p.progress.completed}</span>
                  {p.progress.readyToApprove > 0 &&
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">Listos (aprob.): {p.progress.readyToApprove}</span>}
                </div>
              </div>
              {openPlantelId === p.id &&
                <PlantelUserProgressTable
                  users={p.employees}
                  plantelName={p.name}
                  onClose={() => setOpenPlantelId(null)}
                />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
