
import { getSessionFromCookies } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import AdminNav from "@/components/admin/AdminNav";
import { fetchAllPlantelStats, fetchUnassignedUsers } from "@/lib/admin/plantelStats";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";

export default async function AdminInicioPage({ searchParams }) {
  const cookiesInstance = cookies();
  const session = getSessionFromCookies(cookiesInstance);
  const forceAdminView = searchParams?.adminview === "1";

  if (!session || !["admin", "superadmin"].includes(session.role)) {
    redirect("/admin/login");
  }

  // --- DATA LOADING ---
  const plantelDataFull = await fetchAllPlantelStats();
  const unassignedUsers = await fetchUnassignedUsers();

  // --- ADMIN DASHBOARD VIEW (including superadmin in admin mode) ---
  const plantelData = session.role === "superadmin" && !forceAdminView
    ? plantelDataFull // superadmin: all planteles
    : plantelDataFull.filter(p =>
        (session.plantelesAdminIds || []).includes(p.id)
      );

  let totalUsers = 0, completedExpedientes = 0, totalPlanteles = plantelData.length;
  plantelData.forEach(p => {
    totalUsers += p.progress.total;
    completedExpedientes += p.progress.completed;
  });
  const percentComplete = totalUsers === 0 ? 0 : Math.round((completedExpedientes / totalUsers) * 100);

  // Superadmin preview banner
  const showSuperImpersonating = session.role === "superadmin" && forceAdminView;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf6fe] via-[#dbf3de] to-[#e2f8fe] flex flex-col items-center pt-24 px-2">
      <AdminNav session={session} />
      <div className="w-full max-w-6xl mt-20">
        {showSuperImpersonating && (
          <div className="text-sm px-4 py-2 my-2 rounded bg-cyan-100 text-cyan-800 font-bold border border-cyan-200 shadow">
            Vista limitada: Modo administrador de plantel (estás en modo superadmin)
          </div>
        )}
        <AdminDashboardClient
          session={session}
          plantelData={plantelData}
          unassignedUsers={session.role === "superadmin" && !forceAdminView ? unassignedUsers : []}
          summary={{
            totalUsers, completedExpedientes, totalPlanteles, percentComplete,
          }}
        />
      </div>
    </div>
  );
}
