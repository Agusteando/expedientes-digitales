
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { stepsExpediente } from "@/components/stepMetaExpediente";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-options";

/**
 * Handles expediente document upload, now ensures only 1 active Document and 1 ChecklistItem per type/user,
 * and instantly sets Document as "accepted" and ChecklistItem as fulfilled. Also clears any duplicates.
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
  if (
    (session.user.role === "employee" || session.user.role === "candidate") &&
    String(session.user.id) !== String(userIdInt)
  ) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

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

  // Ensure user exists
  const user = await prisma.user.findUnique({ where: { id: userIdInt } });
  if (!user) {
    await fs.unlink(dest);
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  // Remove ALL previous Document + ChecklistItem of this user/type (eliminate all possible duplicates)
  const oldDocs = await prisma.document.findMany({
    where: { userId: userIdInt, type }
  });
  for (const oldDoc of oldDocs) {
    try { await fs.unlink(path.join(folder, path.basename(oldDoc.filePath))); } catch {}
    await prisma.checklistItem.deleteMany({ where: { userId: userIdInt, type, documentId: oldDoc.id } });
    await prisma.document.delete({ where: { id: oldDoc.id } });
  }

  // Re-check no duplicate ChecklistItem exists (for extreme edge cases)
  await prisma.checklistItem.deleteMany({ where: { userId: userIdInt, type } });

  // Create Document as instantly "accepted"
  const doc = await prisma.document.create({
    data: {
      userId: userIdInt,
      type,
      filePath: `/storage/documents/${userIdInt}/${fname}`,
      status: "accepted"
    }
  });

  // ChecklistItem linkage, instantly fulfilled
  const item = await prisma.checklistItem.create({
    data: {
      userId: userIdInt,
      type,
      required: true,
      fulfilled: true,
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
