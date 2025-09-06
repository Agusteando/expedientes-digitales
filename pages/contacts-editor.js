
import { useEffect, useMemo, useState } from "react";

const ROLE_OPTIONS = ["ADMON", "PRINCIPAL"];

// Utilities
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
function normalizePhoneInput(v) {
  return (v || "").toString().replace(/\D/g, "");
}
function isValidPhone(digits) {
  return digits.length >= 8 && digits.length <= 15;
}
function computeIdFromPhone(digits) {
  const d = normalizePhoneInput(digits);
  return d ? `${d}@c.us` : "";
}

// Validation (pure, no hooks)
function validateContacts(contacts) {
  const issues = [];
  const issuesByPlantel = {};
  const countsByPlantel = {};
  const keys = Object.keys(contacts || {});
  for (const plantel of keys) {
    const rows = contacts[plantel] || [];
    countsByPlantel[plantel] = rows.length;
    const local = [];
    if (!plantel || !plantel.trim()) {
      local.push("Nombre del plantel vacío.");
    }
    rows.forEach((row, idx) => {
      const role = (row.Role || "").toString().trim().toUpperCase();
      const name = (row.Name || "").toString().trim();
      const phone = normalizePhoneInput(row.Phone || row.ID || "");
      if (!ROLE_OPTIONS.includes(role)) {
        local.push(`Fila ${idx + 1}: Rol debe ser ${ROLE_OPTIONS.join(", ")}.`);
      }
      if (!name) {
        local.push(`Fila ${idx + 1}: Nombre requerido.`);
      }
      if (!phone) {
        local.push(`Fila ${idx + 1}: Teléfono requerido.`);
      } else if (!isValidPhone(phone)) {
        local.push(`Fila ${idx + 1}: Teléfono debe tener 8-15 dígitos (tiene ${phone.length}).`);
      }
    });
    if (local.length > 0) issuesByPlantel[plantel] = local;
    issues.push(...local.map((m) => `${plantel}: ${m}`));
  }
  return {
    ok: issues.length === 0,
    issues,
    issuesByPlantel,
    countsByPlantel,
  };
}

