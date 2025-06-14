
"use client";
import { useState } from "react";
import { PlusCircleIcon } from "@heroicons/react/24/outline";

/**
 * Props:
 *   - onCreate (plantelName: string) => Promise
 *   - onCreated: callback when creation is successful
 *   - isLoading: boolean for mutation in progress
 */
export default function PlantelCreateModal({ onCreate, onCreated, isLoading }) {
  const [open, setOpen] = useState(false);
  const [plantel, setPlantel] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleCreate = async () => {
    setError(""); setSuccess(false);
    try {
      await onCreate(plantel.trim());
      setSuccess(true);
      setPlantel("");
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        if (onCreated) onCreated();
      }, 1200);
    } catch (e) {
      let err = "";
      if (typeof e === "object" && e?.message) err = e.message;
      else if (typeof e === "string") err = e;
      setError(err || "No se pudo crear");
    }
  };

  return (
    <>
      <button
        className="rounded-full font-bold bg-emerald-700 text-white px-4 py-2 flex flex-row items-center gap-2 shadow hover:bg-emerald-900"
        onClick={() => setOpen(true)}
        type="button"
      >
        <PlusCircleIcon className="w-5 h-5" /> Nuevo Plantel
      </button>
      {open &&
        <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-xs flex flex-col gap-2 animate-fade-in border border-emerald-200">
            <header className="font-bold text-emerald-800 text-lg mb-2 flex gap-2 items-center"><PlusCircleIcon className="w-6 h-6" />Crear plantel</header>
            <input
              className="rounded border-emerald-300 px-3 py-2 font-semibold bg-white"
              placeholder="Nombre del plantel"
              value={plantel}
              onChange={e => setPlantel(e.target.value)}
              autoFocus
              disabled={isLoading}
              type="text"
            />
            <div className="flex flex-col gap-1 py-1">
              {error && <div className="text-sm text-red-700">{error}</div>}
              {success && <div className="text-sm text-emerald-700">Plantel creado.</div>}
            </div>
            <div className="flex flex-row gap-3 pt-2">
              <button
                className="px-3 py-1 bg-emerald-700 rounded text-white font-bold flex-1"
                onClick={handleCreate}
                disabled={!plantel.trim() || isLoading}
                type="button"
              >
                Crear
              </button>
              <button
                className="px-3 py-1 bg-slate-200 rounded font-bold text-slate-700 flex-1"
                onClick={() => setOpen(false)}
                type="button"
                disabled={isLoading}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      }
      <style jsx global>{`
        .animate-fade-in { animation: fadein .25s both; }
        @keyframes fadein { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </>
  );
}
