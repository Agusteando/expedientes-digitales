
import { getSessionFromCookies } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchAllPlantelStats, fetchUnassignedUsers } from "@/lib/admin/plantelStats";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";

export default async function AdminInicioPage() {
  const cookiesInstance = cookies();
  const session = getSessionFromCookies(cookiesInstance);

  if (!session || !["admin", "superadmin"].includes(session.role)) {
    redirect("/admin/login");
  }
  // If superadmin, redirect to superadmin dashboard
  if (session.role === "superadmin") {
    redirect("/admin/inicio/superadmin");
  }

  // Only planteles they administer
  const plantelDataFull = await fetchAllPlantelStats();
  const plantelData = plantelDataFull.filter(p =>
    (session.plantelesAdminIds || []).includes(p.id)
  );
  const unassignedUsers = []; // Admin can't assign new users

  let totalUsers = 0, completedExpedientes = 0, totalPlanteles = plantelData.length;
  plantelData.forEach(p => {
    totalUsers += p.progress.total;
    completedExpedientes += p.progress.completed;
  });
  const percentComplete = totalUsers === 0 ? 0 : Math.round((completedExpedientes / totalUsers) * 100);

  return (
    <AdminDashboardClient
      session={session}
      plantelData={plantelData}
      unassignedUsers={unassignedUsers}
      summary={{
        totalUsers, completedExpedientes, totalPlanteles, percentComplete,
      }}
    />
  );
}