export default function ContactsEditor() {
  // Data and UI State
  const [contacts, setContacts] = useState(null); // object { PlantelName: [{Role,Name,Phone,ID}, ...], ...}
  const [apiPath, setApiPath] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedOk, setSavedOk] = useState(false);

  const [selectedPlantel, setSelectedPlantel] = useState("");
  const [filter, setFilter] = useState("");

  // Initial load
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch("/api/contacts");
        const j = await r.json();
        if (ignore) return;
        if (!j.ok) {
          setError(j.error || "No se pudo cargar los contactos.");
          setContacts({});
          setApiPath("");
          setLoading(false);
          return;
        }
        setContacts(j.contacts || {});
        setApiPath(j.path || "");
        setError("");
        setLoading(false);
      } catch (e) {
        if (!ignore) {
          setError("No se pudo cargar los contactos.");
          setContacts({});
          setApiPath("");
          setLoading(false);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const plantelKeys = useMemo(() => Object.keys(contacts || {}).sort((a, b) => a.localeCompare(b, "es")), [contacts]);

  // Derived search
  const filteredKeys = useMemo(() => {
    const q = (filter || "").trim().toLowerCase();
    if (!q) return plantelKeys;
    return plantelKeys.filter((k) => k.toLowerCase().includes(q));
  }, [plantelKeys, filter]);

  // Validation summary across all contacts
  const validation = useMemo(() => validateContacts(contacts || {}), [contacts]);

  // Auto-select a plantel on data/filter changes
  useEffect(() => {
    if (!contacts) return;
    if (selectedPlantel && filteredKeys.includes(selectedPlantel)) return;
    setSelectedPlantel(filteredKeys[0] || "");
  }, [contacts, filteredKeys, selectedPlantel]);

  // CRUD operations
  function renamePlantel(oldKey, newKey) {
    const name = (newKey || "").trim();
    if (!name || oldKey === name || !contacts) return;
    setContacts((prev) => {
      const next = deepClone(prev);
      if (next[name]) {
        next[name] = [...(next[name] || []), ...(next[oldKey] || [])];
      } else {
        next[name] = next[oldKey] || [];
      }
      delete next[oldKey];
      return next;
    });
    if (selectedPlantel === oldKey) setSelectedPlantel(name);
  }

  function addPlantel() {
    const newName = window.prompt("Nuevo plantel (clave):", "");
    if (!newName) return;
    const key = newName.trim();
    if (!key) return;
    setContacts((prev) => {
      const next = deepClone(prev || {});
      if (!next[key]) next[key] = [];
      return next;
    });
    setSelectedPlantel(key);
  }

  function deletePlantel(key) {
    if (!window.confirm(`¿Eliminar plantel "${key}"?`)) return;
    setContacts((prev) => {
      const next = deepClone(prev || {});
      delete next[key];
      return next;
    });
    if (selectedPlantel === key) {
      // set to next available
      const remain = plantelKeys.filter((k) => k !== key);
      setSelectedPlantel(remain[0] || "");
    }
  }

  function addRow(plantel, role = "ADMON") {
    setContacts((prev) => {
      const next = deepClone(prev || {});
      next[plantel] = next[plantel] || [];
      next[plantel].push({ Role: role, Name: "", Phone: "", ID: "" });
      return next;
    });
  }

  function updateRow(plantel, idx, field, value) {
    setContacts((prev) => {
      const next = deepClone(prev || {});
      if (!next[plantel]) next[plantel] = [];
      const row = next[plantel][idx];
      if (!row) return prev;
      if (field === "Phone") {
        row.Phone = normalizePhoneInput(value);
        row.ID = computeIdFromPhone(row.Phone);
      } else if (field === "Role") {
        row.Role = (value || "").toUpperCase();
      } else {
        row[field] = value;
      }
      return next;
    });
  }

  function deleteRow(plantel, idx) {
    setContacts((prev) => {
      const next = deepClone(prev || {});
      if (!next[plantel]) return prev;
      next[plantel].splice(idx, 1);
      return next;
    });
  }

  async function saveAll() {
    if (!contacts) return;
    setSaving(true);
    setSavedOk(false);
    setError("");
    try {
      // Build payload as the UI shape (server will normalize and persist)
      const toSend = {};
      for (const plantel of Object.keys(contacts)) {
        const rows = contacts[plantel] || [];
        toSend[plantel] = rows.map((r) => ({
          Role: (r.Role || "").toString().trim().toUpperCase(),
          Name: (r.Name || "").toString().trim(),
          Phone: normalizePhoneInput(r.Phone || r.ID || ""),
        }));
      }
      const resp = await fetch("/api/contacts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: toSend }),
      });
      const j = await resp.json();
      if (!j.ok) {
        throw new Error(j.error || "No se pudo guardar.");
      }
      // Reload canonical
      const rr = await fetch("/api/contacts");
      const jj = await rr.json();
      if (jj.ok) {
        setContacts(jj.contacts || {});
        setApiPath(jj.path || "");
      }
      setSavedOk(true);
    } catch (e) {
      setError(e?.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
      setTimeout(() => setSavedOk(false), 2500);
    }
  }

  // Render helpers
  function PlantelListItem({ plantel }) {
    const count = validation.countsByPlantel?.[plantel] ?? (contacts?.[plantel]?.length || 0);
    const issues = validation.issuesByPlantel?.[plantel]?.length || 0;
    const active = selectedPlantel === plantel;
    return (
      <button
        type="button"
        onClick={() => setSelectedPlantel(plantel)}
        className={[
          "w-full text-left rounded-lg border px-3 py-2 mb-2 transition",
          active ? "bg-cyan-50 border-cyan-300 shadow-sm" : "bg-white border-slate-200 hover:bg-slate-50",
        ].join(" ")}
      >
        <div className="flex items-center gap-2">
          <div className="font-semibold text-slate-800 truncate">{plantel}</div>
          <span className="ml-auto inline-flex items-center gap-1 text-[0.72rem] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {count} contacto{count === 1 ? "" : "s"}
          </span>
          {issues > 0 && (
            <span className="inline-flex items-center gap-1 text-[0.72rem] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              {issues} alerta{issues === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </button>
    );
  }

  function HeaderBar() {
    return (
      <div className="w-full flex flex-wrap items-center gap-3 mb-3">
        <div className="text-lg font-bold tracking-tight text-slate-900">Editor de Contactos</div>
        <div className="text-xs text-slate-500 border border-slate-200 rounded-md px-2 py-1">
          {apiPath || "Ruta de archivo desconocida"}
        </div>
        <div className="flex-1" />
        <div className="relative">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar plantel…"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 min-w-[12rem]"
          />
        </div>
        <button
          type="button"
          onClick={addPlantel}
          className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-semibold px-4 py-2"
        >
          Nuevo plantel
        </button>
        <button
          type="button"
          onClick={saveAll}
          disabled={saving || !validation.ok}
          className={[
            "rounded-full px-5 py-2 text-sm font-bold text-white transition",
            validation.ok && !saving
              ? "bg-cyan-700 hover:bg-cyan-900"
              : "bg-cyan-400 cursor-not-allowed",
          ].join(" ")}
        >
          {saving ? "Guardando…" : validation.ok ? "Guardar" : "Revisar errores"}
        </button>
      </div>
    );
  }

  function PlantelDetail() {
    if (!selectedPlantel) {
      return (
        <div className="w-full h-full min-h-[14rem] rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-500">
          Selecciona un plantel para editar.
        </div>
      );
    }
    const rows = contacts?.[selectedPlantel] || [];
    const localIssues = validation.issuesByPlantel?.[selectedPlantel] || [];

    return (
      <div className="w-full flex flex-col gap-3">
        {/* Title row */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={selectedPlantel}
            onChange={(e) => setSelectedPlantel(e.target.value)}
            onBlur={(e) => renamePlantel(selectedPlantel, e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 min-w-[12rem]"
          />
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => addRow(selectedPlantel, "ADMON")}
              className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold px-3 py-1"
            >
              + ADMON
            </button>
            <button
              type="button"
              onClick={() => addRow(selectedPlantel, "PRINCIPAL")}
              className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold px-3 py-1"
            >
              + PRINCIPAL
            </button>
            <button
              type="button"
              onClick={() => deletePlantel(selectedPlantel)}
              className="rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1"
            >
              Eliminar plantel
            </button>
          </div>
        </div>

        {localIssues.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900 text-sm">
            {localIssues.map((m, i) => (
              <div key={i}>• {m}</div>
            ))}
          </div>
        )}

        {/* Rows table-like list */}
        <div className="w-full flex flex-col gap-2">
          {rows.length === 0 && (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-slate-500">
              Sin contactos. Agrega uno con los botones de arriba.
            </div>
          )}
          {rows.map((row, idx) => {
            const phoneDigits = normalizePhoneInput(row.Phone || row.ID || "");
            const id = computeIdFromPhone(phoneDigits);
            const phoneOk = !phoneDigits || isValidPhone(phoneDigits);
            const roleVal = (row.Role || "").toString().toUpperCase();
            return (
              <div
                key={`${selectedPlantel}-${idx}`}
                className={[
                  "rounded-xl border bg-white p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center",
                  "border-slate-200",
                ].join(" ")}
              >
                {/* Role */}
                <div className="sm:col-span-2">
                  <label className="block text-[0.72rem] font-semibold text-slate-500 mb-1">Rol</label>
                  <select
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    value={roleVal}
                    onChange={(e) => updateRow(selectedPlantel, idx, "Role", e.target.value)}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Name */}
                <div className="sm:col-span-4">
                  <label className="block text-[0.72rem] font-semibold text-slate-500 mb-1">Nombre</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    value={row.Name || ""}
                    placeholder="Nombre completo"
                    onChange={(e) => updateRow(selectedPlantel, idx, "Name", e.target.value)}
                  />
                </div>
                {/* Phone */}
                <div className="sm:col-span-3">
                  <label className="block text-[0.72rem] font-semibold text-slate-500 mb-1">Teléfono</label>
                  <input
                    type="text"
                    className={[
                      "w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2",
                      phoneOk
                        ? "border-slate-300 focus:ring-cyan-500"
                        : "border-rose-400 bg-rose-50 focus:ring-rose-400",
                    ].join(" ")}
                    value={phoneDigits}
                    placeholder="Sólo dígitos"
                    onChange={(e) => updateRow(selectedPlantel, idx, "Phone", e.target.value)}
                  />
                  {!phoneOk && (
                    <div className="mt-1 text-[0.72rem] text-rose-700">
                      Debe tener 8–15 dígitos.
                    </div>
                  )}
                </div>
                {/* ID computed */}
                <div className="sm:col-span-3">
                  <label className="block text-[0.72rem] font-semibold text-slate-500 mb-1">ID (@c.us)</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    value={id}
                    readOnly
                  />
                </div>

                {/* Remove */}
                <div className="sm:col-span-12 flex justify-end">
                  <button
                    type="button"
                    onClick={() => deleteRow(selectedPlantel, idx)}
                    className="rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1"
                  >
                    Eliminar contacto
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-slate-50 to-cyan-50 p-3 sm:p-5">
      <div className="mx-auto w-full max-w-7xl">
        <HeaderBar />

        {loading ? (
          <div className="w-full py-10 text-center text-slate-500">Cargando…</div>
        ) : error ? (
          <div className="w-full rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 font-semibold">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Sidebar */}
            <aside className="lg:col-span-4 xl:col-span-3 rounded-2xl border border-slate-200 bg-white p-3">
              {filteredKeys.length === 0 ? (
                <div className="text-sm text-slate-500 px-2 py-6 text-center">Sin resultados.</div>
              ) : (
                filteredKeys.map((k) => <PlantelListItem key={k} plantel={k} />)
              )}
            </aside>

            {/* Detail */}
            <main className="lg:col-span-8 xl:col-span-9 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
              <PlantelDetail />
            </main>
          </div>
        )}

        {/* Footer Status */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {!validation.ok && (
            <span className="text-sm text-amber-700">
              Hay {validation.issues.length} pendiente{validation.issues.length === 1 ? "" : "s"} por revisar.
            </span>
          )}
          {savedOk && <span className="text-sm text-emerald-700">Guardado correctamente.</span>}
        </div>
      </div>
    </div>
  );
}
