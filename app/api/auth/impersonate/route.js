
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies, setSessionCookie, destroySessionCookie } from "@/lib/auth";

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

  // Compose new impersonated session, save original superadmin session data
  const impersonatedSession = {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: "admin",
    plantelId: admin.plantelId,
    plantelesAdminIds,
    picture: admin.picture || null,
    _impersonatedBy: session.email,
    _impersonatorId: session.id,
    _originalSuperadminSession: {
      id: session.id,
      email: session.email,
      name: session.name,
      role: "superadmin",
      plantelId: session.plantelId,
      plantelesAdminIds: session.plantelesAdminIds || [],
      picture: session.picture || null,
    }
  };

  const res = NextResponse.json({ ok: true, admin: { id: admin.id, email: admin.email, name: admin.name } });
  setSessionCookie(res, impersonatedSession);
  return res;
}

export async function DELETE(req) {
  const session = await getSessionFromCookies(req.cookies);

  if (session && session._originalSuperadminSession) {
    // Restore original superadmin session
    const superadminSession = session._originalSuperadminSession;
    const res = NextResponse.json({ ok: true, stopped: true });
    setSessionCookie(res, superadminSession);
    return res;
  }
  // Otherwise log out entirely
  const res = NextResponse.json({ ok: true, stopped: true });
  destroySessionCookie(res);
  return res;
}