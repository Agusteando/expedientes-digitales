
"use client";
import { useState } from "react";
import { UserIcon, BuildingLibraryIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export default function AdminAssignmentPanel({ admins, planteles }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function changeAssignment(adminId, plantelId, assigned) {
    setError("");
    try {
      await fetch(`/api/admin/planteles/${plantelId}/assign-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUserId: adminId,
          action: assigned ? "remove" : "add"
        }),
      });
      router.refresh();
    } catch {
      setError("Error en la asignación.");
    }
  }

  return (
    <section className="my-6 bg-white border rounded-2xl shadow p-4">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
        <UserIcon className="w-5 h-6 text-purple-700" />
        Asignar admins a planteles (superadmin)
      </h2>
      {error && <div className="mb-2 text-red-700 font-semibold">{error}</div>}
      <table className="w-full table-auto text-xs sm:text-sm">
        <thead>
          <tr>
            <th>Admin</th>
            {planteles.map(p => (
              <th key={p.id}><span className="flex gap-1 items-center"><BuildingLibraryIcon className="w-3 h-3" />{p.name}</span></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {admins.map(a => (
            <tr key={a.id}>
              <td className="font-semibold">{a.name} <span className="text-xs text-slate-500">{a.role}</span></td>
              {planteles.map(p => {
                const assigned = a.plantelesAdmin?.some(pa => pa.id === p.id);
                return (
                  <td key={p.id} className="text-center">
                    <input
                      type="checkbox"
                      checked={assigned}
                      onChange={() => changeAssignment(a.id, p.id, assigned)}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
