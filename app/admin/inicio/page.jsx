
import { getSessionFromCookies } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { fetchAllPlantelStats, fetchUnassignedUsers } from "@/lib/admin/plantelStats";

export default async function AdminInicioPage() {
  const cookiesInstance = cookies();
  const session = getSessionFromCookies(cookiesInstance);

  if (!session || !["admin", "superadmin"].includes(session.role)) {
    redirect("/admin/login");
  }

  // Always fetch fresh data server-side!
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
