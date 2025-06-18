
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import archiver from "archiver";
import { getSessionFromCookies } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";
import stream from "stream";
import { promisify } from "util";
const pipeline = promisify(stream.pipeline);

const zipLocks = new Map(); // userId → Promise

const FIELDS = [
  { key: "rfc", label: "RFC" },
  { key: "curp", label: "CURP" },
  { key: "domicilioFiscal", label: "Domicilio fiscal" },
  { key: "fechaIngreso", label: "Fecha de ingreso" },
  { key: "puesto", label: "Puesto" },
  { key: "sueldo", label: "Sueldo mensual (MXN)" },
  { key: "horarioLaboral", label: "Horario laboral" },
  { key: "plantelId", label: "Plantel asignado" },
];

async function createFichaPDF(user) {
  const doc = await PDFDocument.create();
  const page = doc.addPage();
  const { width, height } = page.getSize();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  let y = height - 48;
  page.drawText("Ficha Técnica – Expediente Laboral", {
    x: 50,
    y, size: 20, font, color: rgb(0.18,0.25,0.7)
  });
  y -= 32;
  page.drawText(`Nombre:`, { x: 50, y, size: 12, font, color: rgb(0, 0, 0.4) });
  page.drawText(user.name, { x: 140, y, size: 12, font, color: rgb(0,0,0) });
  y -= 18;
  page.drawText("Email:", { x: 50, y, size: 12, font}); page.drawText(user.email, { x: 140, y, size: 12, font});
  y -= 25;
  for (const field of FIELDS) {
    let value = user[field.key];
    if (field.key === "fechaIngreso" && value) value = value.toISOString().slice(0,10);
    if (field.key === "plantelId")
      value = user.plantel?.name || "";
    if (field.key === "sueldo" && value !== null && value !== undefined)
      value = `$${value}`;
    if (!value) value = "";
    page.drawText(`${field.label}:`, { x: 50, y, size: 12, font, color: rgb(0,0,0.45)});
    page.drawText(String(value), { x: 170, y, size: 12, font, color: rgb(0,0,0)});
    y -= 18;
    if (y < 50) { y = height-54; doc.addPage(); }
  }
  y -= 14;
  page.drawLine({ start: { x: 50, y }, end: { x: width-50, y }, thickness: 1, color: rgb(0.7,0.8,1) });
  return Buffer.from(await doc.save());
}

export async function GET(req, context) {
  const params = await context.params;
  const { userId } = params;
  const session = await getSessionFromCookies(req.cookies);
  if (!session || !["superadmin", "admin"].includes(session.role))
    return new NextResponse("No autorizado", { status: 403 });

  // Only allow one job per user at a time (short-lived! - per user)
  if (zipLocks.has(userId)) {
    return new NextResponse("Download en cola", { status: 429 });
  }
  const lock = (async () => {
    try {
      // Fetch user info
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId, 10) },
        select: {
          id: true, name: true, email: true,
          rfc: true, curp: true, domicilioFiscal: true, fechaIngreso: true,
          puesto: true, sueldo: true, horarioLaboral: true, plantelId: true,
          plantel: { select: { name: true } }
        },
      });
      if (!user) throw new Error("Usuario no encontrado");

      // Fetch docs
      const docs = await prisma.document.findMany({
        where: { userId: parseInt(userId, 10) },
        orderBy: { uploadedAt: "asc" }
      });

      // Prepare ZIP as a PassThrough stream
      const zipStream = new stream.PassThrough();
      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.pipe(zipStream);

      // Add ficha.pdf
      const fichaPdf = await createFichaPDF(user);
      archive.append(fichaPdf, { name: "FichaTecnica.pdf" });

      // Add each document file
      for (const doc of docs) {
        try {
          let full = doc.filePath.startsWith("/")
            ? path.join(process.cwd(), doc.filePath)
            : doc.filePath;
          const fname = `${doc.type}_v${doc.version}_${path.basename(doc.filePath)}`;
          await fs.access(full);
          archive.file(full, { name: `Documentos/${fname}` });
        } catch (e) {}
      }
      await archive.finalize();

      // Stream response
      return new NextResponse(zipStream, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="Expediente_${user.name.replace(/\W+/g,"_")}.zip"`,
        }
      });
    } finally {
      zipLocks.delete(userId);
    }
  })();
  zipLocks.set(userId, lock);
  const resp = await lock;
  return resp;
}
