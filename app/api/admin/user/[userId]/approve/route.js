
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

export async function POST(req, context) {
  const params = await context.params;
  const userId = Number(params.userId);
  if (!userId || Number.isNaN(userId)) {
    return NextResponse.json({ error: "ID de usuario inválido." }, { status: 400 });
  }
  const session = await getSessionFromCookies(req.cookies);
  if (!session || !["admin", "superadmin"].includes(session.role)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (user.role !== "candidate") {
    return NextResponse.json({ error: "Solo candidatos pueden ser aprobados." }, { status: 400 });
  }
  if (user.isApproved) {
    return NextResponse.json({ error: "El candidato ya ha sido aprobado." }, { status: 409 });
  }

  // Check contract signature
  const contratoSig = await prisma.signature.findFirst({
    where: { userId, type: "contrato", status: { in: ["signed", "completed"] } }
  });
  if (!contratoSig) {
    return NextResponse.json({ error: "Candidato debe firmar el contrato antes de aprobar." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isApproved: true, role: "employee" }
  });

  return NextResponse.json({ ok: true, user: { id: updated.id, role: updated.role, isApproved: updated.isApproved } });
}
