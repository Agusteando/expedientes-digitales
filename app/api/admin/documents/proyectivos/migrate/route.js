
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function POST(req, context) {
  const params = await context.params;
  void params; // No dynamic params for this endpoint; kept for convention.

  const session = await getSessionFromCookies(req.cookies);
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    console.log("[migrate-proyectivos] Starting migration from /uploads to /storage/documents");

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

    // Legacy root where old proyectivos lived: ./uploads
    const legacyUploadsRoot = path.join(process.cwd(), "uploads");
    // Canonical root for all documents: ./storage/documents
    const storageRoot = path.join(process.cwd(), "storage");

    let migrated = 0;
    let skippedMissingFile = 0;
    let copyErrors = 0;
    let updateErrors = 0;

    for (const doc of docs) {
      const rawPath = doc.filePath || "";
      const relativeOld = rawPath.replace(/^\/+/, ""); // strip leading slash

      if (!relativeOld.startsWith("uploads")) {
        console.log("[migrate-proyectivos] Skipping non-uploads filePath", {
          documentId: doc.id,
          userId: doc.userId,
          filePath: doc.filePath,
        });
        continue;
      }

      // Map DB path /uploads/... to actual legacy disk location ./uploads/...
      const fragments = relativeOld.split("/").slice(1); // drop "uploads"
      const legacyRelative = path.join(...fragments);
      const legacyAbsolutePath = path.join(legacyUploadsRoot, legacyRelative);

      let sourceExists = true;
      try {
        const stat = await fs.stat(legacyAbsolutePath);
        if (!stat.isFile()) {
          sourceExists = false;
        }
      } catch {
        sourceExists = false;
      }

      if (!sourceExists) {
        console.warn("[migrate-proyectivos] Legacy file missing, skipping document", {
          documentId: doc.id,
          userId: doc.userId,
          legacyAbsolutePath,
          filePathInDb: doc.filePath,
        });
        skippedMissingFile += 1;
        continue;
      }

      const ext = path.extname(legacyAbsolutePath) || "";
      // Canonical structure: storage/documents/[userId]/[documentId].[ext]
      const newFileName = `${doc.id}${ext}`;
      const destDirAbsolute = path.join(
        storageRoot,
        "documents",
        String(doc.userId)
      );
      const destAbsolutePath = path.join(destDirAbsolute, newFileName);
      const destRelativeForDb = [
        "",
        "storage",
        "documents",
        String(doc.userId),
        newFileName,
      ].join("/");

      try {
        await fs.mkdir(destDirAbsolute, { recursive: true });

        console.log("[migrate-proyectivos] Copying legacy proyectivos", {
          documentId: doc.id,
          userId: doc.userId,
          from: legacyAbsolutePath,
          to: destAbsolutePath,
          newFilePath: destRelativeForDb,
        });

        await fs.copyFile(legacyAbsolutePath, destAbsolutePath);
      } catch (copyErr) {
        console.error("[migrate-proyectivos] Error copying legacy file", {
          documentId: doc.id,
          userId: doc.userId,
          from: legacyAbsolutePath,
          to: destAbsolutePath,
          errorMessage: copyErr?.message || String(copyErr),
        });
        copyErrors += 1;
        continue;
      }

      try {
        await prisma.document.update({
          where: { id: doc.id },
          data: { filePath: destRelativeForDb },
        });
      } catch (updateErr) {
        console.error("[migrate-proyectivos] Error updating document record", {
          documentId: doc.id,
          userId: doc.userId,
          newFilePath: destRelativeForDb,
          errorMessage: updateErr?.message || String(updateErr),
        });
        updateErrors += 1;
        // Keep both files so the original path stays valid.
        continue;
      }

      // Best effort: remove the legacy file after successful copy + DB update
      try {
        await fs.unlink(legacyAbsolutePath);
      } catch (unlinkErr) {
        console.warn("[migrate-proyectivos] Unable to remove legacy file after migration", {
          documentId: doc.id,
          userId: doc.userId,
          legacyAbsolutePath,
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
