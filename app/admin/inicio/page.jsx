
import { cookies } from "next/headers";
import { getSessionFromCookies } from "@/lib/auth";
import prisma from "@/lib/prisma";
import UserManagementPanel from "@/components/admin/UserManagementPanel";
import AdminNav from "@/components/admin/AdminNav";
import AdminDashboardStats from "@/components/admin/AdminDashboardStats";
import PlantelAdminMatrix from "@/components/admin/PlantelAdminMatrix";
import PlantelListAdminPanelClient from "@/components/admin/PlantelListAdminPanelClient";
import PlantelProgressPanel from "@/components/admin/PlantelProgressPanel";
import PlantelAdminMatrixCrudClient from "@/components/admin/PlantelAdminMatrixCrudClient";
import AdminInicioClient from "@/components/admin/AdminInicioClient";

function isUserExpedienteComplete(user) {
  const fichaFields = [user.rfc, user.curp, user.domicilioFiscal, user.fechaIngreso, user.puesto, user.sueldo, user.horarioLaboral, user.plantelId];
  const fichaOk = fichaFields.every(f => !!f && String(f).trim().length > 0);
  const requiredKeys = new Set((require("@/components/stepMetaExpediente").stepsExpediente || [])
    .filter(s => !s.signable && !s.isPlantelSelection)
    .map(s => s.key));
  const checklistOk = Array.from(requiredKeys).every(key =>
    user.checklistItems?.some(item => item.type === key && item.fulfilled));
  const regSig = user.signatures?.find(s => s.type === "reglamento");
  const contSig = user.signatures?.find(s => s.type === "contrato");
  const firmasOk =
    regSig && ["signed", "completed"].includes(regSig.status) &&
    contSig && ["signed", "completed"].includes(contSig.status);
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

  let planteles = await prisma.plantel.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true }
  });

  let scopedPlantelIds, plantelesScoped;
  if (session.role === "superadmin") {
    scopedPlantelIds = planteles.map(p => p.id);
    plantelesScoped = planteles;
  } else {
    scopedPlantelIds = Array.isArray(session.plantelesAdminIds)
      ? session.plantelesAdminIds.map(Number).filter(n => !isNaN(n))
      : [];
    plantelesScoped = planteles.filter(p => scopedPlantelIds.includes(p.id));
  }

  let users = await prisma.user.findMany({
    where: {
      role: { in: ["employee", "candidate"] },
      ...(session.role === "admin" ? { plantelId: { in: scopedPlantelIds } } : {})
    },
    select: {
      id: true, name: true, email: true, picture: true, role: true, isApproved: true, plantelId: true, isActive: true,
      rfc: true, curp: true, domicilioFiscal: true, fechaIngreso: true, puesto: true, sueldo: true, horarioLaboral: true,
    },
    orderBy: { name: "asc" }
  });

  const userIds = users.map(u => u.id);

  if (session.role === "admin") {
    users = users.filter(u => u.plantelId && scopedPlantelIds.includes(u.plantelId));
  }

  if (typeof prisma.checklistItem !== "object" || typeof prisma.checklistItem.findMany !== "function") {
    return (
      <div className="p-10 text-center text-red-700 font-bold">
        <div>
          Error: prisma.checklistItem is missing on your Prisma Client instance.<br />
          <span className="text-black">Did you recently change your schema or add a model? <b>Run <span className="font-mono bg-slate-200 rounded px-2 py-0.5">npx prisma generate</span> and restart your server</b>.</span>
        </div>
      </div>
    );
  }
  const allChecklist = await prisma.checklistItem.findMany({
    where: { userId: { in: userIds }, required: true },
    select: { id: true, userId: true, fulfilled: true, type: true }
  });
  const allSigs = await prisma.signature.findMany({
    where: { userId: { in: userIds } },
    select: { id: true, userId: true, type: true, status: true }
  });
  const byUserChecklist = {};
  for (const c of allChecklist) {
    (byUserChecklist[c.userId] ||= []).push(c);
  }
  const byUserSigs = {};
  for (const s of allSigs) {
    (byUserSigs[s.userId] ||= []).push(s);
  }

  const stepsExpediente = require("@/components/stepMetaExpediente").stepsExpediente;
  const checklistRequiredKeys = stepsExpediente.filter(
    s => !s.signable && !s.isPlantelSelection
  ).map(s => s.key);

  function readyForApproval(u) {
    if (u.role !== "candidate" || !u.isActive) return false;
    const check = byUserChecklist[u.id] || [];
    const allDocsOk = checklistRequiredKeys.every(
      key => check.find(c => c.type === key && c.fulfilled)
    );
    const sigs = byUserSigs[u.id] || [];
    const regSig = sigs.find(s => s.type === "reglamento" && ["signed", "completed"].includes(s.status));
    const contSig = sigs.find(s => s.type === "contrato" && ["signed", "completed"].includes(s.status));
    return allDocsOk && regSig && contSig;
  }

  const usersFull = users.map(u => ({
    ...u,
    isActive: !!u.isActive,
    checklistItems: byUserChecklist[u.id] || [],
    signatures: byUserSigs[u.id] || [],
    readyForApproval: readyForApproval(u)
  }));

  const usedPlantelIds = new Set(usersFull.map(u => u.plantelId).filter(Boolean));
  const filteredPlanteles = plantelesScoped.filter(p => usedPlantelIds.has(p.id));

  const plantelData = filteredPlanteles
    .map(p => {
      const pUsers = usersFull.filter(u => u.plantelId === p.id);
      let completed = 0, readyToApprove = 0;
      pUsers.forEach(u => {
        if (isUserExpedienteComplete(u)) completed++;
        const check = u.checklistItems || [];
        const stepsReq = stepsExpediente.filter(s => !s.signable && !s.isPlantelSelection);
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

  let totalUsers = 0, completedExpedientes = 0, totalPlanteles = plantelData.length;
  plantelData.forEach(p => {
    totalUsers += p.progress.total;
    completedExpedientes += p.progress.completed;
  });
  const percentComplete = totalUsers === 0 ? 0 : Math.round((completedExpedientes / totalUsers) * 100);

  const adminRole = session.role;
  const adminPlantelesPermittedIds = session.role === "superadmin"
    ? planteles.map(p => p.id)
    : scopedPlantelIds;

  let admins = [];
  if (session.role === "superadmin") {
    admins = await prisma.user.findMany({
      where: { role: { in: ["admin", "superadmin"] } },
      include: { plantelesAdmin: { select: { id: true } } },
      orderBy: { name: "asc" }
    });
  }

  return (
    <AdminInicioClient session={session} showSidebar={session.role === "superadmin"}>
      <AdminNav session={session} />
      <main className="flex-1 flex flex-col gap-8 w-full min-w-0 max-w-full pt-24 md:pt-28 pb-6 md:pb-12">
        <section id="dashboard-stats" className="w-full max-w-screen-xl mx-auto px-2 sm:px-4 md:px-7 mb-7">
          <AdminDashboardStats
            summary={{
              totalUsers,
              completedExpedientes,
              totalPlanteles,
              percentComplete,
            }}
          />
        </section>
        <section id="user-management" className="w-full max-w-7xl mx-auto px-1 xs:px-2 sm:px-4 md:px-6 mb-10">
          <div className="bg-white/90 shadow-xl border border-cyan-200 rounded-2xl overflow-x-auto p-1 xs:p-2 md:p-6">
            <UserManagementPanel
              users={usersFull}
              planteles={filteredPlanteles}
              adminRole={adminRole}
              plantelesPermittedIds={adminPlantelesPermittedIds}
              canAssignPlantel={session.role === "superadmin"}
            />
          </div>
        </section>
        <section id="plantel-progress" className="w-full max-w-7xl mx-auto px-1 xs:px-2 sm:px-4 md:px-6 mb-10">
          <div className="bg-white/90 shadow-xl border border-cyan-200 rounded-2xl overflow-x-auto p-1 xs:p-2 md:p-6">
            <PlantelProgressPanel planteles={plantelData} />
          </div>
        </section>
        {session.role === "superadmin" && (
          <>
            <section id="plantel-list-admin" className="w-full max-w-7xl mx-auto px-1 xs:px-2 sm:px-4 md:px-6 mb-10">
              <div className="bg-white/90 shadow-xl border border-cyan-200 rounded-2xl overflow-x-auto p-1 xs:p-2 md:p-6">
                <PlantelListAdminPanelClient initialPlanteles={planteles} onRefresh={null} />
              </div>
            </section>
            <section id="plantel-admin-matrix" className="w-full max-w-7xl mx-auto px-1 xs:px-2 sm:px-4 md:px-6 mb-10">
              <div className="bg-white/90 shadow-xl border border-cyan-200 rounded-2xl overflow-x-auto p-1 xs:p-2 md:p-6">
                <PlantelAdminMatrix planteles={planteles} admins={admins} />
              </div>
            </section>
            <section id="plantel-admin-matrix-crud" className="w-full max-w-7xl mx-auto px-1 xs:px-2 sm:px-4 md:px-6 mb-10">
              <div className="bg-white/90 shadow-xl border border-cyan-200 rounded-2xl overflow-x-auto p-1 xs:p-2 md:p-6">
                <PlantelAdminMatrixCrudClient />
              </div>
            </section>
          </>
        )}
      </main>
    </AdminInicioClient>
  );
}
