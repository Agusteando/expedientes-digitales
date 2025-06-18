
import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

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

export async function GET(req, context) {
  const { userId } = context.params;
  const session = await getSessionFromCookies(req.cookies);
  if (!session || !["superadmin", "admin"].includes(session.role))
    return new NextResponse("No autorizado", { status: 403 });

  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId, 10) },
    select: {
      name: true, email: true,
      rfc: true, curp: true, domicilioFiscal: true, fechaIngreso: true,
      puesto: true, sueldo: true, horarioLaboral: true, plantelId: true,
      plantel: { select: { name: true } }
    },
  });
  if (!user) return new NextResponse("Usuario no encontrado", { status: 404 });

  // Compose PDF content
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

  const pdfBytes = await doc.save();

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="FichaTecnica_${user.name.replace(/\W+/g,"_")}.pdf"`,
    }
  });
}
