
"use client";
import AdminDashboardStats from "@/components/admin/AdminDashboardStats";
import PlantelAssignmentTable from "@/components/admin/PlantelAssignmentTable";
import PlantelCreateModal from "@/components/admin/PlantelCreateModal";
import PlantelStatsCard from "@/components/admin/PlantelStatsCard";
import PlantelEmployeeProgressTable from "@/components/admin/PlantelEmployeeProgressTable";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboardClient({ session, plantelData, unassignedUsers, summary }) {
  const router = useRouter();
  const [createLoading, setCreateLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

  // Mutations: plantel creation, user assignment
  async function handleCreatePlantel(name) {
    setCreateLoading(true);
    try {
      const res = await fetch("/api/admin/planteles/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error");
      router.refresh();
    } finally {
      setCreateLoading(false);
    }
  }
  async function handleAssignUsers(assignBatch, plantelId) {
    setAssignLoading(true);
    try {
      const res = await fetch("/api/admin/users/assign-plantel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: assignBatch.map(u => u.id),
          plantelId,
        }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } finally {
      setAssignLoading(false);
    }
  }

  return (
    <div className="w-full">
      {/* Only ONE header/stats section */}
      <div className="flex flex-row justify-between items-center mb-2 px-1">
        <h1 className="text-2xl font-bold text-purple-900">
          Panel de Administración {session.role === "superadmin" ? "" : ""}
        </h1>
        {/* Only superadmin: can create new plantel */}
        {session.role === "superadmin" &&
          <PlantelCreateModal
            onCreate={handleCreatePlantel}
            onCreated={() => router.refresh()}
            isLoading={createLoading}
          />
        }
      </div>
      <AdminDashboardStats summary={summary} />
      <PlantelAssignmentTable
        users={unassignedUsers}
        planteles={plantelData}
        onAssign={handleAssignUsers}
        assignLoading={assignLoading}
      />
      {/* Overview cards per plantel */}
      <div className="grid xs:grid-cols-2 md:grid-cols-3 gap-3 w-full mt-5">
        {plantelData.map(plantel =>
          <PlantelStatsCard key={plantel.id} plantel={plantel} />
        )}
      </div>
      {/* Employees per plantel */}
      <div className="pt-7 w-full">
        <h2 className="text-xl font-bold text-cyan-700 pb-3">Progreso de empleados por plantel</h2>
        {plantelData.map(plantel =>
          <div key={plantel.id} className="mb-8 border-b border-cyan-100 pb-6">
            <div className="font-bold text-base text-cyan-800 mb-2">{plantel.name}</div>
            <PlantelEmployeeProgressTable employees={plantel.employees} />
          </div>
        )}
      </div>
    </div>
  );
}
