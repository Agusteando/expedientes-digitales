
import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import fs from "fs";
import path from "path";

const DOC_KEYS = [
  { key: "identificacion_oficial", label: "Identificación oficial" },
  { key: "foto_digital", label: "Foto digital" },
  { key: "curp", label: "CURP" },
  { key: "rfc", label: "RFC" },
  { key: "nss", label: "NSS" },
  { key: "acta_nacimiento", label: "Acta de nacimiento" },
  { key: "comprobante_domicilio", label: "Comprobante domicilio" },
  { key: "certificado_medico", label: "Certificado médico" },
  { key: "titulo_profesional", label: "Título/Certificaciones" },
  { key: "carta_recomendacion", label: "Cartas recomendación" },
  { key: "curriculum_vitae", label: "Currículum" },
  { key: "carta_no_penales", label: "Carta no penales" },
];

function safeField(val) {
  return val && String(val).trim().length > 0 ? String(val) : "-";
}
function formatDateField(val) {
  if (!val) return "-";
  let y, m, d;
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    [y, m, d] = val.split("-").map(Number);
  } else if (val instanceof Date) {
    const iso = val.toISOString().slice(0, 10);
    [y, m, d] = iso.split("-").map(Number);
  } else {
    const parts = String(val).split("T")[0].split("-");
    [y, m, d] = parts.map(Number);
  }
  if (!y || !m || !d) return "-";
  return `${d.toString().padStart(2,"0")}/${m.toString().padStart(2,"0")}/${y}`;
}

async function loadLogoImage() {
  const filePath = path.join(process.cwd(), "public/IMAGOTIPO-IECS-IEDIS.png");
  if (fs.existsSync(filePath)) {
    return new Uint8Array(fs.readFileSync(filePath));
  }
  throw new Error("Logo image not found at /public/IMAGOTIPO-IECS-IEDIS.png");
}

