
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import { stepsExpediente } from "@/components/stepMetaExpediente";

export async function GET(req, context) {
  const params = await context.params;
  const { userId, type } = params;

  const allowedTypes = stepsExpediente.map(s => s.key);
  if (!allowedTypes.includes(type))
    return NextResponse.json({ error: "Tipo no soportado." }, { status: 400 });

  const session = getSessionFromCookies(req.cookies);
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (session.role === "employee" && session.id !== userId)
    return NextResponse.json({ error: "Prohibido." }, { status: 403 });

  const doc = await prisma.document.findFirst({ where: { userId, type }, orderBy: { createdAt: "desc" } });
  if (!doc) return NextResponse.json({ status: "none" });

  const item = await prisma.checklistItem.findFirst({ where: { userId, type, documentId: doc.id }, orderBy: { id: "desc" } });

  return NextResponse.json({
    document: doc,
    checklist: item,
    status: doc.status,
  });
}
