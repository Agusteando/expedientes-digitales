
import { getSessionFromCookies } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboardStats from "@/components/admin/AdminDashboardStats";
import PlantelAssignmentTable from "@/components/admin/PlantelAssignmentTable";
import PlantelCreateModal from "@/components/admin/PlantelCreateModal";
import PlantelStatsCard from "@/components/admin/PlantelStatsCard";
import PlantelEmployeeProgressTable from "@/components/admin/PlantelEmployeeProgressTable";
import Image from "next/image";

import { fetchAllPlantelStats, fetchUnassignedUsers } from "@/lib/admin/plantelStats";

export default async function AdminInicioPage() {
  const cookiesInstance = cookies();
  const session = getSessionFromCookies(cookiesInstance);

  if (!session || !["admin", "superadmin"].includes(session.role)) {
    redirect("/admin/login");
  }

  // Fetch all plantel/user progress stats (server-side!)
  const plantelData = await fetchAllPlantelStats();
  const unassignedUsers = await fetchUnassignedUsers();

  // Compute summary aggregates
  let totalUsers = 0, completedExpedientes = 0, totalPlanteles = plantelData.length;
  plantelData.forEach(p => {
    totalUsers += p.progress.total;
    completedExpedientes += p.progress.completed;
  });
  const percentComplete = totalUsers === 0 ? 0 : Math.round((completedExpedientes / totalUsers) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf6fe] via-[#dbf3de] to-[#e2f8fe] flex flex-col items-center pt-24 px-2">
      <nav className="w-full flex items-center justify-between px-6 py-3 bg-white/95 shadow border-b border-purple-100 fixed top-0 left-0 z-30">
        <a href="/" className="font-bold text-xl text-purple-800"> Expedientes Digitales | Admin </a>
        <div className="flex items-center gap-4">
          <span className="text-xs sm:text-sm text-slate-800 font-semibold">{session.name}</span>
          <Image alt="profile" src={session.picture || "/IMAGOTIPO-IECS-IEDIS.png"} width={32} height={32} className="rounded-full bg-slate-100" />
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-full text-xs shadow" title="Cerrar sesión">Cerrar sesión</button>
          </form>
        </div>
      </nav>
      <div className="w-full max-w-6xl">
        <div className="flex flex-row justify-between items-center mt-6 mb-2 px-1">
          <h1 className="text-2xl font-bold text-purple-900">Panel de Administración IECS-IEDIS</h1>
          {session.role === "superadmin" && <PlantelCreateModal />}
        </div>
        <AdminDashboardStats
          summary={{
            totalUsers, totalPlanteles,
            completedExpedientes,
            percentComplete
          }}
        />
        <PlantelAssignmentTable />
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
