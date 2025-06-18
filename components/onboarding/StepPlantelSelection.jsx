
"use client";
import { useState, useEffect } from "react";

export default function StepPlantelSelection({
  plantelId: initialPlantelId,
  rfc: initialRfc,
  curp: initialCurp,
  planteles = [],
  loading,
  error,
  onSave,
  onStatus,
  saving,
}) {
  const [plantelId, setPlantelId] = useState(initialPlantelId || "");
  const [rfc, setRfc] = useState(initialRfc || "");
  const [curp, setCurp] = useState(initialCurp || "");
  const [touched, setTouched] = useState({ rfc: false, curp: false });
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    setPlantelId(initialPlantelId || "");
    setRfc(initialRfc || "");
    setCurp(initialCurp || "");
  }, [initialPlantelId, initialRfc, initialCurp]);

  function validCurp(c) {
    return /^[A-Z]{4}\d{6}[A-Z]{6}\d{2}$/.test((c ?? "").toUpperCase());
  }
  function validRfc(r) {
    return /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test((r ?? "").toUpperCase());
  }
  function handleSave(e) {
    e.preventDefault();
    if (!plantelId) return setLocalError("Selecciona plantel.");
    if (!validCurp(curp)) return setLocalError("CURP inválido.");
    if (!validRfc(rfc)) return setLocalError("RFC inválido.");
    onSave?.({ plantelId, curp: curp.trim().toUpperCase(), rfc: rfc.trim().toUpperCase() });
  }

  useEffect(() => {
    if (onStatus)
      onStatus(
        plantelId &&
        validRfc(rfc) &&
        validCurp(curp) &&
        !saving &&
        !loading &&
        !localError
      );
  }, [plantelId, rfc, curp, saving, loading, localError, onStatus]);

  return (
    <form onSubmit={handleSave} className="w-full flex flex-col items-center gap-5">
      <div className="flex flex-col items-center w-full gap-2">
        <label className="mb-1 font-semibold text-cyan-900 text-base">
          Selecciona tu plantel:
        </label>
        <select
          className="w-full max-w-xs rounded border border-cyan-300 p-3 text-base bg-white"
          value={plantelId || ""}
          onChange={e => setPlantelId(e.target.value)}
          disabled={loading || saving}
        >
          <option value="">Elegir plantel...</option>
          {planteles.map(p => (
            <option value={p.id} key={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div className="my-2 w-full max-w-xs">
        <label className="font-semibold text-xs text-cyan-900">RFC</label>
        <input
          className="w-full rounded border px-3 py-2 mt-1 mb-2 uppercase"
          type="text"
          name="rfc"
          value={rfc}
          placeholder="Ej: GOMC960912QX2"
          onChange={e => { setRfc(e.target.value.toUpperCase()); setTouched(t => ({ ...t, rfc: true })); setLocalError(""); }}
          maxLength={13}
          disabled={saving}
          required
        />
        {touched.rfc && rfc && !validRfc(rfc) && (
          <span className="block text-xs text-red-600 font-bold">RFC inválido</span>
        )}

        <label className="font-semibold text-xs text-cyan-900">CURP</label>
        <input
          className="w-full rounded border px-3 py-2 mt-1 mb-2 uppercase"
          type="text"
          name="curp"
          value={curp}
          placeholder="Ej: GOMC960912HDFRRL04"
          onChange={e => { setCurp(e.target.value.toUpperCase()); setTouched(t => ({ ...t, curp: true })); setLocalError(""); }}
          maxLength={18}
          disabled={saving}
          required
        />
        {touched.curp && curp && !validCurp(curp) && (
          <span className="block text-xs text-red-600 font-bold">CURP inválido</span>
        )}
        {localError && (
          <span className="block text-xs font-bold text-red-600">{localError}</span>
        )}
        {error && (
          <span className="block text-xs font-bold text-red-600">{error}</span>
        )}
      </div>
      <button
        type="submit"
        className={`mt-2 py-2 rounded-full w-full max-w-xs bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold shadow-lg text-base hover:from-teal-700 hover:to-cyan-800 ${
          !plantelId || !validRfc(rfc) || !validCurp(curp) || saving
            ? "opacity-40 grayscale pointer-events-none"
            : ""
        }`}
        disabled={!plantelId || !validRfc(rfc) || !validCurp(curp) || saving}
      >
        {saving ? "Guardando..." : "Guardar y continuar"}
      </button>
    </form>
  );
}
