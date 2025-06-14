
import { getSessionFromCookies } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import PlantelesSuperadminPanel from "@/components/admin/PlantelesSuperadminPanel";
import AdminAssignmentPanel from "@/components/admin/AdminAssignmentPanel";
import AdminDashboardStats from "@/components/admin/AdminDashboardStats";
import PlantelStatsCard from "@/components/admin/PlantelStatsCard";
import PlantelEmployeeProgressTable from "@/components/admin/PlantelEmployeeProgressTable";
import { fetchAllPlantelStats } from "@/lib/admin/plantelStats";

// Superadmin dashboard: cleanly organized, only relevant superadmin UI.

export default async function SuperadminInicioPage() {
  const cookiesInstance = cookies();
  const session = getSessionFromCookies(cookiesInstance);

  if (!session || session.role !== "superadmin") {
    redirect("/admin/login");
  }

  // Planteles WITH admins
  const planteles = await prisma.plantel.findMany({
    include: { admins: { select: { id: true, name: true } } },
    orderBy: { name: "asc" }
  });

  const admins = await prisma.user.findMany({
    where: { role: { in: ["admin", "superadmin"] } },
    include: { plantelesAdmin: { select: { id: true } } },
    orderBy: { name: "asc" }
  });

  // Plantel/user/progress stats
  const plantelData = await fetchAllPlantelStats();

  // Summary aggregates
  let totalUsers = 0, completedExpedientes = 0, totalPlanteles = plantelData.length;
  plantelData.forEach(p => {
    totalUsers += p.progress.total;
    completedExpedientes += p.progress.completed;
  });
  const percentComplete = totalUsers === 0 ? 0 : Math.round((completedExpedientes / totalUsers) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf6fe] via-[#dbf3de] to-[#e2f8fe] flex flex-col items-center pt-24 px-2">
      <div className="w-full max-w-7xl">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mt-6 mb-2 px-1">
          <h1 className="text-2xl font-bold text-purple-900">Panel de Administración (Superadmin)</h1>
        </div>

        {/* 1. Stats at top */}
        <AdminDashboardStats
          summary={{
            totalUsers,
            completedExpedientes,
            totalPlanteles,
            percentComplete,
          }}
        />

        {/* 2. Plantel/manage panel */}
        <PlantelesSuperadminPanel planteles={planteles} admins={admins} />

        {/* 3. Admin assignment to planteles */}
        <AdminAssignmentPanel admins={admins} planteles={planteles} />

        {/* 4. Plantel progress cards */}
        <div className="grid xs:grid-cols-2 md:grid-cols-3 gap-3 w-full mt-5">
          {plantelData.map(plantel =>
            <PlantelStatsCard key={plantel.id} plantel={plantel} />
          )}
        </div>

        {/* 5. Employees progress by plantel */}
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
