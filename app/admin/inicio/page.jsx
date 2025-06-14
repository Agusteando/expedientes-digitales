
import { getSessionFromCookies } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import AdminNav from "@/components/admin/AdminNav";
import AdminDashboardStats from "@/components/admin/AdminDashboardStats";
import PlantelAdminMatrix from "@/components/admin/PlantelAdminMatrix";
import PlantelAssignmentTable from "@/components/admin/PlantelAssignmentTable";
import PlantelStatsCard from "@/components/admin/PlantelStatsCard";
import PlantelEmployeeProgressTable from "@/components/admin/PlantelEmployeeProgressTable";
import { fetchAllPlantelStats, fetchUnassignedUsers } from "@/lib/admin/plantelStats";

function getCookieHeader(cookiesArr) {
  return cookiesArr.map(c => `${c.name}=${c.value}`).join("; ");
}

function getAbsoluteUrl(path) {
  const proto = process.env.NEXT_PUBLIC_VERCEL_URL
    ? "https"
    : (process.env.NODE_ENV === "production" ? "https" : "http");
  const host = process.env.NEXT_PUBLIC_VERCEL_URL
    ? process.env.NEXT_PUBLIC_VERCEL_URL
    : process.env.HOST || "localhost:3000";
  if (process.env.NEXT_PUBLIC_VERCEL_URL) return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}${path}`;
  return `${proto}://${host}${path}`;
}

