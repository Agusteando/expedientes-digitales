
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
          // Defensive: always use 0 for undefined
          const progress = p.progress || {};
          const total = Number(progress.total) || 0;
          const userCompleted = Number(progress.userDocsCompleted) || 0;
          const adminCompleted = Number(progress.expedientesValidados) || 0;
          const percentDigital = total > 0 ? Math.round((userCompleted / total) * 100) : 0;
          const percentFinal = total > 0 ? Math.round((adminCompleted / total) * 100) : 0;

          return (
            <div key={p.id}
              className="shadow-xl border border-cyan-200 rounded-3xl overflow-hidden bg-white hover:shadow-2xl transition relative flex flex-col"
            >
              <div className="px-6 py-5 flex flex-row items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-lg text-cyan-700 mb-1">{p.name}</div>
                  <div className="text-xs text-slate-600 font-semibold">
                    Usuarios: <span className="text-cyan-900">{total}</span>
                  </div>
                </div>
                <button className="px-4 py-2 rounded-full bg-cyan-600 hover:bg-cyan-800 text-white font-bold text-xs shadow flex items-center gap-2"
                  onClick={() => setOpenPlantelId(p.id)}
                >
                  <ClipboardDocumentListIcon className="w-5 h-5" />
                  Ver detalles
                </button>
              </div>
              <div className="px-6 pb-5">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs text-cyan-700 font-bold">Expedientes digitales</span>
                  <span className="text-xs font-mono font-bold text-slate-500">{percentDigital}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-cyan-100 overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${
                      percentDigital > 90
                        ? "bg-emerald-400"
                        : percentDigital > 50
                        ? "bg-cyan-400"
                        : "bg-yellow-400"
                    }`}
                    style={{ width: `${percentDigital}%` }}
                  />
                </div>
                <div className="flex items-center gap-3 mt-2 mb-1">
                  <span className="text-xs text-emerald-800 font-bold">Expedientes finales</span>
                  <span className="text-xs font-mono font-bold text-slate-500">{percentFinal}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-emerald-100 overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${
                      percentFinal > 90
                        ? "bg-emerald-500"
                        : percentFinal > 50
                        ? "bg-emerald-400"
                        : "bg-yellow-400"
                    }`}
                    style={{ width: `${percentFinal}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-2 text-xs font-bold mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Digitales: {userCompleted}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                    Finales: {adminCompleted}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Faltantes: {total - adminCompleted}
                  </span>
                </div>
              </div>
              {openPlantelId === p.id &&
                <PlantelUserProgressTable
                  users={p.employees}
                  stepMeta={p.stepMeta || []}
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
