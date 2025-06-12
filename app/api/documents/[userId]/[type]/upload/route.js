
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

/**
 * Accepts multipart upload; only "contract" and "reglamento" allowed as [type].
 */
export async function POST(req, context) {
  const params = await context.params;
  const { userId, type } = params;
  const allowedTypes = ["contract", "reglamento"];
  if (!allowedTypes.includes(type)) {
    return NextResponse.json({ error: "Tipo de documento no permitido." }, { status: 400 });
  }

  // Secure: Only logins with access to this user may upload
  const session = getSessionFromCookies(req.cookies);
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  // Employees can only upload their own docs
  if (session.role === "employee" && session.id !== userId)
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });

  // Only admins/superadmins can upload for others
  if ((session.role === "admin" || session.role === "superadmin") && session.id !== userId) {
    // Optional: verify plantel/admin relation
    // For brevity, only superadmin can upload for others.
    if (session.role !== "superadmin")
      return NextResponse.json({ error: "Solo SuperAdmin puede cargar por otros usuarios." }, { status: 403 });
  }

  // Parse multipart form
  const formData = await req.formData();
  const file = formData.get("file");
  if (!file) return NextResponse.json({ error: "Falta archivo." }, { status: 400 });
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Solo se permite PDF." }, { status: 400 });
  }
  const fileBuff = Buffer.from(await file.arrayBuffer());
  if (fileBuff.length > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "Archivo demasiado grande (>20MB)" }, { status: 400 });
  }

  // Save file on disk (You may switch to S3/minio later)
  const folder = path.join(process.cwd(), "storage", "documents", userId);
  await fs.mkdir(folder, { recursive: true });
  const fname = `${type}-${Date.now()}-${nanoid(8)}.pdf`;
  const dest = path.join(folder, fname);

  await fs.writeFile(dest, fileBuff);

  // Insert Document & ChecklistItem
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    await fs.unlink(dest);
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  // Remove old document of the same type if any (clean up and single active only)
  const old = await prisma.document.findFirst({ where: { userId, type, status: { in: ["pending","rejected"] } } });
  if (old) {
    try { await fs.unlink(path.join(folder, path.basename(old.filePath))); } catch {}
    await prisma.document.delete({ where: { id: old.id } });
    await prisma.checklistItem.deleteMany({ where: { userId, type, documentId: old.id } });
  }

  // Create new Document
  const doc = await prisma.document.create({
    data: {
      userId,
      type,
      filePath: `/storage/documents/${userId}/${fname}`,
      status: "pending",
    },
  });

  // ChecklistItem linkage (for progress UI)
  const item = await prisma.checklistItem.create({
    data: {
      userId,
      type,
      required: true,
      documentId: doc.id,
    }
  });

  return NextResponse.json({
    ok: true,
    id: doc.id,
    filePath: doc.filePath,
    checklistItemId: item.id,
  });
}
