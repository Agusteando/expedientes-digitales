
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlusIcon, XMarkIcon, SparklesIcon, FunnelIcon } from "@heroicons/react/24/outline";

/**
 * VectorRagFilter
 * - Two-chip inputs: Include (positives) and Exclude (negatives)
 * - Emits onChange({ positives, negatives }) after debounce
 * - Mobile-first, small footprint; usable in drawers/toolbars.
 */
export default function VectorRagFilter({
  onChange,
  className = "",
  debounceMs = 380,
  busy = false,
  error = ""
}) {
  const [posInput, setPosInput] = useState("");
  const [negInput, setNegInput] = useState("");
  const [positives, setPositives] = useState([]);
  const [negatives, setNegatives] = useState([]);
  const tRef = useRef();

  function addPositive() {
    const v = (posInput || "").trim();
    if (!v) return;
    if (!positives.includes(v)) setPositives((list) => [...list, v]);
    setPosInput("");
  }
  function addNegative() {
    const v = (negInput || "").trim();
    if (!v) return;
    if (!negatives.includes(v)) setNegatives((list) => [...list, v]);
    setNegInput("");
  }
  function removePositive(v) {
    setPositives((list) => list.filter((x) => x !== v));
  }
  function removeNegative(v) {
    setNegatives((list) => list.filter((x) => x !== v));
  }
  function clearAll() {
    setPositives([]);
    setNegatives([]);
    setPosInput("");
    setNegInput("");
  }

  // Debounced emit
  useEffect(() => {
    if (!onChange) return;
    clearTimeout(tRef.current);
    tRef.current = setTimeout(() => {
      onChange({ positives, negatives });
    }, debounceMs);
    return () => clearTimeout(tRef.current);
  }, [positives, negatives, debounceMs, onChange]);

  return (
    <div className={`w-full border border-cyan-100 rounded-xl bg-white shadow-sm p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1 font-bold text-cyan-800 text-sm">
          <FunnelIcon className="w-4 h-4 text-cyan-500" />
          Filtro semántico (RAG)
        </div>
        <div className="flex items-center gap-2">
          {busy && (
            <span className="text-[11px] text-cyan-600 animate-pulse">
              Calculando…
            </span>
          )}
          {(positives.length || negatives.length) ? (
            <button
              type="button"
              className="text-[11px] px-2 py-1 rounded-full border border-slate-200 hover:bg-slate-50"
              onClick={clearAll}
            >
              Limpiar
            </button>
          ) : null}
        </div>
      </div>

      {/* Positives */}
      <div className="mb-2">
        <label className="block text-[11px] font-semibold text-emerald-800 mb-1">Incluir (buscar por significado)</label>
        <div className="flex flex-wrap gap-1 mb-1">
          {positives.map((p) => (
            <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[12px]">
              <SparklesIcon className="w-4 h-4" />
              {p}
              <button
                type="button"
                className="ml-0.5 rounded-full hover:bg-emerald-100"
                onClick={() => removePositive(p)}
                title="Quitar"
                aria-label="Quitar"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          <input
            type="text"
            className="flex-1 rounded border border-cyan-200 px-2 py-1 text-sm bg-white"
            placeholder="Ej. identificación, fiscal, salud…"
            value={posInput}
            onChange={(e) => setPosInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPositive();
              }
            }}
            disabled={busy}
          />
          <button
            type="button"
            className="px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1"
            onClick={addPositive}
            disabled={busy || !posInput.trim()}
          >
            <PlusIcon className="w-4 h-4" />
            Agregar
          </button>
        </div>
      </div>

      {/* Negatives */}
      <div>
        <label className="block text-[11px] font-semibold text-red-800 mb-1">Excluir (opcional)</label>
        <div className="flex flex-wrap gap-1 mb-1">
          {negatives.map((n) => (
            <span key={n} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[12px]">
              {n}
              <button
                type="button"
                className="ml-0.5 rounded-full hover:bg-red-100"
                onClick={() => removeNegative(n)}
                title="Quitar"
                aria-label="Quitar"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          <input
            type="text"
            className="flex-1 rounded border border-cyan-200 px-2 py-1 text-sm bg-white"
            placeholder="Ej. CV, no penales, domicilios…"
            value={negInput}
            onChange={(e) => setNegInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addNegative();
              }
            }}
            disabled={busy}
          />
          <button
            type="button"
            className="px-3 py-1 rounded bg-red-700 hover:bg-red-900 text-white text-xs font-bold"
            onClick={addNegative}
            disabled={busy || !negInput.trim()}
          >
            Agregar
          </button>
        </div>
      </div>
      {error ? (
        <div className="mt-2 text-[12px] text-red-700 font-semibold">{error}</div>
      ) : null}
    </div>
  );
}
