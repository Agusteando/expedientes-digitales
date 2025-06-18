
import { cookies } from "next/headers";
import { getSessionFromCookies } from "@/lib/auth";
import prisma from "@/lib/prisma";
import UserManagementPanel from "@/components/admin/UserManagementPanel";
import AdminNav from "@/components/admin/AdminNav";
import AdminDashboardStats from "@/components/admin/AdminDashboardStats";
import PlantelAdminMatrix from "@/components/admin/PlantelAdminMatrix";
import PlantelStatsCard from "@/components/admin/PlantelStatsCard";
import PlantelListAdminPanelClient from "@/components/admin/PlantelListAdminPanelClient";
import PlantelProgressPanel from "@/components/admin/PlantelProgressPanel";

// Utility to calculate “complete expediente”
function isUserExpedienteComplete(user) {
  // All ficha fields (rfc, curp, domicilioFiscal, fechaIngreso, puesto, sueldo, horarioLaboral, plantelId) must be non-empty
  const fichaFields = [user.rfc, user.curp, user.domicilioFiscal, user.fechaIngreso, user.puesto, user.sueldo, user.horarioLaboral, user.plantelId];
  const fichaOk = fichaFields.every(f => !!f && String(f).trim().length > 0);

  // All required checklist items fulfilled
  const requiredKeys = new Set((require("@/components/stepMetaExpediente").stepsExpediente || [])
    .filter(s => !s.signable && !s.isPlantelSelection)
    .map(s => s.key));
  const checklistOk = Array.from(requiredKeys).every(key =>
    user.checklistItems?.some(item => item.type === key && item.fulfilled));

  // Both reglamento and contrato signatures must exist and be signed/completed
  const regSig = user.signatures?.find(s => s.type === "reglamento");
  const contSig = user.signatures?.find(s => s.type === "contrato");
  const firmasOk =
    regSig && ["signed", "completed"].includes(regSig.status) &&
    contSig && ["signed", "completed"].includes(contSig.status);

  // Must be assigned to a plantel via plantelId
  return fichaOk && checklistOk && firmasOk && !!user.plantelId;
}

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

  // Planteles for scope & all admin panels
  const planteles = await prisma.plantel.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true }
  });

  const plantelesMap = Object.fromEntries(planteles.map(p => [p.id, p.name]));
  const scopedPlantelIds = session.role === "superadmin"
    ? planteles.map(p => p.id)
    : session.plantelesAdminIds || [];

  // Users: get all/employees/candidates for in-scope planteles
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: ["employee", "candidate"] },
      ...(session.role === "admin" ? { plantelId: { in: scopedPlantelIds } } : {})
    },
    select: {
      id: true, name: true, email: true, picture: true, role: true, isApproved: true, plantelId: true,
      rfc: true, curp: true, domicilioFiscal: true, fechaIngreso: true, puesto: true, sueldo: true, horarioLaboral: true,
    },
    orderBy: { name: "asc" }
  });

  const userIds = users.map(u => u.id);
  // Checklist items per user
  const allChecklist = await prisma.checklistItem.findMany({
    where: { userId: { in: userIds }, required: true },
    select: { id: true, userId: true, fulfilled: true, type: true }
  });
  // Signatures per user
  const allSigs = await prisma.signature.findMany({
    where: { userId: { in: userIds } },
    select: { id: true, userId: true, type: true, status: true }
  });
  // Group checklist and sigs by user
  const byUserChecklist = {};
  for (const c of allChecklist) {
    (byUserChecklist[c.userId] ||= []).push(c);
  }
  const byUserSigs = {};
  for (const s of allSigs) {
    (byUserSigs[s.userId] ||= []).push(s);
  }

  // For augmented panels, each user must include checklistItems, signatures
  const usersFull = users.map(u => ({
    ...u,
    checklistItems: byUserChecklist[u.id] || [],
    signatures: byUserSigs[u.id] || []
  }));

  // For plantel progress: Aggregate by plantel (map)
  const plantelData = planteles
    .filter(p => session.role === "superadmin" || scopedPlantelIds.includes(p.id))
    .map(p => {
      const pUsers = usersFull.filter(u => u.plantelId === p.id);
      // advanced progress
      let completed = 0, readyToApprove = 0;
      pUsers.forEach(u => {
        if (isUserExpedienteComplete(u)) completed++;
        // Candidates ready if checklist/contract/reglamento valid (re-using your prior logic is fine)
        const check = u.checklistItems || [];
        const stepsReq = require("@/components/stepMetaExpediente").stepsExpediente.filter(s => !s.signable && !s.isPlantelSelection);
        const checklistOk = stepsReq.every(st =>
          check.find(c => c.type === st.key && c.fulfilled));
        const regSig = u.signatures?.find(s => s.type === "reglamento");
        const contSig = u.signatures?.find(s => s.type === "contrato");
        const firmasOk =
          regSig && ["signed", "completed"].includes(regSig.status) &&
          contSig && ["signed", "completed"].includes(contSig.status);
        if (u.role === "candidate" && checklistOk && firmasOk) readyToApprove++;
      });
      return {
        id: p.id, name: p.name,
        progress: {
          total: pUsers.length,
          completed,
          readyToApprove
        },
        employees: pUsers
      };
    });

  // KPIs
  let totalUsers = 0, completedExpedientes = 0, totalPlanteles = plantelData.length;
  plantelData.forEach(p => {
    totalUsers += p.progress.total;
    completedExpedientes += p.progress.completed;
  });
  const percentComplete = totalUsers === 0 ? 0 : Math.round((completedExpedientes / totalUsers) * 100);

  // For management/assignment panel:
  const adminRole = session.role;
  const adminPlantelesPermittedIds = session.plantelesAdminIds;

  const admins = await prisma.user.findMany({
    where: { role: { in: ["admin", "superadmin"] } },
    include: { plantelesAdmin: { select: { id: true } } },
    orderBy: { name: "asc" }
  });

  // Plantel list CRUD/matrix etc can remain per your prior design—leave as per last working code if not removed.

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf6fe] via-[#dbf3de] to-[#e2f8fe] flex flex-col items-center pt-24 px-2">
      <AdminNav session={session} />
      <div className="w-full max-w-7xl mt-20">
        {/* KPIs at the top */}
        <AdminDashboardStats
          summary={{
            totalUsers,
            completedExpedientes,
            totalPlanteles,
            percentComplete,
          }}
        />

        {/* Epic management panel for assignment/ficha/etc */}
        <UserManagementPanel
          users={usersFull}
          planteles={planteles}
          adminRole={adminRole}
          plantelesPermittedIds={adminPlantelesPermittedIds}
          canAssignPlantel={session.role === "superadmin"}
        />

        {/* --- Epic new Progreso por Plantel section --- */}
        <PlantelProgressPanel planteles={plantelData} />

        {/* Retain superadmin-only plantel CRUD/admin matrix below */}
        {session.role === "superadmin" && (
          <>
            <PlantelListAdminPanelClient
              initialPlanteles={planteles}
              onRefresh={null}
            />
            <PlantelAdminMatrix
              planteles={planteles}
              admins={admins}
            />
          </>
        )}
      </div>
    </div>
  );
}
