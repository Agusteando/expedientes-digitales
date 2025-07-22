
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

// POST: { userIds: [id...] }
export async function POST(req, context) {
  const session = await getSessionFromCookies(req.cookies);
  if (!session || !["admin", "superadmin"].includes(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  let data;
  try { data = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { userIds } = data;
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: "Sin usuarios seleccionados." }, { status: 400 });
  }
  // Only approve candidates who have admin-uploaded proyectivos and not already employee
  let approved = [];
  for (let userId of userIds) {
    const u = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!u || u.role !== "candidate" || u.isApproved) continue;
    if (
      session.role === "admin" &&
      (!session.plantelesAdminIds || !session.plantelesAdminIds.includes(u.plantelId))
    ) {
      continue;
    }
    // Must have admin-uploaded proyectivos doc
    const proyectivosDoc = await prisma.document.findFirst({
      where: { userId: Number(userId), type: "proyectivos", status: "ACCEPTED" }
    });
    if (proyectivosDoc) {
      await prisma.user.update({
        where: { id: Number(userId) },
        data: { isApproved: true, role: "employee" }
      });
      approved.push(Number(userId));
    }
  }
  return NextResponse.json({ ok: true, approved });
}
