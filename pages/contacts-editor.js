
import { useEffect, useState } from "react";

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

// Non-hook pure validation helper (avoids rules-of-hooks warnings)
function validateContactsData(data) {
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

  const validation = validateContactsData(data);

  function updatePlantelName(oldKey, newKey) {
    if (!data) return;
    const newName = (newKey || "").trim();
    if (!newName) return; // do nothing
    if (oldKey === newName) return;
    setData((prev) => {
      const next = deepClone(prev);
      if (next.contacts[newName]) {
        // merge (append) if already exists
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
        row.ID = computeIdFromPhone(row.Phone);
      } else if (field === "Role") {
        row.Role = value.toUpperCase();
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
      // Build payload
      const toSend = {};
      for (const plantel of Object.keys(data.contacts || {})) {
        const rows = data.contacts[plantel] || [];
        toSend[plantel] = rows.map((r) => {
          const phone = normalizePhoneInput(r.Phone || r.ID || "");
          return {
            Role: (r.Role || "").toString().trim().toUpperCase(),
            Name: (r.Name || "").toString().trim(),
            Phone: phone, // Server will convert to ID=@c.us and persist only Role/ID/Name
          };
        });
      }

      const resp = await fetch("/api/contacts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: toSend }),
      });
      const j = await resp.json();
      if (!j.ok) {
        throw new Error(j.error || "Save failed.");
      }

      // Refresh from server after save to ensure canonical shape
      const reload = await fetch("/api/contacts");
      const jj = await reload.json();
      if (jj.ok) {
        setData({ contacts: jj.contacts || {}, path: jj.path || "" });
      }

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
      <div className="wrap">
        <div className="bar">
          <div className="title">Contacts Editor</div>
          <div className="spacer" />
        </div>
        <div className="status">{working ? "Loading…" : errMsg ? errMsg : ""}</div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  const { contacts, path } = data;

  return (
    <div className="wrap">
      <div className="bar">
        <div className="title">Contacts Editor</div>
        <div className="path">{path || ""}</div>
        <div className="spacer" />
        <button className="secondary" onClick={addPlantel} disabled={working}>
          Add Plantel
        </button>
        <button className="primary" onClick={saveAll} disabled={working || !validation.ok}>
          Save
        </button>
      </div>

      {!validation.ok && validation.issues.length > 0 && (
        <div className="issues">
          {validation.issues.map((s, i) => (
            <div key={i} className="issue">
              {s}
            </div>
          ))}
        </div>
      )}

      <div className="grid">
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

      <div className="footer">
        {errMsg && <span className="error">{errMsg}</span>}
        {saveOk && <span className="ok">Saved.</span>}
      </div>

      <style jsx>{styles}</style>
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
    <div className="card">
      <div className="cardHead">
        {editName ? (
          <input
            className="plantelInput"
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
          <div className="plantelName" onDoubleClick={() => setEditName(true)} title="Double-click to rename">
            {plantelKey}
          </div>
        )}

        <div className="headActions">
          <button className="chip" onClick={onAddAdmon} title="Add ADMON">
            + ADMON
          </button>
          <button className="chip" onClick={onAddPrincipal} title="Add PRINCIPAL">
            + PRINCIPAL
          </button>
          <button className="danger" onClick={onDelete} title="Delete Plantel">
            Delete
          </button>
        </div>
      </div>

      <div className="rows">
        {rows.map((row, idx) => {
          const phoneDigits = (row.Phone && row.Phone.toString()) || "";
          const id = phoneDigits ? computeIdFromPhone(phoneDigits) : "";
          return (
            <div className="row" key={idx}>
              <select
                className="role"
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
                className="name"
                value={row.Name || ""}
                placeholder="Name"
                onChange={(e) => onUpdateRow(idx, "Name", e.target.value)}
              />

              <input
                className={`phone ${!phoneDigits ? "" : isValidPhone(phoneDigits) ? "" : "bad"}`}
                value={phoneDigits}
                placeholder="Phone (digits only)"
                onChange={(e) => onUpdateRow(idx, "Phone", e.target.value)}
              />

              <input className="id" value={id} readOnly />

              <button className="danger small" onClick={() => onDeleteRow(idx)} title="Remove">
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = `
.wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
}
.bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.title {
  font-size: 20px;
  font-weight: 600;
}
.path {
  font-size: 12px;
  color: #666;
  border: 1px solid #e3e3e3;
  padding: 2px 6px;
  border-radius: 4px;
}
.spacer { flex: 1; }
.primary, .secondary, .danger, .chip {
  border: 0;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
}
.primary { background: #111; color: #fff; }
.secondary { background: #eee; }
.chip { background: #f2f2f2; }
.danger { background: #ffebeb; color: #b00020; }
.small { padding: 4px 8px; }
.status {
  color: #555;
  font-size: 14px;
}
.issues {
  background: #fff7e6;
  border: 1px solid #ffd28c;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 12px;
}
.issue { font-size: 13px; margin: 4px 0; }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(460px, 1fr));
  gap: 16px;
}
.card {
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  padding: 12px;
  background: #fff;
}
.cardHead {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.plantelName {
  font-weight: 600;
  cursor: default;
  user-select: none;
}
.plantelInput {
  font-size: 14px;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  min-width: 180px;
}
.headActions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}
.rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.row {
  display: grid;
  grid-template-columns: 120px 1fr 160px 1fr 40px;
  gap: 8px;
  align-items: center;
}
.role, .name, .phone, .id {
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}
.phone.bad { border-color: #d93025; background: #fff0f0; }
.id {
  background: #fafafa;
}
.footer {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  align-items: center;
  min-height: 28px;
}
.error { color: #b00020; }
.ok { color: #0a7d00; }
`;
