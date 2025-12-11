
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function POST(req, context) {
  const params = await context.params;
  void params; // No route params for this endpoint; kept to follow the convention.

  const session = await getSessionFromCookies(req.cookies);
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    console.log("[migrate-proyectivos] Starting migration of proyectivos from /uploads to /storage/documents");

    const docs = await prisma.document.findMany({
      where: {
        type: "proyectivos",
        OR: [
          { filePath: { startsWith: "/uploads" } },
          { filePath: { startsWith: "uploads" } },
        ],
      },
      select: {
        id: true,
        userId: true,
        filePath: true,
      },
    });

    const publicRoot = path.join(process.cwd(), "public");

    let migrated = 0;
    let skippedMissingFile = 0;
    let copyErrors = 0;
    let updateErrors = 0;

    for (const doc of docs) {
      const rawPath = doc.filePath || "";
      const relativeOld = rawPath.replace(/^\/+/, "");

      if (!relativeOld.startsWith("uploads")) {
        console.log("[migrate-proyectivos] Skipping non-uploads path", {
          documentId: doc.id,
          userId: doc.userId,
          filePath: doc.filePath,
        });
        continue;
      }

      const oldAbsolutePath = path.join(publicRoot, relativeOld);

      let sourceExists = true;
      try {
        await fs.stat(oldAbsolutePath);
      } catch {
        sourceExists = false;
      }

      if (!sourceExists) {
        console.warn("[migrate-proyectivos] Source file missing, skipping document", {
          documentId: doc.id,
          userId: doc.userId,
          filePath: doc.filePath,
        });
        skippedMissingFile += 1;
        continue;
      }

      const ext = path.extname(relativeOld) || "";
      const newFileName = `${doc.id}${ext}`;
      const destRelative = ["storage", "documents", String(doc.userId), newFileName].join("/");
      const destAbsolutePath = path.join(publicRoot, destRelative);

      try {
        await fs.mkdir(path.dirname(destAbsolutePath), { recursive: true });

        console.log("[migrate-proyectivos] Copying file", {
          documentId: doc.id,
          userId: doc.userId,
          from: oldAbsolutePath,
          to: destAbsolutePath,
        });

        await fs.copyFile(oldAbsolutePath, destAbsolutePath);
      } catch (copyErr) {
        console.error("[migrate-proyectivos] Error copying file", {
          documentId: doc.id,
          userId: doc.userId,
          from: oldAbsolutePath,
          to: destAbsolutePath,
          errorMessage: copyErr?.message || String(copyErr),
        });
        copyErrors += 1;
        continue;
      }

      const newPublicPath = `/${destRelative}`;

      try {
        await prisma.document.update({
          where: { id: doc.id },
          data: { filePath: newPublicPath },
        });
      } catch (updateErr) {
        console.error("[migrate-proyectivos] Error updating document record", {
          documentId: doc.id,
          userId: doc.userId,
          newFilePath: newPublicPath,
          errorMessage: updateErr?.message || String(updateErr),
        });
        updateErrors += 1;
        continue;
      }

      try {
        await fs.unlink(oldAbsolutePath);
      } catch (unlinkErr) {
        console.warn("[migrate-proyectivos] Unable to remove old file after successful migration", {
          documentId: doc.id,
          userId: doc.userId,
          oldPath: oldAbsolutePath,
          errorMessage: unlinkErr?.message || String(unlinkErr),
        });
      }

      migrated += 1;
    }

    console.log("[migrate-proyectivos] Migration finished", {
      totalCandidates: docs.length,
      migrated,
      skippedMissingFile,
      copyErrors,
      updateErrors,
    });

    return NextResponse.json({
      totalCandidates: docs.length,
      migrated,
      skippedMissingFile,
      copyErrors,
      updateErrors,
    });
  } catch (err) {
    console.error("[migrate-proyectivos] Fatal migration error", {
      errorMessage: err?.message || String(err),
      stack: err?.stack,
    });

    return NextResponse.json(
      { error: "Error durante la migración de proyectivos." },
      { status: 500 }
    );
  }
}
