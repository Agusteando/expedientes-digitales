
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
import { stepsExpediente } from "@/components/stepMetaExpediente";
import { LightBulbIcon, PencilSquareIcon, Squares2X2Icon } from "@heroicons/react/24/solid";
import PlantelSignatureNamesPanel from "@/components/admin/PlantelSignatureNamesPanel";
import PuestoAdminPanelClient from "@/components/admin/PuestoAdminPanelClient";

// Only non-admin-upload, non-plantel steps (i.e. strictly user-uploaded docs)
const userChecklistKeys = stepsExpediente.filter(
  s => !s.adminUploadOnly && !s.isPlantelSelection
).map(s => s.key);

function isUserExpedienteDigitalComplete(userChecklist) {
  return userChecklistKeys.every(key =>
    userChecklist.some(item => item.type === key && item.fulfilled)
  );
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
    select: { id: true, name: true, label: true, direccion: true, administracion: true, coordinacionGeneral: true }
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

  // Users
  let usersRaw = await prisma.user.findMany({
    where: {
      role: { in: ["employee", "candidate"] },
      ...(session.role === "admin" ? { plantelId: { in: scopedPlantelIds } } : {})
    },
    select: {
      id: true, name: true, email: true, picture: true, role: true, isApproved: true, plantelId: true, isActive: true,
      evaId: true, pathId: true,
    },
    orderBy: { name: "asc" }
  });
  const userIds = usersRaw.map(u => u.id);
  if (session.role === "admin") {
    usersRaw = usersRaw.filter(u => u.plantelId && scopedPlantelIds.includes(u.plantelId));
  }

  const allChecklist = await prisma.checklistItem.findMany({
    where: { userId: { in: userIds }, required: true },
    select: { id: true, userId: true, fulfilled: true, type: true }
  });
  const byUserChecklist = {};
  for (const c of allChecklist) (byUserChecklist[c.userId] ||= []).push(c);

  const allDocs = await prisma.document.findMany({
    where: { userId: { in: userIds } },
    select: { id: true, userId: true, type: true, status: true, filePath: true, version: true, uploadedAt: true }
  });
  const byUserDocsLatest = {};
  for (const doc of allDocs.sort((a, b) => (b.version || 1) - (a.version || 1))) {
    if (!byUserDocsLatest[doc.userId]) byUserDocsLatest[doc.userId] = {};
    if (!byUserDocsLatest[doc.userId][doc.type]) byUserDocsLatest[doc.userId][doc.type] = doc;
  }
  const projByUser = {};
  for (const d of allDocs) {
    if (d.type === "proyectivos" && d.status === "ACCEPTED") projByUser[d.userId] = true;
  }

  const totalUsers = usersRaw.length;
  let userDocsCompleted = 0;
  let expedientesValidados = 0;
  usersRaw.forEach(u => {
    const checklist = byUserChecklist[u.id] || [];
    const digitalComplete = isUserExpedienteDigitalComplete(checklist);
    if (digitalComplete) userDocsCompleted++;
    if (digitalComplete && !!projByUser[u.id]) expedientesValidados++;
  });
  const percentDigitalExpedientes = totalUsers === 0 ? 0 : Math.round((userDocsCompleted / totalUsers) * 100);
  const percentFinalExpedientes = totalUsers === 0 ? 0 : Math.round((expedientesValidados / totalUsers) * 100);
  const totalPlanteles = plantelesScoped.length;
  const totalDocuments = await prisma.document.count();

  let admins = [];
  if (session.role === "superadmin") {
    admins = await prisma.user.findMany({
      where: { role: { in: ["admin", "superadmin"] } },
      include: { plantelesAdmin: { select: { id: true } } },
      orderBy: { name: "asc" }
    });
  }

  const users = usersRaw.map(u => {
    const checklistItems = byUserChecklist[u.id] || [];
    const checklistByType = {};
    checklistItems.forEach(it => { checklistByType[it.type] = it; });
    const docsByType = byUserDocsLatest[u.id] || {};
    return {
      ...u,
      checklistByType,
      hasProyectivos: !!docsByType.proyectivos,
      documentsByType: docsByType,
      hasProyectivosAccepted: !!projByUser[u.id],
    };
  });

  const usedPlantelIds = new Set(users.map(u => u.plantelId).filter(Boolean));
  const filteredPlanteles = plantelesScoped.filter(p => usedPlantelIds.has(p.id));
  const plantelProgressData = filteredPlanteles.map(p => {
    const employees = users.filter(u => u.plantelId === p.id);
    const userDocsGood = employees.filter(u => isUserExpedienteDigitalComplete(byUserChecklist[u.id] || [])).length;
    const expedientesFinal = employees.filter(u =>
      isUserExpedienteDigitalComplete(byUserChecklist[u.id] || []) && !!projByUser[u.id]
    ).length;
    const percentDigital = employees.length === 0 ? 0 : Math.round((userDocsGood / employees.length) * 100);
    const percentFinal = employees.length === 0 ? 0 : Math.round((expedientesFinal / employees.length) * 100);
    return {
      ...p,
      employees,
      progress: {
        total: employees.length,
        userDocsCompleted: userDocsGood,
        expedientesValidados: expedientesFinal,
        percentDigitalExpedientes: percentDigital,
        percentFinalExpedientes: percentFinal
      }
    };
  });

  return (
    <AdminInicioClient session={session} showSidebar={session.role === "superadmin"}>
      <AdminNav session={session} />
      <main className="flex-1 flex flex-col gap-8 w-full min-w-0 max-w-full pt-24 md:pt-28 pb-6 md:pb-12">
        <section className="w-full max-w-screen-xl mx-auto px-2 sm:px-4 md:px-7 mb-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-yellow-50 border-l-4 border-yellow-400 px-4 py-3 rounded shadow-sm">
              <LightBulbIcon className="w-7 h-7 text-yellow-400 animate-pulse flex-shrink-0" />
              <div>
                <span className="font-bold text-yellow-900">Tip:</span>{" "}
                <span className="text-yellow-800">
                  Ahora el estatus de <b>Empleado</b> se asigna automáticamente en cuanto el campo <b>Fecha de ingreso</b> está presente.<br />
                  No es necesario "aprobar" candidatos manualmente. ¡Más sencillo y rápido!
                </span>
              </div>
            </div>
          </div>
        </section>
        <section id="dashboard-stats" className="w-full max-w-screen-xl mx-auto px-2 sm:px-4 md:px-7 mb-7">
          <AdminDashboardStats
            summary={{
              userDocsCompleted,
              totalUsers,
              totalPlanteles,
              percentDigitalExpedientes,
              percentFinalExpedientes,
              totalDocuments,
            }}
          />
        </section>
        <section id="user-management" className="w-full max-w-7xl mx-auto px-1 xs:px-2 sm:px-4 md:px-6 mb-10">
          <div className="bg-white/90 shadow-xl border border-cyan-200 rounded-2xl overflow-x-auto p-1 xs:p-2 md:p-6">
            <UserManagementPanel
              users={users}
              planteles={filteredPlanteles}
              adminRole={session.role}
              plantelesPermittedIds={session.role === "superadmin" ? planteles.map(p => p.id) : scopedPlantelIds}
              canAssignPlantel={session.role === "superadmin"}
            />
          </div>
        </section>
        <section id="plantel-progress" className="w-full max-w-7xl mx-auto px-1 xs:px-2 sm:px-4 md:px-6 mb-10">
          <div className="bg-white/90 shadow-xl border border-cyan-200 rounded-2xl overflow-x-auto p-1 xs:p-2 md:p-6">
            <PlantelProgressPanel planteles={plantelProgressData} />
          </div>
        </section>
        {session.role === "superadmin" && (
          <>
            <section id="puestos-admin" className="w-full max-w-7xl mx-auto px-1 xs:px-2 sm:px-4 md:px-6 mb-10">
              <div className="bg-white/90 shadow-xl border border-cyan-200 rounded-2xl overflow-x-auto p-1 xs:p-2 md:p-6">
                <div className="flex flex-row items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-cyan-900 flex items-center gap-2">
                    <Squares2X2Icon className="w-5 h-5 text-cyan-600" />
                    Catálogo de Puestos
                  </h3>
                </div>
                <PuestoAdminPanelClient />
              </div>
            </section>
            <section id="plantel-list-admin" className="w-full max-w-7xl mx-auto px-1 xs:px-2 sm:px-4 md:px-6 mb-10">
              <div className="bg-white/90 shadow-xl border border-cyan-200 rounded-2xl overflow-x-auto p-1 xs:p-2 md:p-6">
                <PlantelListAdminPanelClient initialPlanteles={planteles} onRefresh={null} />
              </div>
            </section>
            <section id="plantel-signature-names" className="w-full max-w-7xl mx-auto px-1 xs:px-2 sm:px-4 md:px-6 mb-10">
              <div className="bg-white/90 shadow-xl border border-cyan-200 rounded-2xl overflow-x-auto p-1 xs:p-2 md:p-6">
                <div className="flex flex-row items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-cyan-900">Firmas por Plantel</h3>
                  <a
                    href="#plantel-signature-names"
                    className="flex items-center gap-2 bg-cyan-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-full shadow transition text-xs sm:text-base"
                    style={{ textDecoration: "none" }}
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                    Editar firmas/plantel
                  </a>
                </div>
                <PlantelSignatureNamesPanel />
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
