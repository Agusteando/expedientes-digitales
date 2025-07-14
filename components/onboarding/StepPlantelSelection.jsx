
"use client";
import { useState } from "react";
import { BuildingLibraryIcon } from "@heroicons/react/24/solid";

export default function StepPlantelSelection({
  plantelId,
  rfc,
  curp,
  email,
  planteles,
  loading,
  error,
  onSave,
  saving
}) {
  const [localPlantelId, setLocalPlantelId] = useState(plantelId || "");
  const [localRfc, setLocalRfc] = useState(rfc || "");
  const [localCurp, setLocalCurp] = useState(curp || "");
  const [localEmail, setLocalEmail] = useState(email || "");
  const [msg, setMsg] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!localPlantelId) {
      setMsg("Selecciona tu plantel.");
      return;
    }
    if (!/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i.test(localRfc.trim())) {
      setMsg("RFC inválido.");
      return;
    }
    if (!/^[A-Z]{4}[0-9]{6}[A-Z0-9]{8}$/i.test(localCurp.trim())) {
      setMsg("CURP inválido.");
      return;
    }
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(localEmail.trim())) {
      setMsg("Correo inválido.");
      return;
    }
    setMsg("");
    if (onSave) {
      onSave({
        plantelId: localPlantelId,
        rfc: localRfc.trim().toUpperCase(),
        curp: localCurp.trim().toUpperCase(),
        email: localEmail.trim(),
        onSuccess: () => setMsg("Datos guardados."),
        onError: (err) => setMsg(err || "Error al guardar."),
      });
    }
  }

  return (
    <form className="flex flex-col gap-4 items-stretch justify-center w-full max-w-md mx-auto pt-2" onSubmit={handleSubmit}>
      <div className="flex flex-row items-center gap-3 mb-2">
        <BuildingLibraryIcon className="w-7 h-7 text-cyan-400" />
        <span className="font-extrabold text-cyan-800 text-lg">Selecciona tu plantel</span>
      </div>
      {error && (
        <div className="rounded-lg bg-red-100 border border-red-200 text-red-700 font-bold text-xs p-2 mb-2 text-center">{error}</div>
      )}
      <label className="font-semibold text-cyan-800 text-xs">Plantel de adscripción</label>
      <select
        className="rounded border border-cyan-300 text-base px-3 py-2 bg-white mb-2 font-semibold"
        required
        value={localPlantelId}
        onChange={e => setLocalPlantelId(e.target.value)}
        disabled={saving}
        aria-label="Selecciona plantel"
      >
        <option value="">Selecciona…</option>
        {(planteles || []).map(p =>
          <option key={p.id} value={p.id}>
            {p.label || p.name}
          </option>
        )}
      </select>
      <label className="font-semibold text-cyan-800 text-xs">RFC</label>
      <input
        type="text"
        className="rounded border border-cyan-300 text-base px-3 py-2 mb-2 font-mono uppercase"
        maxLength={13}
        value={localRfc}
        onChange={e => setLocalRfc(e.target.value)}
        disabled={saving}
        required
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        inputMode="text"
        autoComplete="off"
      />
      <label className="font-semibold text-cyan-800 text-xs">CURP</label>
      <input
        type="text"
        className="rounded border border-cyan-300 text-base px-3 py-2 mb-2 font-mono uppercase"
        maxLength={18}
        value={localCurp}
        onChange={e => setLocalCurp(e.target.value)}
        disabled={saving}
        required
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        inputMode="text"
        autoComplete="off"
      />
      <label className="font-semibold text-cyan-800 text-xs">Correo electrónico</label>
      <input
        type="email"
        className="rounded border border-cyan-300 text-base px-3 py-2 mb-2"
        value={localEmail}
        onChange={e => setLocalEmail(e.target.value)}
        disabled={saving}
        required
        autoComplete="email"
        inputMode="email"
      />
      <div className="flex gap-2 justify-end items-center mt-2">
        {msg && <span className="text-xs font-semibold text-cyan-700 px-1">{msg}</span>}
        <button
          type="submit"
          className="bg-cyan-700 hover:bg-cyan-900 text-white text-xs font-bold rounded-full px-5 py-2 transition"
          disabled={saving || !localPlantelId || !localRfc || !localCurp || !localEmail}
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
