
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

function guessMimeType(filePath) {
  const ext = path.extname(filePath || "").toLowerCase();
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".webp":
      return "image/webp";
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".csv":
      return "text/csv; charset=utf-8";
    case ".doc":
      return "application/msword";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".xls":
      return "application/vnd.ms-excel";
    case ".xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case ".zip":
      return "application/zip";
    default:
      return "application/octet-stream";
  }
}

function sanitizeSegments(raw) {
  const segments = Array.isArray(raw) ? raw : [raw];
  const safe = segments
    .map((s) => String(s || ""))
    .filter((s) => s && !s.includes("..") && !s.includes("/") && !s.includes("\\"));
  if (safe.length !== segments.length) {
    return null;
  }
  return safe;
}

async function serveFileFromUploads(segments) {
  const uploadsRoot = path.join(process.cwd(), "uploads");
  const relativePath = path.join(...segments);
  const absolutePath = path.join(uploadsRoot, relativePath);

  const normalizedRoot = path.resolve(uploadsRoot);
  const normalizedTarget = path.resolve(absolutePath);

  if (!normalizedTarget.startsWith(normalizedRoot)) {
    console.warn("[uploads-route] Path traversal attempt blocked", {
      requested: segments,
      normalizedTarget,
    });
    return NextResponse.json({ error: "Ruta inválida." }, { status: 400 });
  }

  console.log("[uploads-route] Serving legacy upload file", {
    relativePath,
    absolutePath: normalizedTarget,
  });

  try {
    const stats = await fs.stat(normalizedTarget);
    if (!stats.isFile()) {
      console.warn("[uploads-route] Not a file", {
        path: normalizedTarget,
      });
      return NextResponse.json({ error: "No encontrado." }, { status: 404 });
    }
  } catch {
    console.warn("[uploads-route] File not found", {
      path: normalizedTarget,
    });
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  const data = await fs.readFile(normalizedTarget);
  const contentType = guessMimeType(relativePath);

  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export async function GET(req, context) {
  const params = await context.params;
  const slug = params?.slug;

  const safeSegments = sanitizeSegments(slug);
  if (!safeSegments || safeSegments.length === 0) {
    return NextResponse.json({ error: "Ruta de archivo inválida." }, { status: 400 });
  }

  return serveFileFromUploads(safeSegments);
}

export async function HEAD(req, context) {
  const params = await context.params;
  const slug = params?.slug;

  const safeSegments = sanitizeSegments(slug);
  if (!safeSegments || safeSegments.length === 0) {
    return NextResponse.json({ error: "Ruta de archivo inválida." }, { status: 400 });
  }

  const uploadsRoot = path.join(process.cwd(), "uploads");
  const relativePath = path.join(...safeSegments);
  const absolutePath = path.join(uploadsRoot, relativePath);

  const normalizedRoot = path.resolve(uploadsRoot);
  const normalizedTarget = path.resolve(absolutePath);

  if (!normalizedTarget.startsWith(normalizedRoot)) {
    console.warn("[uploads-route][HEAD] Path traversal attempt blocked", {
      requested: safeSegments,
      normalizedTarget,
    });
    return NextResponse.json({ error: "Ruta inválida." }, { status: 400 });
  }

  try {
    const stats = await fs.stat(normalizedTarget);
    if (!stats.isFile()) {
      return NextResponse.json({ error: "No encontrado." }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  return new Response(null, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
