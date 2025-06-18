
import { NextResponse } from "next/server";
import { join, extname } from "path";
import { stat, readFile } from "fs/promises";

// Dynamic route: /storage/documents/[...file] serves files stored outside /public

export async function GET(req, context) {
  const params = await context.params;
  const fileArr = params.file;

  if (!Array.isArray(fileArr) || fileArr.length === 0) {
    return NextResponse.json({ error: "Archivo no especificado" }, { status: 400 });
  }

  // Validate path components
  const isValid = fileArr.every(p => /^[\w\-\.]+$/.test(p));
  if (!isValid) {
    return NextResponse.json({ error: "Ruta inválida." }, { status: 400 });
  }

  // Disk path
  const diskPath = join(process.cwd(), "storage", "documents", ...fileArr);

  let fstat;
  try {
    fstat = await stat(diskPath);
  } catch {
    return NextResponse.json({ error: "Archivo no encontrado." }, { status: 404 });
  }
  if (!fstat.isFile()) {
    return NextResponse.json({ error: "No es un archivo válido." }, { status: 400 });
  }

  // Allow PDF, jpg, png images only
  const ext = extname(diskPath).toLowerCase();
  let contentType;
  if (ext === ".pdf") contentType = "application/pdf";
  else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
  else if (ext === ".png") contentType = "image/png";
  else return NextResponse.json({ error: "Tipo de archivo no permitido." }, { status: 403 });

  try {
    const fileData = await readFile(diskPath);
    return new NextResponse(fileData, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${fileArr[fileArr.length-1]}"`,
        "Cache-Control": "public, max-age=86400",
      }
    });
  } catch {
    return NextResponse.json({ error: "No se pudo abrir el archivo." }, { status: 500 });
  }
}
