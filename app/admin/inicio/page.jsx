
import { cookies } from "next/headers";
import { getSessionFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import AdminNav from "@/components/admin/AdminNav";
import AdminDashboardStats from "@/components/admin/AdminDashboardStats";
import PlantelAdminMatrix from "@/components/admin/PlantelAdminMatrix";
import PlantelAssignmentTable from "@/components/admin/PlantelAssignmentTable";
import PlantelStatsCard from "@/components/admin/PlantelStatsCard";
import PlantelEmployeeProgressTable from "@/components/admin/PlantelEmployeeProgressTable";
import { fetchAllPlantelStats, fetchUnassignedUsers } from "@/lib/admin/plantelStats";
import PlantelListAdminPanelClient from "@/components/admin/PlantelListAdminPanelClient";

export default async function AdminInicioPage({ searchParams }) {
  const cookiesStore = await cookies();
  const session = await getSessionFromCookies(cookiesStore);

  // LOG: show what session is just before rendering nav
  console.log("[page.jsx] Server session before <AdminNav />:", session);

  if (!session || !["admin", "superadmin"].includes(session.role)) {
    redirect("/admin/login");
  }

  const sp = await searchParams;
  const spAdminviewVal = sp?.adminview;
  const forceAdminView = spAdminviewVal === "1";

  const plantelesFull = await prisma.plantel.findMany({
    include: { admins: { select: { id: true, name: true, email: true } } },
    orderBy: { name: "asc" }
  });

  const admins = await prisma.user.findMany({
    where: { role: { in: ["admin", "superadmin"] } },
    include: { plantelesAdmin: { select: { id: true } } },
    orderBy: { name: "asc" }
  });

  const allPlantelStats = await fetchAllPlantelStats();
  const unassignedUsers = await fetchUnassignedUsers();

  let plantelData;
  if (session.role === "superadmin" && !forceAdminView) {
    plantelData = allPlantelStats;
  } else {
    const ids = session.plantelesAdminIds || [];
    plantelData = allPlantelStats.filter(p => ids.includes(p.id));
  }

  let totalUsers = 0, completedExpedientes = 0, totalPlanteles = plantelData.length;
  plantelData.forEach(p => {
    totalUsers += p.progress.total;
    completedExpedientes += p.progress.completed;
  });
  const percentComplete = totalUsers === 0 ? 0 : Math.round((completedExpedientes / totalUsers) * 100);

  const showSuperImpersonating = session.role === "superadmin" && forceAdminView;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf6fe] via-[#dbf3de] to-[#e2f8fe] flex flex-col items-center pt-24 px-2">
      <AdminNav session={session} />
      <div className="w-full max-w-7xl mt-20">
        {showSuperImpersonating && (
          <div className="text-sm px-4 py-2 my-2 rounded bg-cyan-100 text-cyan-800 font-bold border border-cyan-200 shadow">
            Vista limitada: Modo administrador de plantel (estás en modo superadmin)
          </div>
        )}

        <AdminDashboardStats
          summary={{
            totalUsers,
            completedExpedientes,
            totalPlanteles,
            percentComplete,
          }}
        />

        {/* Superadmin Plantel CRUD UI */}
        {session.role === "superadmin" && !forceAdminView && (
          <>
            <PlantelListAdminPanelClient
              initialPlanteles={plantelesFull}
              onRefresh={null}
            />
            <PlantelAdminMatrix
              planteles={plantelesFull}
              admins={admins}
            />
          </>
        )}

        <div className="grid xs:grid-cols-2 md:grid-cols-3 gap-3 w-full mt-5">
          {plantelData.map(plantel =>
            <PlantelStatsCard key={plantel.id} plantel={plantel} />
          )}
        </div>
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
