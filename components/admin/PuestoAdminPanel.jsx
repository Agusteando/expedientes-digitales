
"use client";
import { useEffect, useMemo, useState } from "react";
import { PlusCircleIcon, PencilSquareIcon, TrashIcon, ArrowPathIcon, ClipboardIcon, CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";

function normalizeListInput(text) {
  if (!text) return [];
  return text
    .split(/\r?\n|,/g)
    .map(s => s.trim())
    .filter(Boolean);
}

export default function PuestoAdminPanel() {
  const [puestos, setPuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importMode, setImportMode] = useState("merge"); // merge | replace
  const [importing, setImporting] = useState(false);

  async function fetchPuestos() {
    setLoading(true);
    setMsg(""); setErr("");
    try {
      const r = await fetch("/api/admin/puestos/list");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "No se pudo cargar puestos");
      setPuestos(d.puestos || []);
    } catch (e) {
      setErr(e.message || "Error");
    }
    setLoading(false);
  }

  useEffect(() => { fetchPuestos(); }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return puestos;
    const q = query.toLowerCase();
    return puestos.filter(p => p.name.toLowerCase().includes(q));
  }, [puestos, query]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true); setErr(""); setMsg("");
    try {
      const r = await fetch("/api/admin/puestos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "No se pudo crear");
      setNewName("");
      setMsg("Puesto agregado/activado");
      await fetchPuestos();
    } catch (e) {
      setErr(e.message || "Error");
    }
    setAdding(false);
  }

  async function toggleActive(p, next) {
    setSavingId(p.id);
    setErr(""); setMsg("");
    try {
      const r = await fetch(`/api/admin/puestos/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: next })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "No se pudo cambiar estatus");
      setMsg(next ? "Activado" : "Desactivado");
      await fetchPuestos();
    } catch (e) {
      setErr(e.message || "Error");
    }
    setSavingId(null);
  }

  async function rename(p, newLabel) {
    const name = (newLabel || "").trim();
    if (!name || name === p.name) return;
    setSavingId(p.id);
    setErr(""); setMsg("");
    try {
      const r = await fetch(`/api/admin/puestos/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "No se pudo renombrar");
      setMsg("Nombre actualizado");
      await fetchPuestos();
    } catch (e) {
      setErr(e.message || "Error");
    }
    setSavingId(null);
  }

  async function remove(p) {
    if (!confirm(`¿Eliminar el puesto "${p.name}"?`)) return;
    setSavingId(p.id);
    setErr(""); setMsg("");
    try {
      const r = await fetch(`/api/admin/puestos/${p.id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "No se pudo eliminar");
      setMsg(d.deactivated ? "Puesto desactivado" : "Puesto eliminado");
      await fetchPuestos();
    } catch (e) {
      setErr(e.message || "Error");
    }
    setSavingId(null);
  }

  async function doImport() {
    const items = normalizeListInput(importText);
    if (items.length === 0) {
      setErr("Agrega al menos un puesto");
      return;
    }
    setImporting(true);
    setErr(""); setMsg("");
    try {
      const r = await fetch("/api/admin/puestos/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, mode: importMode })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "No se pudo importar");
      setMsg(importMode === "replace" ? "Lista reemplazada" : "Lista actualizada");
      setImportOpen(false);
      setImportText("");
      await fetchPuestos();
    } catch (e) {
      setErr(e.message || "Error");
    }
    setImporting(false);
  }

  function copyTemplate() {
    const sample = [
      "DIRECTOR ESCOLAR",
      "COORDINADOR PEDAGÓGICO",
      "DOCENTE",
      "INGLÉS",
      "ESPAÑOL",
      "EDUCACIÓN FÍSICA",
      "NUTRIÓLOGA",
      "PSICÓLOGO",
      "ADMINISTRACIÓN",
      "MANTENIMIENTO"
    ].join("\n");
    setImportText(sample);
  }

  return (
    <section className="w-full bg-white border border-cyan-200 shadow-xl rounded-2xl p-4 mb-6">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 font-bold text-cyan-800 text-lg">
          Puestos
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar puesto..."
              className="border border-cyan-200 rounded-full px-3 py-2 text-sm w-[200px]"
              aria-label="Buscar puesto"
            />
          </div>
          <button
            className="flex items-center gap-1 px-3 py-1.5 bg-cyan-700 hover:bg-cyan-900 text-white text-xs rounded-full shadow font-bold"
            onClick={() => setImportOpen(true)}
            type="button"
          >
            <ClipboardIcon className="w-5 h-5" />
            Importar/pegar
          </button>
          <button
            className="flex items-center px-2 py-1.5 border border-cyan-300 rounded text-xs hover:bg-cyan-50"
            onClick={fetchPuestos}
            type="button"
            title="Recargar"
          >
            <ArrowPathIcon className="w-4 h-4 text-cyan-600" />
          </button>
        </div>
      </header>

      {(msg || err) && (
        <div className={`mb-2 text-center text-xs font-semibold ${err ? "text-red-700" : "text-emerald-800"}`}>
          {err || msg}
        </div>
      )}

      <div className="w-full overflow-x-auto">
        {loading ? (
          <div className="text-center p-6 text-gray-500 font-bold">Cargando…</div>
        ) : (
          <table className="min-w-full table-auto border rounded-xl text-xs sm:text-sm">
            <thead>
              <tr className="bg-cyan-50 border-b border-cyan-100">
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">Estatus</th>
                <th className="px-3 py-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-emerald-50 border-b border-emerald-100">
                <td className="px-3 py-2">
                  <form onSubmit={handleAdd} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Agregar nuevo puesto…"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="rounded border border-emerald-200 px-2 py-1 w-full"
                      maxLength={80}
                      disabled={adding}
                    />
                    <button
                      type="submit"
                      className="flex items-center gap-1 px-3 py-1 bg-emerald-700 hover:bg-emerald-900 text-white rounded-full text-xs font-bold disabled:opacity-60"
                      disabled={adding || !newName.trim()}
                    >
                      <PlusCircleIcon className="w-4 h-4" />
                      Agregar
                    </button>
                  </form>
                </td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2"></td>
              </tr>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-cyan-50">
                  <td className="px-3 py-2">
                    <InlineEditable
                      value={p.name}
                      onSave={(val) => rename(p, val)}
                      disabled={savingId === p.id}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${p.active ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-slate-100 text-slate-700 border-slate-200"}`}>
                      {p.active ? <CheckCircleIcon className="w-4 h-4" /> : <XMarkIcon className="w-4 h-4" />}
                      {p.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2 items-center">
                      <button
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${p.active ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200" : "bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-900"}`}
                        onClick={() => toggleActive(p, !p.active)}
                        disabled={savingId === p.id}
                      >
                        {p.active ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        className="px-3 py-1 rounded-full text-xs font-bold bg-red-700 hover:bg-red-900 text-white"
                        onClick={() => remove(p)}
                        disabled={savingId === p.id}
                      >
                        <TrashIcon className="w-4 h-4 inline mr-1" />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-center text-slate-500" colSpan={3}>Sin resultados</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {importOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-[95vw] max-w-2xl border border-cyan-100 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg text-cyan-800">Importar puestos</h3>
              <button
                className="text-xs rounded-full px-3 py-1 bg-slate-100 hover:bg-slate-200"
                onClick={() => setImportOpen(false)}
                type="button"
              >
                Cerrar
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-2">
              Pega una lista de puestos, separados por líneas o comas. Usa "Reemplazar" para sustituir completamente la lista (los que no estén se desactivarán).
            </p>
            <div className="flex flex-col gap-2">
              <textarea
                className="w-full min-h-[180px] rounded-lg border border-cyan-200 p-2 text-sm"
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder="Ejemplo:
DIRECTOR ESCOLAR
COORDINADOR PEDAGÓGICO
DOCENTE"
              />
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold">Modo:</label>
                  <select
                    value={importMode}
                    onChange={e => setImportMode(e.target.value)}
                    className="rounded border border-cyan-200 px-2 py-1 text-xs"
                  >
                    <option value="merge">Actualizar (merge)</option>
                    <option value="replace">Reemplazar todo</option>
                  </select>
                </div>
                <button
                  className="text-xs rounded-full px-3 py-1 border border-cyan-200 hover:bg-cyan-50"
                  onClick={copyTemplate}
                  type="button"
                >
                  Usar ejemplo
                </button>
                <span className="text-xs text-slate-600">
                  Detectados: <b>{normalizeListInput(importText).length}</b>
                </span>
              </div>
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  className="text-xs rounded-full px-3 py-1 bg-slate-100 hover:bg-slate-200"
                  onClick={() => setImportOpen(false)}
                  type="button"
                  disabled={importing}
                >
                  Cancelar
                </button>
                <button
                  className={`text-xs rounded-full px-4 py-2 text-white font-bold ${importMode === "replace" ? "bg-red-700 hover:bg-red-900" : "bg-cyan-700 hover:bg-cyan-900"}`}
                  onClick={doImport}
                  type="button"
                  disabled={importing || normalizeListInput(importText).length === 0}
                >
                  {importing ? "Importando…" : importMode === "replace" ? "Reemplazar" : "Actualizar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function InlineEditable({ value, onSave, disabled }) {
  const [v, setV] = useState(value);
  const [editing, setEditing] = useState(false);
  useEffect(() => setV(value), [value]);

  function submit() {
    if (v.trim() && v.trim() !== value) onSave(v.trim());
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-2">
      {editing ? (
        <>
          <input
            value={v}
            onChange={e => setV(e.target.value)}
            className="rounded border border-cyan-200 px-2 py-1 text-sm w-full"
            onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") { setV(value); setEditing(false); } }}
            maxLength={80}
            autoFocus
            disabled={disabled}
          />
          <button
            className="px-2 py-1 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-800"
            onClick={submit}
            disabled={disabled}
          >
            Guardar
          </button>
          <button
            className="px-2 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200"
            onClick={() => { setV(value); setEditing(false); }}
            disabled={disabled}
          >
            Cancelar
          </button>
        </>
      ) : (
        <>
          <span className="font-semibold text-cyan-900">{value}</span>
          <button
            className="px-2 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200"
            onClick={() => setEditing(true)}
            disabled={disabled}
            title="Editar"
          >
            <PencilSquareIcon className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}
