
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { stepsExpediente } from "@/components/stepMetaExpediente";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-options";

/**
 * Handles expediente document upload, versioned, never deletes old versions, supports auto-accept/fulfilled.
 * DEFENSIVE: Always converts IDs to int for DB; uses string for session match.
 */
export async function POST(req, context) {
  const params = await context.params;
  const { userId, type } = params;
  const allowedTypes = stepsExpediente.filter(s => !s.signable).map(s => s.key);

  if (!allowedTypes.includes(type)) {
    return NextResponse.json({ error: "Tipo de documento no permitido." }, { status: 400 });
  }

  const userIdInt = Number(userId);
  if (!Number.isFinite(userIdInt)) {
    return NextResponse.json({ error: "ID de usuario inválido." }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  // Use String comparison for session vs route param match, but ONLY use int for DB
  if (
    (session.user.role === "employee" || session.user.role === "candidate") &&
    String(session.user.id) !== String(userIdInt)
  ) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  // Defensive runtime log for debugging
  if (process.env.NODE_ENV !== "production") {
    console.log("[UPLOAD] Route userId (String):", userId, "| Session user.id:", session.user.id, typeof session.user.id, "| Used as Int:", userIdInt, typeof userIdInt);
  }

  // Always look up user using INT
  const user = await prisma.user.findUnique({ where: { id: userIdInt } });
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  // Handle file
  const formData = await req.formData();
  const file = formData.get("file");
  if (!file) return NextResponse.json({ error: "Falta archivo." }, { status: 400 });
  if (!file.type || file.type !== "application/pdf") {
    return NextResponse.json({ error: "Solo se permite PDF." }, { status: 400 });
  }
  const fileBuff = Buffer.from(await file.arrayBuffer());
  if (fileBuff.length > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "Archivo demasiado grande (>20MB)" }, { status: 400 });
  }

  const folder = path.join(process.cwd(), "storage", "documents", String(userIdInt));
  await fs.mkdir(folder, { recursive: true });
  const fname = `${type}-${Date.now()}-${nanoid(8)}.pdf`;
  const dest = path.join(folder, fname);

  await fs.writeFile(dest, fileBuff);

  // Get new version number for user/type
  const latest = await prisma.document.findFirst({
    where: { userId: userIdInt, type },
    orderBy: { version: "desc" },
    select: { version: true }
  });
  const nextVersion = latest ? latest.version + 1 : 1;

  // Create Document (never delete any!)
  const doc = await prisma.document.create({
    data: {
      userId: userIdInt,
      type,
      filePath: `/storage/documents/${userIdInt}/${fname}`,
      status: "accepted", // Or "pending" if you want admin review
      version: nextVersion
    }
  });

  // ChecklistItem linkage (fulfilled immediately for UX, or false if you want admin review)
  const item = await prisma.checklistItem.create({
    data: {
      userId: userIdInt,
      type,
      required: true,
      fulfilled: true, // set to false if you want admin review before showing as completed
      documentId: doc.id
    }
  });

  return NextResponse.json({
    ok: true,
    id: doc.id,
    filePath: doc.filePath,
    checklistItemId: item.id,
  });
}
