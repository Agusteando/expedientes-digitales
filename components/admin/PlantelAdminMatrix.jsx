
"use client";
import { useState, useMemo } from "react";
import { assignAdminToPlantel } from "@/lib/admin-api";
import { UserIcon, ExclamationCircleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export default function PlantelAdminMatrix({ planteles, admins }) {
  const router = useRouter();
  const [localLoading, setLocalLoading] = useState(null);
  const [error, setError] = useState("");

  const assignmentLookup = useMemo(() => {
    const map = {};
    for (const plantel of planteles) {
      map[plantel.id] = new Set(plantel.admins?.map(a => a.id));
    }
    return map;
  }, [planteles]);

  async function handleToggle(adminId, plantelId, assigned) {
    setLocalLoading(`${adminId}:${plantelId}`);
    setError("");
    try {
      await assignAdminToPlantel({ adminId, plantelId, assigned });
      router.refresh();
    } catch (e) {
      setError(e.message || "Error al actualizar asignación");
    }
    setLocalLoading(null);
  }

  // Render as before. Remove onAssign prop; call handleToggle instead in checkbox
  return (
    <section className="mb-8 bg-white border border-cyan-200 shadow-xl rounded-2xl p-4">
      <header className="mb-3 flex flex-col xs:flex-row xs:items-end xs:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
            <UserIcon className="w-6 h-6 text-cyan-600" />
            Asignaciones de Administradores por Plantel
          </h2>
        </div>
      </header>
      {error && <div className="text-red-700 font-semibold mb-2">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full border rounded-xl text-xs sm:text-sm table-auto">
          <thead>
            <tr className="bg-cyan-50 border-b border-cyan-100">
              <th className="px-2 py-1 font-bold text-cyan-900 whitespace-nowrap text-left">Plantel</th>
              {admins.map(admin => (
                <th key={admin.id} className="px-2 py-1 font-bold text-purple-900 whitespace-nowrap text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-xs">{admin.name}</span>
                    <span className="text-[10px] text-slate-400 break-all">{admin.email}</span>
                  </div>
                </th>
              ))}
              <th className="px-2 py-1"></th>
            </tr>
          </thead>
          <tbody>
            {planteles.map(plantel => {
              let styleClass = "bg-white";
              if ((plantel.admins ?? []).length === 0) styleClass = "bg-red-50";
              else if ((plantel.admins ?? []).length === 1) styleClass = "bg-yellow-50";
              else if ((plantel.admins ?? []).length >= 2) styleClass = "bg-emerald-50";
              return (
                <tr key={plantel.id} className={styleClass + " border-b border-cyan-50"}>
                  <td className="px-2 py-2 font-semibold text-cyan-900 whitespace-nowrap">
                    {plantel.name}
                  </td>
                  {admins.map(admin => {
                    const assigned = assignmentLookup[plantel.id]?.has(admin.id);
                    return (
                      <td key={admin.id} className="px-2 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={assigned}
                          onChange={() => handleToggle(admin.id, plantel.id, assigned)}
                          disabled={localLoading === `${admin.id}:${plantel.id}`}
                          className="accent-cyan-600 w-4 h-4"
                          aria-label={`Asignar/quitar ${admin.name} (${admin.email}) a ${plantel.name}`}
                        />
                      </td>
                    );
                  })}
                  <td className="px-2 py-1 text-center"></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-slate-600">
        Puedes asignar o quitar administradores de un plantel haciendo click en las casillas correspondientes.
      </div>
    </section>
  );
}
