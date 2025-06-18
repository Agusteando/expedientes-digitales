
import { cookies } from "next/headers";
import { getSessionFromCookies } from "@/lib/auth";
import prisma from "@/lib/prisma";
import UserManagementPanel from "@/components/admin/UserManagementPanel";
import AdminNav from "@/components/admin/AdminNav";
import AdminDashboardStats from "@/components/admin/AdminDashboardStats";
import PlantelAdminMatrix from "@/components/admin/PlantelAdminMatrix";
import PlantelStatsCard from "@/components/admin/PlantelStatsCard";
import PlantelEmployeeProgressTable from "@/components/admin/PlantelEmployeeProgressTable";
import { fetchAllPlantelStats, fetchUnassignedUsers } from "@/lib/admin/plantelStats";
import PlantelListAdminPanelClient from "@/components/admin/PlantelListAdminPanelClient";
import AssignEmployeesSectionClient from "@/components/admin/AssignEmployeesSectionClient";

export default async function AdminInicioPage({ searchParams }) {
  const cookiesStore = await cookies();
  const session = await getSessionFromCookies(cookiesStore);

  if (!session || !["admin", "superadmin"].includes(session.role)) {
    return (
      <div className="p-10 text-center text-red-700 font-bold">
        No autorizado. Inicia sesión como administrador.
      </div>
    );
  }

  // Existing stats, planteles, etc
  const sp = await searchParams;
  const spAdminviewVal = sp?.adminview;
  const forceAdminView = spAdminviewVal === "1";

  // For all roles
  const plantelesFull = await prisma.plantel.findMany({
    include: { admins: { select: { id: true, name: true, email: true } } },
    orderBy: { name: "asc" }
  });
  const allPlantelStats = await fetchAllPlantelStats();
  const unassignedUsers = await fetchUnassignedUsers();

  // For admin
  const admins = await prisma.user.findMany({
    where: { role: { in: ["admin", "superadmin"] } },
    include: { plantelesAdmin: { select: { id: true } } },
    orderBy: { name: "asc" }
  });

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

  let assignablePlanteles = [];
  let defaultAssignPlantelId = null;
  if (session.role === "superadmin" && !forceAdminView) {
    assignablePlanteles = plantelesFull;
  } else {
    assignablePlanteles = plantelesFull.filter(p => (session.plantelesAdminIds || []).includes(p.id));
    if (assignablePlanteles.length === 1) {
      defaultAssignPlantelId = String(assignablePlanteles[0].id);
    }
  }
  const adminMultiplePlanteles = assignablePlanteles.length > 1;
  const enableApproval = session.role === "admin" || session.role === "superadmin";

  // ----- Begin new UserManagementPanel block: -----

  // Fetch all planteles (id, name) for assignment panel
  const planteles = await prisma.plantel.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true }
  });

  // Users for management (all or scope by role)
  const scopedPlantelIds = session.role === "superadmin"
    ? planteles.map(p => p.id)
    : session.plantelesAdminIds || [];

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: ["employee", "candidate"] },
      ...(session.role === "admin" ? { plantelId: { in: scopedPlantelIds } } : {})
    },
    select: {
      id: true, name: true, email: true, picture: true, role: true, isApproved: true, plantelId: true
    },
    orderBy: { name: "asc" }
  });

  // Map checklist/contract/approval meta for each user efficiently
  const userIds = users.map(u => u.id);
  const allChecklist = await prisma.checklistItem.findMany({
    where: { userId: { in: userIds }, required: true },
    select: { id: true, userId: true, fulfilled: true }
  });
  const allContratoSign = await prisma.signature.findMany({
    where: { userId: { in: userIds }, type: "contrato" },
    select: { id: true, userId: true, status: true }
  });

  const byUserChecklist = {};
  for (const c of allChecklist) {
    if (!byUserChecklist[c.userId]) byUserChecklist[c.userId] = { required: 0, fulfilled: 0 };
    byUserChecklist[c.userId].required += 1;
    if (c.fulfilled) byUserChecklist[c.userId].fulfilled += 1;
  }
  const byUserContrato = {};
  for (const s of allContratoSign) {
    if (!byUserContrato[s.userId]) byUserContrato[s.userId] = false;
    if (["signed", "completed"].includes(s.status)) byUserContrato[s.userId] = true;
  }
  const usersFull = users.map(u => {
    const check = byUserChecklist[u.id] || { required: 0, fulfilled: 0 };
    const contratoSigned = !!byUserContrato[u.id];
    const readyForApproval =
      u.role === "candidate" &&
      !u.isApproved &&
      (check.required > 0 && check.required === check.fulfilled) &&
      contratoSigned;
    return {
      ...u,
      readyForApproval
    };
  });

  // ----- End new UserManagementPanel block -----

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf6fe] via-[#dbf3de] to-[#e2f8fe] flex flex-col items-center pt-24 px-2">
      <AdminNav session={session} />
      <div className="w-full max-w-7xl mt-20">

        {/* EPIC: New assignment/approval panel */}
        <UserManagementPanel
          users={usersFull}
          planteles={planteles}
          adminRole={session.role}
          plantelesPermittedIds={session.plantelesAdminIds}
        />

        {/* Existing dashboard stats and admin features follow: */}

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

        {/* Legacy assignment/bulk, still available if needed */}
        <AssignEmployeesSectionClient
          unassignedUsers={unassignedUsers}
          planteles={assignablePlanteles}
          userRole={session.role}
          adminPlantelIds={session.plantelesAdminIds || []}
          multiplePlantelesForAdmin={adminMultiplePlanteles}
          defaultAssignPlantelId={defaultAssignPlantelId}
        />

        {/* Superadmin-only Plantel Admin Matrix and CRUD */}
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
          <h2 className="text-xl font-bold text-cyan-700 pb-3">Progreso de empleados y candidatos por plantel</h2>
          {plantelData.map(plantel =>
            <div key={plantel.id} className="mb-8 border-b border-cyan-100 pb-6">
              <div className="font-bold text-base text-cyan-800 mb-2">{plantel.name}</div>
              <PlantelEmployeeProgressTable employees={plantel.employees} adminCanApprove={enableApproval} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
