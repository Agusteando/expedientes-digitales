
import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import fs from "fs";
import path from "path";

// Define all ficha fields (sync with FIELDS in UserFichaTecnicaDrawer)
const FICHA_KEYS = [
  { key: "rfc", label: "RFC" },
  { key: "curp", label: "CURP" },
  { key: "domicilioFiscal", label: "Domicilio fiscal" },
  { key: "nss", label: "NSS" },
  { key: "fechaIngreso", label: "Fecha de ingreso" },
  { key: "puesto", label: "Puesto" },
  { key: "horarioLaboral", label: "Horario laboral" },
  { key: "plantel", label: "Plantel asignado" },
];

// User docs: only user-uploaded, mapped to meta docs
const DOC_KEYS = [
  { key: "identificacion_oficial", label: "Identificación oficial" },
  { key: "foto_digital", label: "Foto digital" },
  { key: "curp", label: "CURP (documento)" },
  { key: "rfc", label: "RFC (documento)" },
  { key: "nss", label: "NSS (documento)" },
  { key: "acta_nacimiento", label: "Acta nacimiento" },
  { key: "comprobante_domicilio", label: "Comprobante domicilio" },
  { key: "certificado_medico", label: "Certificado médico" },
  { key: "titulo_profesional", label: "Título/certificaciones" },
  { key: "carta_recomendacion", label: "Cartas recomendación" },
  { key: "curriculum_vitae", label: "Currículum" },
  { key: "carta_no_penales", label: "Carta no penales" },
  // Not including admin-only/proyectivos/etc in this PDF
];

async function loadLogoImage() {
  const filePath = path.join(process.cwd(), "public/IMAGOTIPO-IECS-IEDIS.png");
  if (fs.existsSync(filePath)) {
    return new Uint8Array(fs.readFileSync(filePath));
  }
  throw new Error("Logo image not found at /public/IMAGOTIPO-IECS-IEDIS.png");
}

function safeField(val) {
  return val && String(val).trim().length > 0 ? String(val) : "-";
}

/**
 * Clean, production-safe solution for displaying MySQL DATE fields.
 * Always outputs dd/mm/yyyy; never uses JS Date local/UTC parsing.
 */
function formatDateField(val) {
  if (!val) return "-";
  let y, m, d;
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    [y, m, d] = val.split("-").map(Number);
  } else if (val instanceof Date) {
    const iso = val.toISOString().slice(0, 10);
    [y, m, d] = iso.split("-").map(Number);
  } else {
    const parts = String(val).slice(0, 10).split("-");
    [y, m, d] = parts.map(Number);
  }
  if (!y || !m || !d) return "-";
  return `${d.toString().padStart(2,"0")}/${m.toString().padStart(2,"0")}/${y}`;
}

