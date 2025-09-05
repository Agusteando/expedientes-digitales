
import { useEffect, useMemo, useState } from "react";

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

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setWorking(true);
        const r = await fetch("/api/contacts");
        const j = await r.json();
        if (!ignore) {
          if (j.ok) {
            const contacts = j.contacts || {};
            setData({ contacts, path: j.path || "" });
            setErrMsg("");
          } else {
            setErrMsg(j.error || "Failed to load.");
          }
        }
      } catch (e) {
        if (!ignore) setErrMsg("Failed to load.");
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
        issues.push(`A plantel has an empty key.`);
      }
      rows.forEach((row, idx) => {
        const role = (row.Role || "").toString().trim().toUpperCase();
        const name = (row.Name || "").toString().trim();
        const phone = normalizePhoneInput(row.Phone || row.ID || "");
        if (!ROLE_OPTIONS.includes(role)) {
          issues.push(`${plantel}[${idx}] Role must be one of ${ROLE_OPTIONS.join(", ")}.`);
        }
        if (!name) {
          issues.push(`${plantel}[${idx}] Name is required.`);
        }
        if (!phone) {
          issues.push(`${plantel}[${idx}] Phone is required.`);
        } else if (!isValidPhone(phone)) {
          issues.push(`${plantel}[${idx}] Phone must be 8-15 digits (got ${phone.length}).`);
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
        next.contacts[newName] = [...(next.contacts[newName] || []), ...(next.contacts[oldKey] || [])];
      } else {
        next.contacts[newName] = next.contacts[oldKey] || [];
      }
      delete next.contacts[oldKey];
      return next;
    });
  }

  function addPlantel() {
    const name = window.prompt("Nuevo plantel (clave):");
    if (!name) return;
    const key = name.trim();
    if (!key) return;
    setData((prev) => {
      const next = deepClone(prev);
      if (!next.contacts[key]) next.contacts[key] = [];
      return next;
    });
  }

  function deletePlantel(key) {
    if (!window.confirm(`Eliminar plantel "${key}"?`)) return;
    setData((prev) => {
      const next = deepClone(prev);
      delete next.contacts[key];
      return next;
    });
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
      if (!j.ok) throw new Error(j.error || "Save failed.");

      const reload = await fetch("/api/contacts");
      const jj = await reload.json();
      if (jj.ok) setData({ contacts: jj.contacts || {}, path: jj.path || "" });

      setSaveOk(true);
    } catch (e) {
      setErrMsg(e && e.message ? e.message : "Save failed.");
    } finally {
      setWorking(false);
      setTimeout(() => setSaveOk(false), 2500);
    }
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto p-4 font-sans">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-xl font-semibold">Contacts Editor</div>
          <div className="flex-1" />
        </div>
        <div className="text-slate-600 text-sm">{working ? "Loading…" : errMsg ? errMsg : ""}</div>
      </div>
    );
  }

  const { contacts, path } = data;

  return (
    <div className="max-w-7xl mx-auto p-4 font-sans">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="text-xl font-semibold">Contacts Editor</div>
        <div className="text-xs text-slate-600 border border-slate-200 px-2 py-1 rounded">{path || ""}</div>
        <div className="flex-1" />
        <button
          className="rounded-md bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-semibold px-3 py-2 disabled:opacity-50"
          onClick={addPlantel}
          disabled={working}
          type="button"
        >
          Add Plantel
        </button>
        <button
          className="rounded-md bg-black hover:bg-gray-900 text-white text-sm font-semibold px-4 py-2 disabled:opacity-50"
          onClick={saveAll}
          disabled={working || !validation.ok}
          type="button"
        >
          Save
        </button>
      </div>

      {!validation.ok && validation.issues.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 mb-4">
          {validation.issues.map((s, i) => (
            <div key={i} className="text-sm text-amber-900">
              {s}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Object.keys(contacts).map((key) => (
          <PlantelCard
            key={key}
            plantelKey={key}
            rows={contacts[key]}
            onRename={(newKey) => updatePlantelName(key, newKey)}
            onDelete={() => deletePlantel(key)}
            onAddAdmon={() => addContactRow(key, "ADMON")}
            onAddPrincipal={() => addContactRow(key, "PRINCIPAL")}
            onUpdateRow={(idx, field, value) => updateRow(key, idx, field, value)}
            onDeleteRow={(idx) => deleteRow(key, idx)}
          />
        ))}
      </div>

      <div className="mt-4 min-h-[1.75rem] flex items-center gap-3">
        {errMsg && <span className="text-rose-700">{errMsg}</span>}
        {saveOk && <span className="text-emerald-700">Saved.</span>}
      </div>
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

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {editName ? (
          <input
            className="px-3 py-2 rounded-md border border-slate-300 text-sm min-w-[10rem] focus:outline-none focus:ring-2 focus:ring-cyan-500"
            value={tmpName}
            onChange={(e) => setTmpName(e.target.value)}
            onBlur={() => {
              setEditName(false);
              if (tmpName && tmpName.trim() && tmpName !== plantelKey) {
                onRename(tmpName.trim());
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              } else if (e.key === "Escape") {
                setEditName(false);
                setTmpName(plantelKey);
              }
            }}
            autoFocus
          />
        ) : (
          <button
            type="button"
            className="font-semibold text-slate-800 hover:text-cyan-700"
            onClick={() => setEditName(true)}
            title="Click to rename"
          >
            {plantelKey}
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold px-3 py-1"
            onClick={onAddAdmon}
            title="Add ADMON"
          >
            + ADMON
          </button>
          <button
            type="button"
            className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold px-3 py-1"
            onClick={onAddPrincipal}
            title="Add PRINCIPAL"
          >
            + PRINCIPAL
          </button>
          <button
            type="button"
            className="rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1"
            onClick={onDelete}
            title="Delete Plantel"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {rows.map((row, idx) => {
          const phoneDigits = (row.Phone && row.Phone.toString()) || "";
          const id = phoneDigits ? computeIdFromPhone(phoneDigits) : "";
          const phoneOk = !phoneDigits || isValidPhone(phoneDigits);
          return (
            <div
              className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center bg-slate-50 border border-slate-200 rounded-lg p-2"
              key={idx}
            >
              <select
                className="sm:col-span-1 rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
                value={(row.Role || "").toString().toUpperCase()}
                onChange={(e) => onUpdateRow(idx, "Role", e.target.value)}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <input
                className="sm:col-span-2 rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
                value={row.Name || ""}
                placeholder="Name"
                onChange={(e) => onUpdateRow(idx, "Name", e.target.value)}
              />

              <input
                className={[
                  "sm:col-span-1 rounded-md border px-3 py-2 text-sm bg-white",
                  phoneOk ? "border-slate-300" : "border-rose-400 bg-rose-50",
                ].join(" ")}
                value={phoneDigits}
                placeholder="Phone (digits only)"
                onChange={(e) => onUpdateRow(idx, "Phone", e.target.value)}
              />

              <div className="sm:col-span-1 flex items-center gap-2">
                <input
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-slate-100"
                  value={id}
                  readOnly
                />
                <button
                  type="button"
                  className="rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-bold px-3 py-2"
                  onClick={() => onDeleteRow(idx)}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
