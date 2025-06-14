
import { getSessionFromCookies } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import PlantelesSuperadminPanel from "@/components/admin/PlantelesSuperadminPanel";
import AdminAssignmentPanel from "@/components/admin/AdminAssignmentPanel";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { fetchAllPlantelStats, fetchUnassignedUsers } from "@/lib/admin/plantelStats";

export default async function SuperadminInicioPage() {
  const cookiesInstance = cookies();
  const session = getSessionFromCookies(cookiesInstance);

  if (!session || session.role !== "superadmin") {
    redirect("/admin/login");
  }

  // List planteles WITH admins
  const planteles = await prisma.plantel.findMany({
    include: { admins: { select: { id: true, name: true } } },
    orderBy: { name: "asc" }
  });

  const admins = await prisma.user.findMany({
    where: { role: { in: ["admin", "superadmin"] } },
    include: { plantelesAdmin: { select: { id: true } } },
    orderBy: { name: "asc" }
  });

  // Standard stats for dashboard
  const plantelData = await fetchAllPlantelStats();
  const unassignedUsers = await fetchUnassignedUsers();

  let totalUsers = 0, completedExpedientes = 0, totalPlanteles = plantelData.length;
  plantelData.forEach(p => {
    totalUsers += p.progress.total;
    completedExpedientes += p.progress.completed;
  });
  const percentComplete = totalUsers === 0 ? 0 : Math.round((completedExpedientes / totalUsers) * 100);

  // Inline client refresh for subpanels:
  const refresh = () => { "use client"; window.location.reload(); };

  return (
    <div>
      <PlantelesSuperadminPanel planteles={planteles} admins={admins} refresh={refresh} />
      <AdminAssignmentPanel admins={admins} planteles={planteles} refresh={refresh} />
      <AdminDashboardClient
        session={session}
        plantelData={plantelData}
        unassignedUsers={unassignedUsers}
        summary={{
          totalUsers, completedExpedientes, totalPlanteles, percentComplete,
        }}
      />
    </div>
  );
}
