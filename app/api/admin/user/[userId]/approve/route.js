
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

export async function POST(req, context) {
  const params = await context.params;
  const { userId } = params;
  const session = await getSessionFromCookies(req.cookies);
  if (!session || !["admin", "superadmin"].includes(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const u = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!u || u.role !== "candidate" || u.isApproved) {
    return NextResponse.json({ error: "Usuario no es candidato aprobable." }, { status: 400 });
  }
  const contratoSig = await prisma.signature.findFirst({
    where: { userId: Number(userId), type: "contrato", status: { in: ["signed", "completed"] } }
  });
  if (!contratoSig) {
    return NextResponse.json({ error: "Falta firma de contrato." }, { status: 400 });
  }
  // Fix: when approved, also change to employee
  await prisma.user.update({
    where: { id: Number(userId) },
    data: { isApproved: true, role: "employee" }
  });
  return NextResponse.json({ ok: true, userId: Number(userId) });
}