export async function GET(req, context) {
  const params = await context.params;
  const session = await getSessionFromCookies(req.cookies);
  if (!session || !["admin", "superadmin"].includes(session.role)) {
    return new NextResponse("No autorizado", { status: 403 });
  }

  const userId = Number(params.userId);
  if (!userId) return new NextResponse("userId inválido", { status: 400 });

  // Fetch ficha info + plantel signature names
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      picture: true,
      role: true,
      rfc: true,
      curp: true,
      domicilioFiscal: true,
      nss: true,
      fechaIngreso: true,
      puesto: true,
      horarioLaboral: true,
      plantel: { 
        select: { 
          id: true, 
          name: true, 
          label: true,
          direccion: true, 
          administracion: true, 
          coordinacionGeneral: true 
        } 
      },
      plantelId: true,
      sustituyeA: true,
      fechaBajaSustituido: true,
    }
  });
  if (!user) return new NextResponse("Usuario no encontrado", { status: 404 });

  // Fetch user's documents and checklist (required only)
  const documents = await prisma.document.findMany({
    where: { userId: user.id },
    select: { type: true },
  });
  const checklistItems = await prisma.checklistItem.findMany({
    where: { userId: user.id, required: true },
    select: { type: true, fulfilled: true },
  });

  // --- Document progress calculation ---
  let docsDone = 0, docsTotal = DOC_KEYS.length;
  let missingDocs = [];
  for (const d of DOC_KEYS) {
    const fulfilled = 
      checklistItems.find(c => c.type === d.key && c.fulfilled) ||
      documents.find(doc => doc.type === d.key);
    if (fulfilled) docsDone++;
    else missingDocs.push(d.label);
  }
  const progressPct = docsTotal ? Math.round((docsDone / docsTotal) * 100) : 0;

  // Gather signature names
  const firma1 = user.plantel?.direccion?.trim() || "(Por registrar)";
  const firma2 = user.plantel?.administracion?.trim() || "(Por registrar)";
  const firma3 = user.plantel?.coordinacionGeneral?.trim() || "(Por registrar)";

  // ----- Render PDF -----
  // A4 portrait: 595 x 842
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  const fontTitle = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontItal = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Header/Logo/Title
  const logoMargin = 32;
  const logoH = 68, logoW = 68;
  let y = height - 58;
  try {
    const logoData = await loadLogoImage();
    const pngLogo = await pdfDoc.embedPng(logoData);
    page.drawImage(pngLogo, {
      x: logoMargin,
      y: y - logoH + 16,
      width: logoW,
      height: logoH,
    });
  } catch {}

  page.drawText("IECS-IEDIS", {
    x: logoMargin + logoW + 14,
    y: y - 10,
    size: 19,
    font: fontTitle,
    color: rgb(0.15, 0.28, 0.45),
  });
  page.drawText("Ficha Técnica del Empleado", {
    x: logoMargin + logoW + 14,
    y: y - 34,
    size: 23,
    font: fontTitle,
    color: rgb(0.08, 0.48, 0.60),
  });

  page.drawRectangle({
    x: 0,
    y: y - 64,
    width,
    height: 2,
    color: rgb(0.13, 0.39, 0.70)
  });

  y -= 92;

  // Block: General Info
  const infoBlock = [
    ["Nombre", safeField(user.name)],
    ["Correo", safeField(user.email)],
    ["Plantel", safeField(user.plantel?.label || user.plantel?.name)],
    ["Puesto", safeField(user.puesto)],
    ["Domicilio fiscal", safeField(user.domicilioFiscal)],
    ["CURP", safeField(user.curp)],
    ["RFC", safeField(user.rfc)],
    ["NSS", safeField(user.nss)],
    ["Fecha de ingreso", formatDateField(user.fechaIngreso)],
    ["Horario laboral", safeField(user.horarioLaboral)],
    ["Sustituye a", safeField(user.sustituyeA)],
    ["Quién fue baja el", formatDateField(user.fechaBajaSustituido)],
  ];

  for (const [label, value] of infoBlock) {
    page.drawText(`${label}:`, { x: 50, y, font: fontTitle, size: 13, color: rgb(0.13,0.27,0.43) });
    page.drawText(value, { x: 170, y, font: fontReg, size: 13 });
    y -= 24;
  }

  // Document Progress
  y -= 10;
  page.drawRectangle({
    x: 38, y, width: width - 76, height: 1.2, color: rgb(0.77, 0.85, 0.97)
  });
  y -= 16;
  page.drawText("Progreso de Expediente Digital", {
    x: 50, y, size: 14, font: fontTitle, color: rgb(0.18, 0.32, 0.61)
  });

  y -= 21;
  page.drawText(`Documentos entregados: ${docsDone} de ${docsTotal} (${progressPct}%)`, {
    x: 50, y, size: 13, font: fontReg, color: progressPct === 100 ? rgb(0.12,0.35,0.19) : rgb(0.5,0.22,0.12)
  });

  y -= 18;

  if (missingDocs.length > 0) {
    page.drawText("Documentos pendientes:", {
      x: 60, y, size: 12, font: fontItal, color: rgb(0.7,0.18,0.18)
    });
    y -= 13;
    for (const md of missingDocs) {
      if (y < 95) { y = 600; }
      page.drawText("- " + md, {
        x: 75, y, size: 12, font: fontReg, color: rgb(0.7,0.22,0.18)
      });
      y -= 12;
    }
  } else {
    page.drawText("Todos los documentos obligatorios están entregados.", {
      x: 60, y, size: 13, font: fontTitle, color: rgb(0.14,0.56,0.29)
    });
    y -= 14;
  }

  // Firmas (bottom)
  y = Math.max(y, 140);

  // Calculate signatures Y offsets so that the middle one is lower
  const firmasY1 = 110;
  const firmasY2 = 90; // admin (middle) signature is lower to avoid overlap
  const firmasY3 = 110;
  const firmaW = 140;
  const gap = (width - 3*firmaW) / 4;

  // Dirección
  page.drawLine({
    start: { x: gap, y: firmasY1 },
    end:   { x: gap+firmaW, y: firmasY1 },
    thickness: 1,
    color: rgb(0.44,0.56,0.56)
  });
  page.drawText("Dirección", {
    x: gap+firmaW/2-32, y: firmasY1-18,
    font: fontItal, size: 12, color: rgb(0.22,0.32,0.52)
  });
  page.drawText(firma1, {
    x: gap+9, y: firmasY1+7,
    font: fontReg, size: 12, color: rgb(0.16,0.19,0.19)
  });

  // Administración
  const adminX = gap*2+firmaW;
  page.drawLine({
    start: { x: adminX, y: firmasY2 },
    end:   { x: adminX+firmaW, y: firmasY2 },
    thickness: 1,
    color: rgb(0.44,0.56,0.56)
  });
  page.drawText("Administración", {
    x: adminX+firmaW/2-47, y: firmasY2-18,
    font: fontItal, size: 12, color: rgb(0.22,0.32,0.52)
  });
  page.drawText(firma2, {
    x: adminX+9, y: firmasY2+7,
    font: fontReg, size: 12, color: rgb(0.16,0.19,0.19)
  });

  // Coordinación general
  const coordX = gap*3+firmaW*2;
  page.drawLine({
    start: { x: coordX, y: firmasY3 },
    end:   { x: coordX+firmaW, y: firmasY3 },
    thickness: 1,
    color: rgb(0.44,0.56,0.56)
  });
  page.drawText("Coordinación general", {
    x: coordX+firmaW/2-63, y: firmasY3-18,
    font: fontItal, size: 12, color: rgb(0.22,0.32,0.52)
  });
  page.drawText(firma3, {
    x: coordX+9, y: firmasY3+7,
    font: fontReg, size: 12, color: rgb(0.16,0.19,0.19)
  });

  page.drawRectangle({
    x: 0, y: 0, width, height: 32,
    color: rgb(0.11,0.31,0.60), opacity: 0.13
  });
  page.drawText("Plataforma de expedientes digitales IECS-IEDIS", {
    x: 38, y: 15, size: 12, color: rgb(0.21,0.25,0.33), font: fontItal,
  });

  const pdfBytes = await pdfDoc.save();
  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="FichaTecnica_${user.name.replace(/\W+/g,"_")}.pdf"`,
    }
  });
}
