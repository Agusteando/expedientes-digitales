
"use client";
import { useState } from "react";

/**
 * PlantelAdminMatrix - superadmin only!
 * Shows a grid of all admins (rows) and all planteles (columns).
 * Superadmin can assign/unassign planteles to/from each admin with a checkbox.
 */
export default function PlantelAdminMatrix({
  admins = [],
  planteles = []
}) {
  const [state, setState] = useState({});
  const [loading, setLoading] = useState({}); // adminId: { [plantelId]: boolean }
  const [feedback, setFeedback] = useState(""); // global or last action

  function isChecked(admin, plantelId) {
    // Use pending state if changed, otherwise use original assignments
    if (state[admin.id] && state[admin.id][plantelId] !== undefined)
      return state[admin.id][plantelId];
    return admin.plantelesAdmin.some(p => p.id === plantelId);
  }

  async function handleToggle(adminId, plantelId, checked) {
    setLoading(l => ({
      ...l,
      [adminId]: { ...(l[adminId] || {}), [plantelId]: true }
    }));
    setFeedback("");
    try {
      const res = await fetch(`/api/admin/planteles/${plantelId}/assign-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUserId: adminId, action: checked ? "add" : "remove" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar");
      setState(s => ({
        ...s,
        [adminId]: { ...(s[adminId] || {}), [plantelId]: checked }
      }));
      setFeedback("Asignación actualizada.");
    } catch (e) {
      setFeedback(e.message || "Error al asignar.");
    }
    setLoading(l => ({
      ...l,
      [adminId]: { ...(l[adminId] || {}), [plantelId]: false }
    }));
  }

  return (
    <section className="bg-white border border-fuchsia-200 shadow-xl rounded-2xl p-4 mb-8 mt-9">
      <h2 className="text-xl font-bold text-fuchsia-900 mb-2 flex items-center gap-2">
        Administradores de plantel y permisos
      </h2>
      <div className="mb-2 text-sm text-fuchsia-800">
        Asigna qué administradores pueden gestionar cada plantel (sólo superadmin).
      </div>
      {feedback && (
        <div className="text-sm rounded bg-fuchsia-50 px-3 py-1 mb-2 border border-fuchsia-100 text-fuchsia-700">{feedback}</div>
      )}
      <div className="overflow-x-auto w-full mt-1">
        <table className="min-w-full table-auto border rounded-xl text-xs md:text-sm">
          <thead>
            <tr>
              <th className="py-2 px-2 text-left font-bold bg-fuchsia-50 border-b border-fuchsia-100">Admin</th>
              {planteles.map(p => (
                <th key={p.id} className="py-2 px-3 text-center font-bold bg-fuchsia-50 border-b border-fuchsia-100">{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {admins.map(admin =>
              <tr key={admin.id} className="border-b border-fuchsia-50">
                <td className="py-2 px-2 font-bold text-fuchsia-900">
                  <div className="flex flex-col gap-0.5">
                    <span>{admin.name}</span>
                    <span className="text-xs text-slate-400">{admin.email}</span>
                  </div>
                </td>
                {planteles.map(p =>
                  <td key={p.id} className="py-2 px-2 text-center align-middle">
                    <input
                      type="checkbox"
                      className="accent-fuchsia-500 w-5 h-5"
                      checked={isChecked(admin, p.id)}
                      disabled={!!(loading[admin.id]?.[p.id])}
                      onChange={e =>
                        handleToggle(admin.id, p.id, e.target.checked)
                      }
                      aria-label={`Asignar ${admin.name} al plantel ${p.name}`}
                    />
                  </td>
                )}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
