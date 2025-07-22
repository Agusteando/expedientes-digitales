
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

// POST: { adminId, plantelId, assigned }
// Assigns or removes an admin<->plantel relation
export async function POST(req) {
  const session = await getSessionFromCookies(req.cookies);
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  let data;
  try { data = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { adminId, plantelId, assigned } = data;
  if (!adminId || !plantelId || typeof assigned !== "boolean") {
    return NextResponse.json({ error: "Argumentos requeridos." }, { status: 400 });
  }

  const admin = await prisma.user.findUnique({ where: { id: Number(adminId) } });
  if (!admin || admin.role !== "admin") return NextResponse.json({ error: "No es admin." }, { status: 400 });

  if (assigned) {
    await prisma.user.update({
      where: { id: Number(adminId) },
      data: {
        plantelesAdmin: { connect: { id: Number(plantelId) } }
      }
    });
  } else {
    await prisma.user.update({
      where: { id: Number(adminId) },
      data: {
        plantelesAdmin: { disconnect: { id: Number(plantelId) } }
      }
    });
  }
  return NextResponse.json({ ok: true });
}
