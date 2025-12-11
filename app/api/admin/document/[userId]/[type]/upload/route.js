
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function POST(req, context) {
  const params = await context.params;
  const userIdParam = params?.userId;
  const typeParam = params?.type;

  const userId = Number(userIdParam);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "ID de usuario inválido." }, { status: 400 });
  }

  const type = String(typeParam || "documento");

  const session = await getSessionFromCookies(req.cookies);
  if (!session || !["admin", "superadmin"].includes(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  let createdDocumentId = null;

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "No se recibió archivo válido en el campo 'file'." },
        { status: 400 }
      );
    }

    const originalName = file.name || "archivo";
    const safeBaseName = originalName.replace(/[^\w.\-]/g, "_");
    const ext = path.extname(safeBaseName) || "";

    // Determine next version number for this user+type
    const latestDoc = await prisma.document.findFirst({
      where: { userId, type },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    const nextVersion = (latestDoc?.version ?? 0) + 1;

    // Create the Document first to get a stable ID for the file name
    const created = await prisma.document.create({
      data: {
        userId,
        type,
        status: "PENDING",
        // Temporary placeholder; will be updated after writing the file
        filePath: "PENDING_PATH",
        version: nextVersion,
      },
      select: { id: true },
    });

    createdDocumentId = created.id;

    const publicRoot = path.join(process.cwd(), "public");
    const destDirAbsolute = path.join(
      publicRoot,
      "storage",
      "documents",
      String(userId)
    );
    await fs.mkdir(destDirAbsolute, { recursive: true });

    // Canonical filename: [documentId].[ext], same pattern as other documents
    const fileName = `${createdDocumentId}${ext}`;
    const destAbsolutePath = path.join(destDirAbsolute, fileName);
    const filePublicPath = [
      "",
      "storage",
      "documents",
      String(userId),
      fileName,
    ].join("/");

    console.log("[admin-upload-doc] Writing admin document", {
      userId,
      type,
      documentId: createdDocumentId,
      destAbsolutePath,
      filePublicPath,
    });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(destAbsolutePath, buffer);

    const updated = await prisma.document.update({
      where: { id: createdDocumentId },
      data: { filePath: filePublicPath },
      select: {
        id: true,
        userId: true,
        type: true,
        status: true,
        filePath: true,
        version: true,
        uploadedAt: true,
      },
    });

    console.log("[admin-upload-doc] Upload complete", {
      documentId: updated.id,
      userId: updated.userId,
      type: updated.type,
      filePath: updated.filePath,
      version: updated.version,
    });

    return NextResponse.json({ document: updated });
  } catch (err) {
    console.error("[admin-upload-doc] Error during upload", {
      errorMessage: err?.message || String(err),
      stack: err?.stack,
      userId,
      type,
      createdDocumentId,
    });

    // Best effort: remove placeholder document if we created one but failed later
    if (createdDocumentId) {
      try {
        await prisma.document.delete({ where: { id: createdDocumentId } });
        console.log("[admin-upload-doc] Rolled back placeholder document", {
          documentId: createdDocumentId,
        });
      } catch (rollbackErr) {
        console.error("[admin-upload-doc] Failed to roll back placeholder document", {
          documentId: createdDocumentId,
          errorMessage: rollbackErr?.message || String(rollbackErr),
        });
      }
    }

    return NextResponse.json(
      { error: "Error al procesar y guardar el archivo." },
      { status: 500 }
    );
  }
}
