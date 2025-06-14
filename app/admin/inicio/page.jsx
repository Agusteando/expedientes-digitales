
import { getSessionFromCookies } from "@/lib/auth";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import AdminNav from "@/components/admin/AdminNav";
import AdminDashboardStats from "@/components/admin/AdminDashboardStats";
import PlantelAdminMatrix from "@/components/admin/PlantelAdminMatrix";
import PlantelAssignmentTable from "@/components/admin/PlantelAssignmentTable";
import PlantelStatsCard from "@/components/admin/PlantelStatsCard";
import PlantelEmployeeProgressTable from "@/components/admin/PlantelEmployeeProgressTable";
import { fetchAllPlantelStats, fetchUnassignedUsers } from "@/lib/admin/plantelStats";

// Returns absolute URL for server-side fetch (required in Server Actions)
async function getAbsoluteUrl(path) {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  return `${proto}://${host}${path}`;
}

// Canonical admin dashboard for both admin and superadmin roles.

export default async function AdminInicioPage(props) {
  const cookiesInstance = await cookies();
  const session = await getSessionFromCookies(cookiesInstance); // <-- FIX: await

  let searchParams = props.searchParams;
  if (searchParams && typeof searchParams.then === "function") {
    searchParams = await searchParams;
  }
  searchParams = searchParams || {};

  const forceAdminView = searchParams.adminview === "1";

  if (!session || !["admin", "superadmin"].includes(session.role)) {
    redirect("/admin/login");
  }

  // Data loading
  // 1. Planteles with admins (for matrix & permissions)
  const plantelesFull = await prisma.plantel.findMany({
    include: { admins: { select: { id: true, name: true, email: true } } },
    orderBy: { name: "asc" }
  });

  // 2. All admin/superadmin users
  const admins = await prisma.user.findMany({
    where: { role: { in: ["admin", "superadmin"] } },
    include: { plantelesAdmin: { select: { id: true } } },
    orderBy: { name: "asc" }
  });

  // 3. All plantel stats (for cards/tables)
  const allPlantelStats = await fetchAllPlantelStats();

  // 4. Unassigned users for assignment table (always fetch all; restrict below)
  const unassignedUsers = await fetchUnassignedUsers();

  // --- Role handling
  let plantelData;
  if (session.role === "superadmin" && !forceAdminView) {
    // Superadmin: see all
    plantelData = allPlantelStats;
  } else {
    // Admin (or superadmin as admin): see only planteles they manage (by plantelesAdminIds)
    const ids = session.plantelesAdminIds || [];
    plantelData = allPlantelStats.filter(p => ids.includes(p.id));
  }

  // Aggregate stats
  let totalUsers = 0, completedExpedientes = 0, totalPlanteles = plantelData.length;
  plantelData.forEach(p => {
    totalUsers += p.progress.total;
    completedExpedientes += p.progress.completed;
  });
  const percentComplete = totalUsers === 0 ? 0 : Math.round((completedExpedientes / totalUsers) * 100);

  // Top summaries for superadmin dashboard
  const showSuperImpersonating = session.role === "superadmin" && forceAdminView;

  // Assignment actions (server actions use absolute URLs!)
  async function assignAdminToPlantel(adminId, plantelId, assigned) {
    "use server";
    const url = await getAbsoluteUrl(`/api/admin/planteles/${plantelId}/assign-admin`);
    const res = await fetch(
      url,
      {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUserId: adminId,
          action: assigned ? "remove" : "add"
        }),
        cache: "no-store",
      }
    );
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data?.error || "Error asignando admin.");
    }
    return true;
  }

  async function assignUsersToPlantel(assignBatch, plantelId) {
    "use server";
    const url = await getAbsoluteUrl(`/api/admin/users/assign-plantel`);
    const res = await fetch(
      url,
      {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: assignBatch.map(u => u.id),
          plantelId
        }),
        cache: "no-store",
      }
    );
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data?.error || "No se pudo asignar usuarios.");
    }
    return true;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf6fe] via-[#dbf3de] to-[#e2f8fe] flex flex-col items-center pt-24 px-2">
      <AdminNav session={session} />
      <div className="w-full max-w-7xl mt-20">
        {showSuperImpersonating && (
          <div className="text-sm px-4 py-2 my-2 rounded bg-cyan-100 text-cyan-800 font-bold border border-cyan-200 shadow">
            Vista limitada: Modo administrador de plantel (estás en modo superadmin)
          </div>
        )}
        {/* Core stats always visible */}
        <AdminDashboardStats
          summary={{
            totalUsers,
            completedExpedientes,
            totalPlanteles,
            percentComplete,
          }}
        />

        {/* Superadmin: show full matrix (and all unassigned users) */}
        {session.role === "superadmin" && !forceAdminView && (
          <>
            <PlantelAdminMatrix
              planteles={plantelesFull}
              admins={admins}
              onAssign={assignAdminToPlantel}
            />
            <PlantelAssignmentTable
              users={unassignedUsers}
              planteles={plantelesFull}
              onAssign={assignUsersToPlantel}
              assignLoading={false}
              compact
              showSuggested
            />
          </>
        )}

        {/* Admins (or superadmin in admin impersonation mode): show assignment for only their users */}
        {((session.role === "admin") || showSuperImpersonating) && (
          <PlantelAssignmentTable
            users={unassignedUsers.filter(u => u.plantelId === null)}
            planteles={plantelData}
            onAssign={assignUsersToPlantel}
            assignLoading={false}
            compact
            showSuggested={false}
          />
        )}

        {/* Plantel stats cards */}
        <div className="grid xs:grid-cols-2 md:grid-cols-3 gap-3 w-full mt-5">
          {plantelData.map(plantel =>
            <PlantelStatsCard key={plantel.id} plantel={plantel} />
          )}
        </div>

        {/* Employee progress by plantel */}
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
    </div>
  );
}