export default async function AdminInicioPage({ searchParams }) {
  // Await cookies and session extraction
  const cookiesStore = await cookies();
  const session = await getSessionFromCookies(cookiesStore); // MAIN FIX: add await

  // Await and introspect searchParams
  const sp = await searchParams;

  // Universal lookup for adminview param (supports both URLSearchParams and plain object)
  let forceAdminView = false;
  let spDebugType = typeof sp;
  let spDebugKeys = Array.isArray(sp) ? sp : Object.keys(sp ?? {});
  let spAdminviewVal = undefined;
  if (sp && typeof sp.get === "function") {
    forceAdminView = sp.get("adminview") === "1";
    spAdminviewVal = sp.get("adminview");
  } else if (typeof sp === "object" && sp !== null) {
    forceAdminView = sp.adminview === "1";
    spAdminviewVal = sp.adminview;
  }

  // Debug logs: begin
  console.debug("[/admin/inicio] --- DEBUG LOGS ---");
  console.debug("[/admin/inicio] cookiesStore.getAll():", cookiesStore.getAll());
  console.debug("[/admin/inicio] session (from getSessionFromCookies):", session);
  console.debug("[/admin/inicio] typeof searchParams:", typeof searchParams, ", typeof sp (awaited):", spDebugType, ", keys/entries:", spDebugKeys);
  console.debug("[/admin/inicio] forceAdminView:", forceAdminView, "; spAdminviewVal:", spAdminviewVal);

  if (!session || !["admin", "superadmin"].includes(session.role)) {
    console.warn("[/admin/inicio] redirect: invalid or missing session/role", { session });
    redirect("/admin/login");
  }

  // More logs for flow verification
  console.debug("[/admin/inicio] Session still valid, role:", session.role, "; superadmin?", session.role === "superadmin", "; forceAdminView?", forceAdminView);

  // Data loading
  const plantelesFull = await prisma.plantel.findMany({
    include: { admins: { select: { id: true, name: true, email: true } } },
    orderBy: { name: "asc" }
  });
  const admins = await prisma.user.findMany({
    where: { role: { in: ["admin", "superadmin"] } },
    include: { plantelesAdmin: { select: { id: true } } },
    orderBy: { name: "asc" }
  });
  const allPlantelStats = await fetchAllPlantelStats();
  const unassignedUsers = await fetchUnassignedUsers();

  let plantelData;
  if (session.role === "superadmin" && !forceAdminView) {
    plantelData = allPlantelStats;
    console.debug("[/admin/inicio] PlantelData: allPlantelStats (superadmin view)");
  } else {
    const ids = session.plantelesAdminIds || [];
    plantelData = allPlantelStats.filter(p => ids.includes(p.id));
    console.debug("[/admin/inicio] PlantelData: filtered for plantelesAdminIds:", ids);
  }

  let totalUsers = 0, completedExpedientes = 0, totalPlanteles = plantelData.length;
  plantelData.forEach(p => {
    totalUsers += p.progress.total;
    completedExpedientes += p.progress.completed;
  });
  const percentComplete = totalUsers === 0 ? 0 : Math.round((completedExpedientes / totalUsers) * 100);

  const showSuperImpersonating = session.role === "superadmin" && forceAdminView;

  // More logs for rendering outcome
  console.debug("[/admin/inicio] Render outcome: showSuperImpersonating?", showSuperImpersonating);

  // --- Server actions
  async function assignAdminToPlantel(adminId, plantelId, assigned) {
    "use server";
    const url = getAbsoluteUrl(`/api/admin/planteles/${plantelId}/assign-admin`);
    const cookiesArr = await cookies().getAll();
    const cookieHeader = getCookieHeader(cookiesArr);
    console.debug("[assignAdminToPlantel] POST", url, { adminId, plantelId, assigned, cookieHeader });
    const res = await fetch(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "cookie": cookieHeader,
        },
        body: JSON.stringify({
          adminUserId: adminId,
          action: assigned ? "remove" : "add"
        }),
        cache: "no-store",
      }
    );
    if (!res.ok) {
      const data = await res.json();
      console.error("[assignAdminToPlantel] Error", data);
      throw new Error(data?.error || "Error asignando admin.");
    }
    return true;
  }

  async function assignUsersToPlantel(assignBatch, plantelId) {
    "use server";
    const url = getAbsoluteUrl("/api/admin/users/assign-plantel");
    const cookiesArr = await cookies().getAll();
    const cookieHeader = getCookieHeader(cookiesArr);
    console.debug("[assignUsersToPlantel] POST", url, { assignBatch, plantelId, cookieHeader });
    const res = await fetch(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "cookie": cookieHeader,
        },
        body: JSON.stringify({
          userIds: assignBatch.map(u => u.id),
          plantelId
        }),
        cache: "no-store",
      }
    );
    if (!res.ok) {
      const data = await res.json();
      console.error("[assignUsersToPlantel] Error", data);
      throw new Error(data?.error || "No se pudo asignar usuarios.");
    }
    return true;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf6fe] via-[#dbf3de] to-[#e2f8fe] flex flex-col items-center pt-24 px-2">
      <AdminNav session={session} />
      <div className="w-full max-w-7xl mt-20">
        {showSuperImpersonating && (
          <div className="text-sm px-4 py-2 my-2 rounded bg-cyan-100 text-cyan-800 font-bold border border-cyan-200 shadow">
            Vista limitada: Modo administrador de plantel (estás en modo superadmin)
          </div>
        )}
        {/* Core stats always visible */}
        <AdminDashboardStats
          summary={{
            totalUsers,
            completedExpedientes,
            totalPlanteles,
            percentComplete,
          }}
        />

        {/* Superadmin: show full matrix (and all unassigned users) */}
        {session.role === "superadmin" && !forceAdminView && (
          <>
            <PlantelAdminMatrix
              planteles={plantelesFull}
              admins={admins}
              onAssign={assignAdminToPlantel}
            />
            <PlantelAssignmentTable
              users={unassignedUsers}
              planteles={plantelesFull}
              onAssign={assignUsersToPlantel}
              assignLoading={false}
              compact
              showSuggested
            />
          </>
        )}

        {/* Admins (or superadmin in admin impersonation mode): show assignment for only their users */}
        {((session.role === "admin") || showSuperImpersonating) && (
          <PlantelAssignmentTable
            users={unassignedUsers.filter(u => u.plantelId === null)}
            planteles={plantelData}
            onAssign={assignUsersToPlantel}
            assignLoading={false}
            compact
            showSuggested={false}
          />
        )}

        {/* Plantel stats cards */}
        <div className="grid xs:grid-cols-2 md:grid-cols-3 gap-3 w-full mt-5">
          {plantelData.map(plantel =>
            <PlantelStatsCard key={plantel.id} plantel={plantel} />
          )}
        </div>

        {/* Employee progress by plantel */}
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
