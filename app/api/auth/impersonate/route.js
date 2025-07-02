
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies, setSessionCookie, destroySessionCookie } from "@/lib/auth";

// Save original superadmin session JWT as a backup httpOnly cookie on impersonate.
// Restore that backup when stopping impersonation.

export async function POST(req) {
  const session = await getSessionFromCookies(req.cookies);
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  let data;
  try { data = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!data || (!data.adminId && !data.adminEmail)) {
    return NextResponse.json({ error: "Falta adminId o adminEmail" }, { status: 400 });
  }
  // Find admin user
  let admin;
  if (data.adminId) {
    admin = await prisma.user.findUnique({ where: { id: Number(data.adminId) } });
  } else if (data.adminEmail) {
    admin = await prisma.user.findUnique({ where: { email: data.adminEmail } });
  }
  if (!admin || admin.role !== "admin" || !admin.isActive) {
    return NextResponse.json({ error: "Admin a impersonar no encontrado o inactivo" }, { status: 404 });
  }

  // Hydrate plantelesAdminIds for target admin
  const plantelesAdmin = await prisma.plantel.findMany({
    where: { admins: { some: { id: admin.id } } }, select: { id: true }
  });
  const plantelesAdminIds = plantelesAdmin.map(p => p.id);

  // Compose new impersonated session
  const impersonatedSession = {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: "admin",
    plantelId: admin.plantelId,
    plantelesAdminIds,
    picture: admin.picture || null,
    _impersonatedBy: session.email,
    _impersonatorId: session.id
  };

  // Use session-token's value (JWT) as backup in a cookie
  const origToken = req.cookies.get("session-token")?.value;
  const res = NextResponse.json({ ok: true, admin: { id: admin.id, email: admin.email, name: admin.name } });
  setSessionCookie(res, impersonatedSession);

  if (origToken) {
    res.cookies.set("impersonator-token", origToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 60 // 30 minutes for safety
    });
  }
  return res;
}

export async function DELETE(req) {
  // Restore session-token from backup impersonator-token, if present
  const impToken = req.cookies.get("impersonator-token")?.value;
  if (impToken) {
    const res = NextResponse.json({ ok: true, stopped: true });
    // Restore session, delete backup
    res.cookies.set("session-token", impToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60
    });
    res.cookies.set("impersonator-token", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: -1
    });
    return res;
  }
  // Fallback: log out
  const res = NextResponse.json({ ok: true, stopped: true });
  destroySessionCookie(res);
  return res;
}
