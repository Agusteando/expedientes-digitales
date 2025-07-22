
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

// POST: { name, email }
export async function POST(req) {
  const session = await getSessionFromCookies(req.cookies);
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  let data;
  try { data = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  let { name, email } = data;
  if (!name || !email || typeof name !== "string" || typeof email !== "string") {
    return NextResponse.json({ error: "Faltan datos." }, { status: 400 });
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    return NextResponse.json({ error: "Correo inválido." }, { status: 400 });
  }
  let user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    if (user.role !== "admin") {
      user = await prisma.user.update({ where: { email }, data: { role: "admin", name, isActive: true } });
    } else {
      user = await prisma.user.update({ where: { email }, data: { name, isActive: true } });
    }
  } else {
    user = await prisma.user.create({
      data: { email, name, role: "admin", isActive: true }
    });
  }
  return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
}
