
"use client";
import { useState } from "react";
import { CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { stepsExpediente } from "../stepMetaExpediente";

// Return label for a checklist key from stepsExpediente
function getStepLabel(key) {
  const step = stepsExpediente.find(s => s.key === key);
  return step?.label || key.replace(/_/g, " ");
}

// Utility—returns list of missing keys given userChecklist and user role
export function getMissingChecklistKeys(role, checklist = [], isActive = true) {
  // Only for candidate
  if (!isActive || role !== "candidate") return [];
  // Required user doc steps (you can adjust logic for admin-only etc if you want)
  const requiredKeys = stepsExpediente
    .filter(s => !s.adminUploadOnly && !s.isPlantelSelection)
    .map(s => s.key);
  const fulfilledTypes = checklist.filter(i => i.fulfilled).map(i => i.type);
  return requiredKeys.filter(key => !fulfilledTypes.includes(key));
}

/**
 * StatusBadgeWithTooltip
 * Renders the colored status badge ("Empleado", "Listo para aprobar", "Incompleto").
 * If "Incompleto", hovering (or tapping on mobile) shows a tooltip listing missing docs.
 *
 * Props:
 * - role: "employee" or "candidate"
 * - readyForApproval: boolean
 * - checklist: array (each: {type, fulfilled:boolean})
 * - isActive: boolean
 */
export default function StatusBadgeWithTooltip({ role, readyForApproval, checklist = [], isActive = true }) {
  const [show, setShow] = useState(false);

  if (role === "employee") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-200 font-bold text-emerald-800 rounded-full text-xs">
        <CheckCircleIcon className="w-4 h-4" />Empleado
      </span>
    );
  }
  if (readyForApproval) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-50 border border-cyan-200 font-bold text-cyan-800 rounded-full text-xs">
        <CheckCircleIcon className="w-4 h-4" />Listo para aprobar
      </span>
    );
  }
  // Else, "Incompleto" with tooltip
  const missingKeys = getMissingChecklistKeys(role, checklist, isActive);
  return (
    <span
      className="relative inline-block"
      tabIndex={0}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      onTouchStart={e => { e.stopPropagation(); setShow(s => !s); }}
    >
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 border border-yellow-100 text-yellow-700 text-xs rounded-full font-bold cursor-pointer select-none transition">
        <ExclamationCircleIcon className="w-4 h-4" />
        Incompleto
      </span>
      {show && (
        <div
          className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2 min-w-[180px] max-w-xs rounded-xl border border-yellow-300 bg-white shadow-xl px-4 py-3 text-xs text-yellow-900 font-medium
          animate-fade-in transition w-fit pointer-events-auto"
          style={{whiteSpace:"normal"}}
          onClick={e => e.stopPropagation()}
        >
          <div className="font-bold text-yellow-900 mb-1 flex items-center gap-1">
            <ExclamationCircleIcon className="w-5 h-5 text-yellow-600" />
            Faltan por entregar:
          </div>
          <ul className="list-disc ml-5 mt-1 mb-0.5 space-y-0.5">
            {missingKeys.length > 0
              ? missingKeys.map(key => (
                  <li key={key} className="">{getStepLabel(key)}</li>
                ))
              : <li>No hay faltantes detectados.</li>
            }
          </ul>
          <div className="mt-2 text-[10px] text-slate-500">Completa los documentos para habilitar aprobación.</div>
        </div>
      )}
      <style jsx>{`
        .animate-fade-in { animation: fadein .15s both; }
        @keyframes fadein { from { opacity:.1; transform: translateY(12px) scale(.97);} to { opacity:1; transform:translateY(0) scale(1);} }
      `}</style>
    </span>
  );
}
