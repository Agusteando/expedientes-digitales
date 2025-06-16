
import { cookies } from "next/headers";
import { getSessionFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import AdminNav from "@/components/admin/AdminNav";
import AdminDashboardStats from "@/components/admin/AdminDashboardStats";
import PlantelAdminMatrix from "@/components/admin/PlantelAdminMatrix";
import PlantelAssignmentTable from "@/components/admin/PlantelAssignmentTable";
import PlantelStatsCard from "@/components/admin/PlantelStatsCard";
import PlantelEmployeeProgressTable from "@/components/admin/PlantelEmployeeProgressTable";
import { fetchAllPlantelStats, fetchUnassignedUsers } from "@/lib/admin/plantelStats";

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

function getCookieHeader(cookiesArr) {
  // Defensive logging
  console.debug("[getCookieHeader] cookiesArr:", cookiesArr);
  return cookiesArr.map(c => `${c.name}=${c.value}`).join("; ");
}

export default async function AdminInicioPage({ searchParams }) {
  // --- Load YOUR custom session from the session-token cookie
  const cookiesStore = cookies();
  const cookiesArr = cookiesStore.getAll();
  const session = await getSessionFromCookies(cookiesStore);

  // Debug: Print all cookies visible to this SSR process
  console.log("[/admin/inicio] --- DEBUG LOGS ---");
  console.log("[/admin/inicio] cookiesStore.getAll():", cookiesArr);

  // DEBUG: Print session object
  console.log("[/admin/inicio] session (from getSessionFromCookies):", session);

  // Redirect if not legit admin/superadmin
  if (!session || !["admin", "superadmin"].includes(session.role)) {
    console.log("[/admin/inicio] No valid custom session, redirecting to /admin/login");
    redirect("/admin/login");
  }

  // Determine impersonation view mode based on searchParams
  let forceAdminView = false;
  let spAdminviewVal = undefined;
  if (typeof searchParams?.get === "function") {
    spAdminviewVal = searchParams.get("adminview");
    forceAdminView = spAdminviewVal === "1";
  } else if (typeof searchParams === "object" && searchParams !== null) {
    spAdminviewVal = searchParams.adminview;
    forceAdminView = spAdminviewVal === "1";
  }
  console.log(
    "[/admin/inicio] typeof searchParams:",
    typeof searchParams,
    ", typeof sp (awaited):",
    typeof searchParams,
    ", keys/entries:",
    Object.keys(searchParams || {}),
  );
  console.log(
    "[/admin/inicio] forceAdminView:",
    forceAdminView,
    "; spAdminviewVal:",
    spAdminviewVal,
  );

  // Print user/role context at render
  console.log(
    "[/admin/inicio] Session still valid, role:",
    session.role,
    "; superadmin?",
    session.role === "superadmin",
    "; forceAdminView?",
    forceAdminView
  );

  // --- Data loading
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

  // --- Which planteles are visible?
  let plantelData;
  if (session.role === "superadmin" && !forceAdminView) {
    plantelData = allPlantelStats;
    console.log("[/admin/inicio] PlantelData: allPlantelStats (superadmin view)");
  } else {
    const ids = session.plantelesAdminIds || [];
    plantelData = allPlantelStats.filter(p => ids.includes(p.id));
    console.log("[/admin/inicio] PlantelData: admin impersonation view - ids:", ids);
  }

  // --- Compute dashboard stats for display
  let totalUsers = 0, completedExpedientes = 0, totalPlanteles = plantelData.length;
  plantelData.forEach(p => {
    totalUsers += p.progress.total;
    completedExpedientes += p.progress.completed;
  });
  const percentComplete = totalUsers === 0 ? 0 : Math.round((completedExpedientes / totalUsers) * 100);

  const showSuperImpersonating = session.role === "superadmin" && forceAdminView;

  // --- Server actions

  async function assignAdminToPlantel(adminId, plantelId, assigned) {
    "use server";
    const url = getAbsoluteUrl(`/api/admin/planteles/${plantelId}/assign-admin`);
    // Must await cookies() (Next.js 14 dynamic API)
    const cs = await cookies();
    const cookiesArr = cs.getAll();
    const cookieHeader = getCookieHeader(cookiesArr);

    // Debug log all context
    console.debug("[assignAdminToPlantel] POST", url, {
      adminId, plantelId, assigned, cookieHeader
    });

    // Make the request, always with cookies for session
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cookie": cookieHeader
      },
      body: JSON.stringify({
        adminUserId: adminId,
        action: assigned ? "remove" : "add"
      }),
      cache: "no-store",
    });

    // Print full fetch response context for debugging
    console.debug("[assignAdminToPlantel] response status", res.status, "; headers:", Array.from(res.headers.entries()));

    if (!res.ok) {
      // Defensive: don't parse as JSON if not JSON
      let data = {};
      try {
        if (res.headers.get("content-type")?.includes("application/json")) {
          data = await res.json();
        } else {
          data = { error: "Non-JSON API error (likely session invalid or redirect): " + (await res.text()) };
        }
      } catch (err) {
        data = { error: "Failed to parse error body" };
      }
      console.error("[assignAdminToPlantel] Error", data);
      throw new Error(data?.error || "Error asignando admin.");
    }

    // Optional: read response data/confirmation
    let resp;
    try {
      if (res.headers.get("content-type")?.includes("application/json")) {
        resp = await res.json();
      }
    } catch {}
    console.debug("[assignAdminToPlantel] Success response:", resp);
    return true;
  }

  async function assignUsersToPlantel(assignBatch, plantelId) {
    "use server";
    const url = getAbsoluteUrl("/api/admin/users/assign-plantel");
    const cs = await cookies();
    const cookiesArr = cs.getAll();
    const cookieHeader = getCookieHeader(cookiesArr);

    // Debug context log
    console.debug("[assignUsersToPlantel] POST", url, {
      userIds: assignBatch.map(u => u.id),
      plantelId,
      cookieHeader
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cookie": cookieHeader
      },
      body: JSON.stringify({
        userIds: assignBatch.map(u => u.id),
        plantelId
      }),
      cache: "no-store",
    });

    console.debug("[assignUsersToPlantel] response status", res.status, "; headers:", Array.from(res.headers.entries()));
    if (!res.ok) {
      let data = {};
      try {
        if (res.headers.get("content-type")?.includes("application/json")) {
          data = await res.json();
        } else {
          data = { error: "Non-JSON API error (likely session invalid or redirect): " + (await res.text()) };
        }
      } catch {
        data = { error: "Failed to parse error body" };
      }
      console.error("[assignUsersToPlantel] Error", data);
      throw new Error(data?.error || "No se pudo asignar usuarios.");
    }

    let resp;
    try {
      if (res.headers.get("content-type")?.includes("application/json")) {
        resp = await res.json();
      }
    } catch {}
    console.debug("[assignUsersToPlantel] Success response:", resp);
    return true;
  }

  // --- Outer logs for verification
  console.log("[/admin/inicio] Render outcome: showSuperImpersonating?", showSuperImpersonating);

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
        {(session.role === "admin" || showSuperImpersonating) && (
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