export async function GET(req, context) {
  const params = await context.params;
  const session = await getSessionFromCookies(req.cookies);

  if (!session || !["admin", "superadmin"].includes(session.role)) {
    return new NextResponse("No autorizado", { status: 403 });
  }

  const userId = Number(params.userId);
  if (!userId) return new NextResponse("userId inválido", { status: 400 });

  // Fetch ficha info
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
      plantel: { select: { name: true, label: true } },
      plantelId: true,
    }
  });
  if (!user) return new NextResponse("Usuario no encontrado", { status: 404 });

  // Fetch user's documents and checklist
  const documents = await prisma.document.findMany({
    where: { userId: user.id },
    select: { type: true },
  });
  const checklistItems = await prisma.checklistItem.findMany({
    where: { userId: user.id, required: true },
    select: { type: true, fulfilled: true },
  });

  // --- Prepare progress calculation ---
  // 1. Ficha fields
  let fichaFilled = 0, fichaTotal = FICHA_KEYS.length;
  let missingFicha = [];
  for (const f of FICHA_KEYS) {
    let val;
    if (f.key === "plantel") {
      val = user.plantel?.name || user.plantel?.label || "";
    } else if (f.key === "fechaIngreso") {
      val = user.fechaIngreso;
    } else {
      val = user[f.key];
    }
    if (val && String(val).trim().length > 0) fichaFilled++;
    else missingFicha.push(f.label);
  }

  // 2. Documents (map as "fulfilled" per checklist if available, else by uploaded doc type)
  let docsDone = 0, docsTotal = DOC_KEYS.length;
  let missingDocs = [];
  for (const d of DOC_KEYS) {
    // Check if checklist has it fulfilled, or if a doc of that type exists
    const fulfilled = 
      checklistItems.find(c => c.type === d.key && c.fulfilled) ||
      documents.find(doc => doc.type === d.key);
    if (fulfilled) docsDone++;
    else missingDocs.push(d.label);
  }

  // Compose final progress
  const totalProgress = fichaFilled + docsDone;
  const maxProgress = fichaTotal + docsTotal;
  const progressPct = maxProgress ? Math.round((totalProgress / maxProgress) * 100) : 0;

  // Now draw PDF
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

  // Block 1: Name/email/plantel/puesto
  page.drawText("Nombre:", { x: 50, y, font: fontTitle, size: 14, color: rgb(0.12,0.3,0.4) });
  page.drawText(safeField(user.name), { x: 140, y, font: fontReg, size: 14 });
  y -= 27;
  page.drawText("Correo:", { x: 50, y, font: fontTitle, size: 13, color: rgb(0.17,0.17,0.28) });
  page.drawText(safeField(user.email), { x: 140, y, font: fontReg, size: 13 });
  y -= 30;
  page.drawText("Plantel:", { x: 50, y, font: fontTitle, size: 13, color: rgb(0.11,0.31,0.44)});
  page.drawText(safeField(user.plantel?.label || user.plantel?.name), { x: 140, y, font: fontReg, size: 13 });
  y -= 27;
  page.drawText("Puesto:", { x: 50, y, font: fontTitle, size: 13, color: rgb(0.11,0.31,0.44)});
  page.drawText(safeField(user.puesto), { x: 140, y, font: fontReg, size: 13 });

  y -= 36;

  // Block 2: Ingreso, horario
  page.drawText("Fecha de ingreso:", { x: 50, y, font: fontTitle, size: 12, color: rgb(0.12,0.33,0.53)});
  page.drawText(
    formatDateField(user.fechaIngreso),
    { x: 173, y, font: fontReg, size: 13 }
  );
  y -= 27;
  page.drawText("Horario:", { x: 50, y, font: fontTitle, size: 13, color: rgb(0.13,0.3,0.45) });
  page.drawText(safeField(user.horarioLaboral), { x: 140, y, font: fontReg, size: 13 });
  y -= 39;

  // Block 3: RFC, CURP, NSS
  page.drawText("RFC:", { x: 50, y, font: fontTitle, size: 12, color: rgb(0.20,0.12,0.31)});
  page.drawText(safeField(user.rfc), { x: 110, y, font: fontReg, size: 12 });
  y -= 24;
  page.drawText("CURP:", { x: 50, y, font: fontTitle, size: 12, color: rgb(0.20,0.12,0.31) });
  page.drawText(safeField(user.curp), { x: 110, y, font: fontReg, size: 12 });
  y -= 24;
  page.drawText("NSS:", { x: 50, y, font: fontTitle, size: 12, color: rgb(0.20,0.12,0.31) });
  page.drawText(safeField(user.nss), { x: 110, y, font: fontReg, size: 12 });

  y -= 42;

  // Block 4: Domicilio fiscal
  page.drawText("Domicilio fiscal:", { x: 50, y, font: fontTitle, size: 12, color: rgb(0.21,0.38,0.67) });
  page.drawText(safeField(user.domicilioFiscal), { x: 160, y, font: fontItal, size: 12, maxWidth: width-170 });

  // ---- PROGRESS BLOCK ----
  y -= 60;
  page.drawRectangle({
    x: 38, y, width: width - 76, height: 1.2, color: rgb(0.77, 0.85, 0.97)
  });
  y -= 18;
  page.drawText("Resumen de expediente y documentos", {
    x: 50, y, size: 14, font: fontTitle, color: rgb(0.18, 0.32, 0.61)
  });

  y -= 20;
  page.drawText(`Progreso total: ${totalProgress} de ${maxProgress} campos (${progressPct}%)`, {
    x: 50, y, size: 13, font: fontReg, color: rgb(0.23,0.46,0.2)
  });

  y -= 19;

  // Show list of missing fields if any
  if (missingFicha.length > 0) {
    page.drawText("Faltan campos en ficha:", {
      x: 60, y, size: 12, font: fontItal, color: rgb(0.6,0.16,0.16)
    });
    y -= 16;
    for (const mf of missingFicha) {
      if (y < 95) { y = 600; }
      page.drawText("- " + mf, {
        x: 75, y, size: 12, font: fontReg, color: rgb(0.61,0.13,0.19)
      });
      y -= 15;
    }
  }

  // Show list of missing docs if any
  if (missingDocs.length > 0) {
    if (y < 95) { y = 600; }
    page.drawText("Faltan documentos digitales:", {
      x: 60, y, size: 12, font: fontItal, color: rgb(0.6,0.16,0.16)
    });
    y -= 16;
    for (const md of missingDocs) {
      if (y < 95) { y = 600; }
      page.drawText("- " + md, {
        x: 75, y, size: 12, font: fontReg, color: rgb(0.56,0.15,0.21)
      });
      y -= 15;
    }
  }

  // If everything is complete, print a note!
  if (missingFicha.length === 0 && missingDocs.length === 0) {
    page.drawText("¡Expediente digital completo!", {
      x: 60, y, size: 13, font: fontTitle, color: rgb(0.11,0.62,0.32)
    });
    y -= 14;
  }

  // Firmas (bottom)
  // Make sure y does not overflow footer
  y = Math.max(y, 160);

  const firmasY = 110;
  const firmaW = 140;
  const gap = (width - 3*firmaW) / 4;

  page.drawLine({
    start: { x: gap, y: firmasY },
    end:   { x: gap+firmaW, y: firmasY },
    thickness: 1,
    color: rgb(0.44,0.56,0.56)
  });
  page.drawText("Dirección", {
    x: gap+firmaW/2-32, y: firmasY-18,
    font: fontItal, size: 12, color: rgb(0.22,0.32,0.52)
  });

  const adminX = gap*2+firmaW;
  page.drawLine({
    start: { x: adminX, y: firmasY },
    end:   { x: adminX+firmaW, y: firmasY },
    thickness: 1,
    color: rgb(0.44,0.56,0.56)
  });
  page.drawText("Administración", {
    x: adminX+firmaW/2-47, y: firmasY-18,
    font: fontItal, size: 12, color: rgb(0.22,0.32,0.52)
  });

  const coordX = gap*3+firmaW*2;
  page.drawLine({
    start: { x: coordX, y: firmasY },
    end:   { x: coordX+firmaW, y: firmasY },
    thickness: 1,
    color: rgb(0.44,0.56,0.56)
  });
  page.drawText("Coordinación general", {
    x: coordX+firmaW/2-63, y: firmasY-18,
    font: fontItal, size: 12, color: rgb(0.22,0.32,0.52)
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
