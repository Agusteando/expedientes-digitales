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
  return `${d.toString().padStart(2, "0")}/${m.toString().padStart(2, "0")}/${y}`;
}

function ensureFileBytes(filePath, errorHint) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${errorHint} (${filePath})`);
  }
  return new Uint8Array(fs.readFileSync(filePath));
}

async function loadLetterhead() {
  const filePath = path.join(process.cwd(), "public", "CARTA-VERTICAL (SIMPLE) IECS-IEDIS.jpg");
  return ensureFileBytes(filePath, "No se encontró la carta/hoja membretada");
}

async function fetchExternalImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo cargar imagen externa: ${url}`);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

function wrapText(text, font, size, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line.length ? `${line} ${w}` : w;
    const wWidth = font.widthOfTextAtSize(test, size);
    if (wWidth <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      if (font.widthOfTextAtSize(w, size) > maxWidth) {
        let chunk = "";
        for (const ch of w.split("")) {
          const t2 = chunk + ch;
          if (font.widthOfTextAtSize(t2, size) <= maxWidth) chunk = t2;
          else {
            if (chunk) lines.push(chunk);
            chunk = ch;
          }
        }
        line = chunk;
      } else {
        line = w;
      }
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawFieldRow(opts) {
  const {
    page,
    label,
    value,
    x,
    y,
    labelFont,
    valueFont,
    labelSize,
    valueSize,
    labelColor,
    valueColor,
    lineMaxWidth,
    valueOffsetX = 124,
    rowGapAfter = 16,
  } = opts;

  page.drawText(`${label}:`, {
    x,
    y,
    size: labelSize,
    font: labelFont,
    color: labelColor,
  });

  const vX = x + valueOffsetX;
  const maxWidth = lineMaxWidth - valueOffsetX;
  const lines = wrapText(value, valueFont, valueSize, maxWidth);
  let yy = y;
  lines.forEach((ln, i) => {
    page.drawText(ln, {
      x: vX,
      y: yy,
      size: valueSize,
      font: valueFont,
      color: valueColor,
    });
    if (i < lines.length - 1) yy -= valueSize + 3;
  });

  return yy - rowGapAfter;
}

function fitFontSizeToWidth(text, font, targetWidth, startSize = 11, minSize = 7) {
  let size = startSize;
  while (size > minSize && font.widthOfTextAtSize(text, size) > targetWidth) {
    size -= 0.25;
  }
  return size;
}

export async function GET(req, context) {
  const params = await context.params;
  const session = await getSessionFromCookies(req.cookies);
  if (!session || !["admin", "superadmin"].includes(session.role)) {
    return new NextResponse("No autorizado", { status: 403 });
  }

  const userId = Number(params.userId);
  if (!userId) return new NextResponse("userId inválido", { status: 400 });

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
          coordinacionGeneral: true,
        },
      },
      plantelId: true,
      sustituyeA: true,
      fechaBajaSustituido: true,
    },
  });
  if (!user) return new NextResponse("Usuario no encontrado", { status: 404 });

  const [documents, checklistItems] = await Promise.all([
    prisma.document.findMany({ where: { userId: user.id }, select: { type: true } }),
    prisma.checklistItem.findMany({
      where: { userId: user.id, required: true },
      select: { type: true, fulfilled: true },
    }),
  ]);

  let docsDone = 0;
  const docsTotal = DOC_KEYS.length;
  const missingDocs = [];
  for (const d of DOC_KEYS) {
    const fulfilled =
      checklistItems.find((c) => c.type === d.key && c.fulfilled) ||
      documents.find((doc) => doc.type === d.key);
    if (fulfilled) docsDone++;
    else missingDocs.push(d.label);
  }
  const progressPct = docsTotal ? Math.round((docsDone / docsTotal) * 100) : 0;

  const firma1 = user.plantel?.direccion?.trim() || "(Por registrar)";
  const firma2 = user.plantel?.administracion?.trim() || "(Por registrar)";
  const firma3 = user.plantel?.coordinacionGeneral?.trim() || "(Por registrar)";

  const LETTER = [612, 792];
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage(LETTER);
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontItal = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  try {
    const letterheadBytes = await loadLetterhead();
    const bgJpg = await pdfDoc.embedJpg(letterheadBytes);
    page.drawImage(bgJpg, { x: 0, y: 0, width, height });
  } catch {}

  const M = 54;
  const gutter = 30;
  const colW = (width - M * 2 - gutter) / 2;

  // Slightly larger top margin (content starts a bit lower)
  let y = height - 156;

  const title = "Expediente digital del empleado";
  page.drawText(title, {
    x: M,
    y,
    size: 18,
    font: fontBold,
    color: rgb(0.12, 0.24, 0.42),
  });
  y -= 8;
  page.drawRectangle({
    x: M,
    y: y - 6,
    width: 260,
    height: 2,
    color: rgb(0.12, 0.24, 0.42),
    opacity: 0.3,
  });
  y -= 28;

  const infoLeft = [
    ["Nombre", safeField(user.name)],
    ["Correo", safeField(user.email)],
    ["Plantel", safeField(user.plantel?.label || user.plantel?.name)],
    ["Puesto", safeField(user.puesto)],
    ["Fecha de ingreso", formatDateField(user.fechaIngreso)],
    ["Horario laboral", safeField(user.horarioLaboral)],
  ];
  const infoRight = [
    ["Domicilio fiscal", safeField(user.domicilioFiscal)],
    ["CURP", safeField(user.curp)],
    ["RFC", safeField(user.rfc)],
    ["NSS", safeField(user.nss)],
    ["Sustituye a", safeField(user.sustituyeA)],
    ["Baja de", formatDateField(user.fechaBajaSustituido)],
  ];

  let yLeft = y;
  let yRight = y;

  // Left column
  for (const [label, value] of infoLeft) {
    const isCompact = label === "Plantel" || label === "Correo";
    yLeft = drawFieldRow({
      page,
      label,
      value,
      x: M,
      y: yLeft,
      labelFont: fontBold,
      valueFont: fontReg,
      labelSize: 12.2,
      valueSize: isCompact ? 11.8 : 12.2,
      labelColor: rgb(0.14, 0.27, 0.45),
      valueColor: rgb(0.1, 0.1, 0.1),
      lineMaxWidth: colW,
      valueOffsetX: 124,
      rowGapAfter: 16,
    });
  }

  // Right column with slightly smaller CURP/RFC values
  for (const [label, value] of infoRight) {
    const isIdCode = label === "CURP" || label === "RFC";
    yRight = drawFieldRow({
      page,
      label,
      value,
      x: M + colW + gutter,
      y: yRight,
      labelFont: fontBold,
      valueFont: fontReg,
      labelSize: 12.2,
      valueSize: isIdCode ? 11 : 12.2,
      labelColor: rgb(0.14, 0.27, 0.45),
      valueColor: rgb(0.1, 0.1, 0.1),
      lineMaxWidth: colW,
      valueOffsetX: 124,
      rowGapAfter: 16,
    });
  }

  y = Math.min(yLeft, yRight) - 8;

  const panelTop = y;
  const panelX = M;
  const panelW = width - M * 2;
  let panelH = 120;
  if (missingDocs.length > 0) {
    const approxLines = missingDocs.length;
    panelH += Math.min(approxLines * 12, 120);
  }

  const FOOTER_H = 158;
  if (panelTop - panelH < FOOTER_H + 24) {
    panelH = Math.max(110, panelTop - (FOOTER_H + 24));
  }

  page.drawRectangle({
    x: panelX,
    y: panelTop - panelH,
    width: panelW,
    height: panelH,
    color: rgb(0.96, 0.98, 1),
    opacity: 0.85,
  });
  page.drawRectangle({
    x: panelX,
    y: panelTop - panelH,
    width: panelW,
    height: panelH,
    borderColor: rgb(0.69, 0.79, 0.92),
    borderWidth: 1.2,
    opacity: 0.95,
  });

  page.drawText("Expediente digital", {
    x: panelX + 14,
    y: panelTop - 28,
    size: 14.5,
    font: fontBold,
    color: rgb(0.16, 0.31, 0.56),
  });

  const barX = panelX + 14;
  const barY = panelTop - 56;
  const barW = panelW - 28;
  const barH = 10.5;

  page.drawRectangle({ x: barX, y: barY, width: barW, height: barH, color: rgb(0.9, 0.93, 0.97) });

  const fillW = Math.max(2, Math.round((Math.min(100, Math.max(0, progressPct)) / 100) * barW));
  const fillColor = progressPct === 100 ? rgb(0.15, 0.55, 0.28) : rgb(0.96, 0.63, 0.2);
  page.drawRectangle({ x: barX, y: barY, width: fillW, height: barH, color: fillColor });

  page.drawText(`Entregados: ${docsDone}/${docsTotal} (${progressPct}%)`, {
    x: barX,
    y: barY + 14,
    size: 11.5,
    font: fontReg,
    color: rgb(0.12, 0.16, 0.23),
  });

  let yy = barY - 18;
  if (missingDocs.length > 0) {
    page.drawText("Pendientes:", {
      x: barX,
      y: yy,
      size: 11.5,
      font: fontItal,
      color: rgb(0.62, 0.21, 0.21),
    });
    yy -= 14;
    const bulletMaxWidth = barW - 6;
    for (const md of missingDocs) {
      const lines = wrapText(`• ${md}`, fontReg, 11, bulletMaxWidth);
      for (const ln of lines) {
        if (yy < panelTop - panelH + 14) break;
        page.drawText(ln, {
          x: barX + 6,
          y: yy,
          size: 11,
          font: fontReg,
          color: rgb(0.49, 0.18, 0.18),
        });
        yy -= 12;
      }
      if (yy < panelTop - panelH + 14) break;
    }
  } else {
    page.drawText("Completado", {
      x: barX,
      y: yy,
      size: 12,
      font: fontBold,
      color: rgb(0.13, 0.55, 0.3),
    });
  }

  // Signatures — anchored to bottom, middle lowered (-_-)
  const sigAreaTop = FOOTER_H;
  const baseLineY = sigAreaTop + 68;
  const baseNameY = baseLineY - 14;
  const baseRoleY = baseNameY - 12;

  const sigCount = 3;
  const innerPad = 22;
  const sigTotalW = width - (M + innerPad) * 2;
  const sigSlotW = sigTotalW / sigCount;

  const signatures = [
    { title: "Dirección", name: firma1 },
    { title: "Administración", name: firma2 }, // middle (to be lowered)
    { title: "Coordinación general", name: firma3 },
  ];

  for (let i = 0; i < signatures.length; i++) {
    const slotX = M + innerPad + i * sigSlotW;
    const lineW = Math.min(180, sigSlotW - 20);
    const lineX = slotX + (sigSlotW - lineW) / 2;

    // Lower the middle signature slightly for the -_- layout
    const deltaY = i === 1 ? -8 : 0;
    const lineY = baseLineY + deltaY;
    const nameY = baseNameY + deltaY;
    const roleY = baseRoleY + deltaY;

    page.drawLine({
      start: { x: lineX, y: lineY },
      end: { x: lineX + lineW, y: lineY },
      thickness: 1.1,
      color: rgb(0.36, 0.46, 0.53),
    });

    const nameMax = lineW - 8;
    const nameSize = fitFontSizeToWidth(signatures[i].name, fontReg, nameMax, 10.5, 8);
    const nameTextW = fontReg.widthOfTextAtSize(signatures[i].name, nameSize);
    page.drawText(signatures[i].name, {
      x: lineX + (lineW - nameTextW) / 2,
      y: nameY,
      size: nameSize,
      font: fontReg,
      color: rgb(0.12, 0.15, 0.17),
    });

    const roleSize = 10;
    const roleTextW = fontItal.widthOfTextAtSize(signatures[i].title, roleSize);
    page.drawText(signatures[i].title, {
      x: lineX + (lineW - roleTextW) / 2,
      y: roleY,
      size: roleSize,
      font: fontItal,
      color: rgb(0.19, 0.29, 0.49),
    });
  }

  // Tiny credit with logo + "Signia"
  try {
    const signiaBytes = await fetchExternalImage("https://colaborador.casitaapps.com/signia.png");
    const signiaPng = await pdfDoc.embedPng(signiaBytes);
    const logoH = 10;
    const logoW = (signiaPng.width / signiaPng.height) * logoH;
    const creditY = sigAreaTop + 18;
    const creditX = width - M - 90;

    page.drawImage(signiaPng, {
      x: creditX,
      y: creditY,
      width: logoW,
      height: logoH,
      opacity: 0.9,
    });

    const creditText = "Signia";
    const cSize = 8;
    page.drawText(creditText, {
      x: creditX + logoW + 6,
      y: creditY + 2,
      size: cSize,
      font: fontReg,
      color: rgb(0.28, 0.32, 0.38),
    });
  } catch {
    page.drawText("Signia", {
      x: width - M - 50,
      y: sigAreaTop + 20,
      size: 8,
      font: fontReg,
      color: rgb(0.28, 0.32, 0.38),
    });
  }

  page.drawRectangle({
    x: M,
    y: sigAreaTop + 92,
    width: width - M * 2,
    height: 0.8,
    color: rgb(0.7, 0.78, 0.88),
    opacity: 0.6,
  });

  const pdfBytes = await pdfDoc.save();
  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="FichaTecnica_${safeField(user.name).replace(/\W+/g, "_")}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
