
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET(req, context) {
  const params = await context.params;
  const session = await getSessionFromCookies(req.cookies);
  if (!session || !["admin", "superadmin"].includes(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const userId = Number(params.userId);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plantelId: true } });
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }
  if (
    session.role === "admin" &&
    (!session.plantelesAdminIds || !session.plantelesAdminIds.includes(user.plantelId))
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  // ...existing logic for returning user docs/checklist
  const checklist = await prisma.checklistItem.findMany({ where: { userId }, orderBy: { type: "asc" } });
  const documents = await prisma.document.findMany({ where: { userId }, orderBy: { uploadedAt: "desc" } });
  return NextResponse.json({ checklist, documents });
}
