
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PlusCircleIcon,
  ArrowPathIcon,
  TrashIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";

const ROLE_OPTIONS = ["ADMON", "PRINCIPAL"];

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
  return `${digits}@c.us`;
}

export default function ContactsEditor() {
  const [data, setData] = useState(null); // shape: { contacts: {...}, path: "..." }
  const [working, setWorking] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newPlantel, setNewPlantel] = useState("");
  const [confirmDeleteKey, setConfirmDeleteKey] = useState(null);

  // UX hints
  const [hint, setHint] = useState("");

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setWorking(true);
        const r = await fetch("/api/contacts", { cache: "no-store" });
        const j = await r.json();
        if (!ignore) {
          if (j.ok) {
            const contacts = j.contacts || {};
            setData({ contacts, path: j.path || "" });
            setErrMsg("");
          } else {
            setErrMsg(j.error || "No se pudo cargar.");
          }
        }
      } catch (e) {
        if (!ignore) setErrMsg("No se pudo cargar.");
      } finally {
        if (!ignore) setWorking(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const validation = useMemo(() => {
    if (!data) return { ok: true, issues: [] };
    const issues = [];
    const contacts = data.contacts || {};
    Object.keys(contacts).forEach((plantel) => {
      const rows = contacts[plantel] || [];
      if (!plantel || !plantel.trim()) {
        issues.push(`Una clave de plantel está vacía.`);
      }
      rows.forEach((row, idx) => {
        const role = (row.Role || "").toString().trim().toUpperCase();
        const name = (row.Name || "").toString().trim();
        const phone = normalizePhoneInput(row.Phone || row.ID || "");
        if (!ROLE_OPTIONS.includes(role)) {
          issues.push(`${plantel}[${idx}] Rol debe ser ${ROLE_OPTIONS.join(", ")}.`);
        }
        if (!name) {
          issues.push(`${plantel}[${idx}] Nombre es requerido.`);
        }
        if (!phone) {
          issues.push(`${plantel}[${idx}] Teléfono es requerido.`);
        } else if (!isValidPhone(phone)) {
          issues.push(`${plantel}[${idx}] Teléfono: 8-15 dígitos (recibidos ${phone.length}).`);
        }
      });
    });
    return { ok: issues.length === 0, issues };
  }, [data]);

  function updatePlantelName(oldKey, newKey) {
    if (!data) return;
    const newName = (newKey || "").trim();
    if (!newName) return;
    if (oldKey === newName) return;
    setData((prev) => {
      const next = deepClone(prev);
      if (next.contacts[newName]) {
        next.contacts[newName] = [
          ...(next.contacts[newName] || []),
          ...(next.contacts[oldKey] || []),
        ];
      } else {
        next.contacts[newName] = next.contacts[oldKey] || [];
      }
      delete next.contacts[oldKey];
      return next;
    });
    setHint("Nombre de plantel actualizado.");
    setTimeout(() => setHint(""), 1500);
  }

  function addPlantel(key) {
    const name = (key || "").trim();
    if (!name) return;
    setData((prev) => {
      const next = deepClone(prev);
      if (!next.contacts[name]) next.contacts[name] = [];
      return next;
    });
    setAddOpen(false);
    setNewPlantel("");
    setHint("Plantel agregado.");
    setTimeout(() => setHint(""), 1500);
  }

  function requestDeletePlantel(key) {
    setConfirmDeleteKey(key);
  }
  function deletePlantelConfirmed() {
    const key = confirmDeleteKey;
    if (!key) return;
    setData((prev) => {
      const next = deepClone(prev);
      delete next.contacts[key];
      return next;
    });
    setConfirmDeleteKey(null);
    setHint("Plantel eliminado.");
    setTimeout(() => setHint(""), 1500);
  }

  function addContactRow(plantel, role = "ADMON") {
    setData((prev) => {
      const next = deepClone(prev);
      next.contacts[plantel] = next.contacts[plantel] || [];
      next.contacts[plantel].push({
        Role: role,
        Name: "",
        Phone: "",
        ID: "",
      });
      return next;
    });
  }

  function updateRow(plantel, idx, field, value) {
    setData((prev) => {
      const next = deepClone(prev);
      const row = next.contacts[plantel][idx];
      if (field === "Phone") {
        row.Phone = normalizePhoneInput(value);
        row.ID = computeIdFromPhone(row.Phone || "");
      } else if (field === "Role") {
        row.Role = (value || "").toUpperCase();
      } else {
        row[field] = value;
      }
      return next;
    });
  }

  function deleteRow(plantel, idx) {
    setData((prev) => {
      const next = deepClone(prev);
      next.contacts[plantel].splice(idx, 1);
      return next;
    });
  }

  async function saveAll() {
    if (!data) return;
    setWorking(true);
    setSaveOk(false);
    setErrMsg("");
    try {
      const toSend = {};
      for (const plantel of Object.keys(data.contacts || {})) {
        const rows = data.contacts[plantel] || [];
        toSend[plantel] = rows.map((r) => {
          const phone = normalizePhoneInput(r.Phone || r.ID || "");
          return {
            Role: (r.Role || "").toString().trim().toUpperCase(),
            Name: (r.Name || "").toString().trim(),
            Phone: phone, // Server persists Role/ID/Name
          };
        });
      }

      const resp = await fetch("/api/contacts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: toSend }),
      });
      const j = await resp.json();
      if (!j.ok) throw new Error(j.error || "Falló el guardado.");

      const reload = await fetch("/api/contacts", { cache: "no-store" });
      const jj = await reload.json();
      if (jj.ok) setData({ contacts: jj.contacts || {}, path: jj.path || "" });

      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2200);
    } catch (e) {
      setErrMsg(e && e.message ? e.message : "No se pudo guardar.");
    } finally {
      setWorking(false);
    }
  }

  function exportJson() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data.contacts || {}, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url;
    el.download = "contacts-export.json";
    document.body.appendChild(el);
    el.click();
    el.remove();
    setTimeout(() => URL.revokeObjectURL(url), 600);
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="card p-5 sm:p-7">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheckIcon className="w-6 h-6 text-cyan-600" />
            <h1 className="text-lg sm:text-xl font-extrabold text-cyan-900">
              Editor de Contactos por Plantel
            </h1>
          </div>
          <div className="text-slate-600 text-sm">
            {working ? "Cargando…" : errMsg ? errMsg : ""}
          </div>
        </div>
      </div>
    );
  }

  const { contacts, path } = data;

  const filteredKeys = useMemo(() => {
    const keys = Object.keys(contacts);
    const q = (search || "").trim().toLowerCase();
    if (!q) return keys;
    return keys.filter((k) => k.toLowerCase().includes(q));
  }, [contacts, search]);

  return (
    <div className="w-full">
      {/* Top bar */}
      <header className="w-full sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-cyan-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-6 h-6 text-cyan-600" />
              <h1 className="text-base sm:text-lg font-extrabold text-cyan-900">
                Editor de Contactos por Plantel
              </h1>
            </div>
            <span className="badge bg-cyan-50 border border-cyan-200 text-cyan-700">
              Ruta de archivo: <span className="font-mono">{path || ""}</span>
            </span>
            <div className="flex-1" />
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 text-cyan-400 absolute left-3 top-2.5" />
              <input
                className="input pl-8 pr-3 py-1.5 rounded-full text-sm"
                placeholder="Buscar plantel…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar plantel"
              />
            </div>
            <button
              className="btn-secondary"
              onClick={() => setAddOpen(true)}
              type="button"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Nuevo plantel
            </button>
            <button
              className="btn-secondary"
              onClick={exportJson}
              type="button"
              aria-label="Exportar JSON"
              title="Exportar JSON"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Exportar
            </button>
            <button
              className={`btn-primary ${(!validation.ok || working) ? "opacity-60 cursor-not-allowed" : ""}`}
              onClick={saveAll}
              disabled={!validation.ok || working}
              type="button"
            >
              <ArrowUpTrayIcon className="w-5 h-5" />
              {working ? "Guardando…" : "Guardar"}
            </button>
          </div>
          {/* Status row */}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {!validation.ok && validation.issues.length > 0 ? (
              <div className="badge bg-yellow-50 border border-yellow-300 text-yellow-800">
                <ExclamationTriangleIcon className="w-4 h-4" />
                {validation.issues.length} pendiente(s) de corregir
              </div>
            ) : (
              <div className="badge bg-emerald-50 border border-emerald-200 text-emerald-700">
                <CheckCircleIcon className="w-4 h-4" />
                Validación OK
              </div>
            )}
            {saveOk && (
              <div className="badge bg-emerald-100 border border-emerald-200 text-emerald-800 fade-in">
                <CheckCircleIcon className="w-4 h-4" />
                Cambios guardados
              </div>
            )}
            {errMsg && (
              <div className="badge bg-red-50 border border-red-200 text-red-700 fade-in">
                <XCircleIcon className="w-4 h-4" />
                {errMsg}
              </div>
            )}
            {hint && (
              <div className="badge bg-cyan-50 border border-cyan-200 text-cyan-700 fade-in">
                {hint}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Validation details */}
        {!validation.ok && validation.issues.length > 0 && (
          <div className="card p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
              <div className="font-bold text-yellow-900">
                Corrige los siguientes puntos antes de guardar
              </div>
            </div>
            <ul className="list-disc pl-5 text-sm text-yellow-900 space-y-1">
              {validation.issues.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredKeys.map((key) => (
            <PlantelCard
              key={key}
              plantelKey={key}
              rows={contacts[key]}
              onRename={(newKey) => updatePlantelName(key, newKey)}
              onDelete={() => requestDeletePlantel(key)}
              onAddAdmon={() => addContactRow(key, "ADMON")}
              onAddPrincipal={() => addContactRow(key, "PRINCIPAL")}
              onUpdateRow={(idx, field, value) => updateRow(key, idx, field, value)}
              onDeleteRow={(idx) => deleteRow(key, idx)}
            />
          ))}
          {filteredKeys.length === 0 && (
            <div className="card p-6 text-center text-slate-500 font-semibold">
              No hay planteles que coincidan con tu búsqueda.
            </div>
          )}
        </div>
      </main>

      {/* Add Plantel Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="card w-[92vw] max-w-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-bold text-cyan-900">Nuevo Plantel</div>
              <button className="btn-secondary" onClick={() => setAddOpen(false)} type="button">
                Cerrar
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Ingresa una clave interna de plantel (sin espacios). Puedes renombrarlo después.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addPlantel(newPlantel);
              }}
              className="flex flex-col sm:flex-row gap-2"
            >
              <input
                className="input font-mono"
                placeholder="ej: plantel_21_marzo"
                maxLength={80}
                value={newPlantel}
                onChange={(e) => setNewPlantel(e.target.value)}
                autoFocus
              />
              <button
                className="btn-primary"
                type="submit"
                disabled={!newPlantel.trim()}
              >
                <PlusCircleIcon className="w-5 h-5" />
                Agregar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Plantel Modal */}
      {confirmDeleteKey && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="card w-[92vw] max-w-md p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrashIcon className="w-6 h-6 text-red-700" />
              <div className="text-lg font-bold text-red-800">Eliminar plantel</div>
            </div>
            <div className="text-sm text-slate-700 mb-4">
              ¿Seguro que deseas eliminar el plantel
              {" "}<b>{confirmDeleteKey}</b>? Esta acción no se puede deshacer.
            </div>
            <div className="flex items-center justify-end gap-2">
              <button className="btn-secondary" onClick={() => setConfirmDeleteKey(null)} type="button">
                Cancelar
              </button>
              <button className="btn-danger" onClick={deletePlantelConfirmed} type="button">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlantelCard({
  plantelKey,
  rows,
  onRename,
  onDelete,
  onAddAdmon,
  onAddPrincipal,
  onUpdateRow,
  onDeleteRow,
}) {
  const [editName, setEditName] = useState(false);
  const [tmpName, setTmpName] = useState(plantelKey);

  useEffect(() => {
    setTmpName(plantelKey);
  }, [plantelKey]);

  const total = rows.length;
  const filled = rows.filter((r) => {
    const role = (r.Role || "").toString().trim().toUpperCase();
    const name = (r.Name || "").toString().trim();
    const phone = normalizePhoneInput(r.Phone || r.ID || "");
    return ROLE_OPTIONS.includes(role) && !!name && isValidPhone(phone);
  }).length;

  return (
    <section className="card p-4 sm:p-5">
      <header className="flex flex-wrap items-center gap-2 mb-3">
        {editName ? (
          <input
            className="input font-mono"
            value={tmpName}
            onChange={(e) => setTmpName(e.target.value)}
            onBlur={() => {
              setEditName(false);
              if (tmpName && tmpName.trim() && tmpName !== plantelKey) {
                onRename(tmpName.trim());
              } else {
                setTmpName(plantelKey);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              else if (e.key === "Escape") {
                setEditName(false);
                setTmpName(plantelKey);
              }
            }}
            autoFocus
          />
        ) : (
          <button
            type="button"
            className="font-extrabold text-cyan-900 hover:text-fuchsia-700 transition"
            onClick={() => setEditName(true)}
            title="Renombrar plantel"
          >
            {plantelKey}
          </button>
        )}

        <span className="badge bg-cyan-50 border border-cyan-200 text-cyan-800 ml-auto">
          {filled}/{total} contactos completos
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="btn-secondary"
            onClick={onAddAdmon}
            title="Agregar ADMON"
          >
            <PlusCircleIcon className="w-4 h-4" />
            ADMON
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onAddPrincipal}
            title="Agregar PRINCIPAL"
          >
            <PlusCircleIcon className="w-4 h-4" />
            PRINCIPAL
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={onDelete}
            title="Eliminar plantel"
          >
            <TrashIcon className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-2">
        {rows.length === 0 && (
          <div className="text-xs text-slate-500 text-center py-3 border border-cyan-100 rounded-lg">
            Sin contactos. Usa los botones “ADMON” o “PRINCIPAL” para agregar.
          </div>
        )}
        {rows.map((row, idx) => (
          <RowEditor
            key={`${plantelKey}-${idx}`}
            row={row}
            onChange={(field, value) => onUpdateRow(idx, field, value)}
            onDelete={() => onDeleteRow(idx)}
          />
        ))}
      </div>
    </section>
  );
}

function RowEditor({ row, onChange, onDelete }) {
  const role = (row.Role || "").toString().trim().toUpperCase();
  const name = row.Name || "";
  const phoneDigits = (row.Phone && row.Phone.toString()) || "";
  const id = phoneDigits ? computeIdFromPhone(phoneDigits) : "";
  const phoneOk = !phoneDigits || isValidPhone(phoneDigits);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center rounded-xl border border-cyan-100 bg-gradient-to-br from-white to-cyan-50/40 p-2">
      <div className="sm:col-span-1">
        <label className="text-[11px] font-semibold text-cyan-700">Rol</label>
        <select
          className="input mt-1"
          value={role}
          onChange={(e) => onChange("Role", e.target.value)}
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <label className="text-[11px] font-semibold text-cyan-700">Nombre</label>
        <input
          className="input mt-1"
          value={name}
          placeholder="Nombre completo"
          onChange={(e) => onChange("Name", e.target.value)}
        />
      </div>

      <div className="sm:col-span-1">
        <label className="text-[11px] font-semibold text-cyan-700">Teléfono</label>
        <input
          className={`input mt-1 ${phoneOk ? "" : "border-red-300 bg-red-50"}`}
          value={phoneDigits}
          placeholder="Sólo dígitos"
          onChange={(e) => onChange("Phone", e.target.value)}
        />
        {!phoneOk && (
          <div className="text-[11px] text-red-700 mt-1">
            8-15 dígitos requeridos
          </div>
        )}
      </div>

      <div className="sm:col-span-1">
        <label className="text-[11px] font-semibold text-cyan-700">ID WhatsApp</label>
        <div className="input mt-1 bg-slate-50 border-slate-200 font-mono text-xs">
          {id || "—"}
        </div>
        <div className="flex items-center justify-end mt-2">
          <button
            className="btn-danger"
            onClick={onDelete}
            title="Eliminar contacto"
            type="button"
          >
            <TrashIcon className="w-4 h-4" />
            Quitar
          </button>
        </div>
      </div>
    </div>
  );
}
