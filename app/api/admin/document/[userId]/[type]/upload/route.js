
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

  const numericUserId = Number(userIdParam);
  if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
    return NextResponse.json({ error: "ID de usuario inválido." }, { status: 400 });
  }

  const type = String(typeParam || "documento");

  const session = await getSessionFromCookies(req.cookies);
  if (!session || !["admin", "superadmin"].includes(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

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
    const timestamp = Date.now();
    const randomPart = Math.floor(Math.random() * 1_000_000);
    const safeType = type.replace(/[^\w.\-]/g, "_") || "documento";
    const fileName = `${safeType}-${timestamp}-${randomPart}${ext}`;

    const publicRoot = path.join(process.cwd(), "public");
    const destDirAbsolute = path.join(
      publicRoot,
      "storage",
      "documents",
      String(numericUserId)
    );

    await fs.mkdir(destDirAbsolute, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const destAbsolutePath = path.join(destDirAbsolute, fileName);

    console.log("[admin-upload-doc] Saving file to disk", {
      userId: numericUserId,
      type,
      destAbsolutePath,
      sizeBytes: buffer.length,
    });

    await fs.writeFile(destAbsolutePath, buffer);

    const latestDoc = await prisma.document.findFirst({
      where: { userId: numericUserId, type },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    const nextVersion = (latestDoc?.version ?? 0) + 1;

    const filePublicPath = [
      "",
      "storage",
      "documents",
      String(numericUserId),
      fileName,
    ].join("/");

    const document = await prisma.document.create({
      data: {
        userId: numericUserId,
        type,
        status: "PENDING",
        filePath: filePublicPath,
        version: nextVersion,
      },
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

    console.log("[admin-upload-doc] Created document record", {
      documentId: document.id,
      userId: numericUserId,
      type: document.type,
      version: document.version,
      filePath: document.filePath,
    });

    return NextResponse.json({ document });
  } catch (err) {
    console.error("[admin-upload-doc] Error handling upload", {
      errorMessage: err?.message || String(err),
      stack: err?.stack,
      userId: numericUserId,
      type,
    });

    return NextResponse.json(
      { error: "Error al procesar y guardar el archivo." },
      { status: 500 }
    );
  }
}
