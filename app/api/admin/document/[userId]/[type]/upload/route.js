
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import { writeFileToPublicUploads } from "@/lib/file-upload-utils";

export const config = { api: { bodyParser: false } };

const ALLOWED_TYPES = ["reglamento", "contrato"];

export async function POST(req, context) {
  const params = await context.params;
  const { userId, type } = params;
  const session = await getSessionFromCookies(req.cookies);

  if (!session || !["admin", "superadmin"].includes(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (!ALLOWED_TYPES.includes(type)) {
    return NextResponse.json({ error: "Tipo de documento no permitido" }, { status: 400 });
  }

  const employee = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { id: true, plantelId: true }
  });

  if (!employee) return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });

  if (
    session.role === "admin" &&
    (!employee.plantelId || !(session.plantelesAdminIds || []).includes(employee.plantelId))
  ) {
    return NextResponse.json({ error: "Solo admins del plantel pueden subir el archivo" }, { status: 403 });
  }

  // Parse multipart, save file
  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });

  const { url, metadata } = await writeFileToPublicUploads(file, {
    userId,
    docType: type,
    adminUpload: true
  });

  // Save Document and mark as fulfilled
  const latestDoc = await prisma.document.create({
    data: {
      userId: Number(userId),
      type,
      status: "ACCEPTED",
      filePath: url,
      reviewComment: "Archivo subido por administradora de plantel tras firma presencial.",
      version: 1,
    }
  });

  // Upsert ChecklistItem as fulfilled
  await prisma.checklistItem.upsert({
    where: {
      userId_type: { userId: Number(userId), type }
    },
    update: { fulfilled: true },
    create: {
      userId: Number(userId),
      type,
      required: true,
      fulfilled: true,
      documentId: latestDoc.id
    }
  });

  return NextResponse.json({ ok: true, url, docId: latestDoc.id });
}
