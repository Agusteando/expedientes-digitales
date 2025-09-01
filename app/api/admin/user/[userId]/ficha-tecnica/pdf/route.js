import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import fs from "fs";
import path from "path";

/**
 * Ultra-clean, clearly divided, elegant expediente cover.
 * - Full-page letterhead background (no extra logo)
 * - Spacious top margin, strong column separation with vertical rule
 * - Each field has its own row with a subtle divider
 * - Email / CURP / RFC stay on one line (auto-shrink), eliminating ugly wraps
 * - Better rhythm, consistent label width, improved vertical spacing
 * - Signature block anchored to bottom; middle signature slightly lower (-_-)
 * - Tiny "Signia" credit with logo, bottom-right
 */

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
  if (!fs.existsSync(filePath)) throw new Error(`${errorHint} (${filePath})`);
  return new Uint8Array(fs.readFileSync(filePath));
}

async function loadLetterhead() {
  const filePath = path.join(process.cwd(), "public", "CARTA-VERTICAL (SIMPLE) IECS-IEDIS.jpg");
  return ensureFileBytes(filePath, "No se encontró la hoja membretada");
}

async function fetchExternalImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo cargar imagen externa: ${url}`);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

// ---------- Typography / layout utilities ----------
function wrapText(text, font, size, maxWidth) {
  const words = String(text ?? "").split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      if (font.widthOfTextAtSize(w, size) > maxWidth) {
        // hard-break long tokens
        let chunk = "";
        for (const ch of w) {
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

function fitFontSizeToWidth(text, font, targetWidth, startSize = 12, minSize = 8) {
  let size = startSize;
  while (size > minSize && font.widthOfTextAtSize(text, size) > targetWidth) size -= 0.25;
  return size;
}

function drawSectionHeader(page, text, x, y, font, color) {
  page.drawText(text, { x, y, size: 13.5, font, color });
  page.drawRectangle({ x, y: y - 7, width: 220, height: 1.2, color, opacity: 0.25 });
  return y - 24;
}

/**
 * Draws a single labeled row with an optional one-line value.
 * Adds a subtle divider underneath to clearly separate rows.
 */
function drawRow({
  page,
  x,
  topY,
  colWidth,
  label,
  value,
  fonts,
  sizes,
  colors,
  options,
}) {
  const { labelFont, valueFont, italFont } = fonts;
  const { labelSize, valueSize, labelWidth, rowGap, singleLine } = sizes;
  const { labelColor, valueColor, dividerColor } = colors;

  // Label
  page.drawText(`${label}:`, {
    x,
    y: topY,
    size: labelSize,
    font: labelFont,
    color: labelColor,
  });

  // Value
  const vX = x + labelWidth;
  const vMax = Math.max(24, colWidth - labelWidth);
  let lowestY = topY;

  if (singleLine) {
    const fitted = fitFontSizeToWidth(value, valueFont, vMax, valueSize, 8);
    const textW = valueFont.widthOfTextAtSize(value, fitted);
    page.drawText(value, {
      x: vX,
      y: topY,
      size: fitted,
      font: valueFont,
      color: valueColor,
    });
  } else {
    const lines = wrapText(value, valueFont, valueSize, vMax);
    let y = topY;
    for (let i = 0; i < lines.length; i++) {
      page.drawText(lines[i], {
        x: vX,
        y,
        size: valueSize,
        font: valueFont,
        color: valueColor,
      });
      if (i < lines.length - 1) y -= valueSize + 2;
      lowestY = y;
    }
  }

  const nextY = Math.min(lowestY, topY) - rowGap;

  // Row divider
  page.drawRectangle({
    x,
    y: nextY + 6,
    width: colWidth,
    height: 0.6,
    color: dividerColor,
  });

  return nextY - 8; // extra breathing room after the divider
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

  // Signatures
  const firma1 = user.plantel?.direccion?.trim() || "(Por registrar)";
  const firma2 = user.plantel?.administracion?.trim() || "(Por registrar)";
  const firma3 = user.plantel?.coordinacionGeneral?.trim() || "(Por registrar)";

  // PDF
  const LETTER = [612, 792];
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage(LETTER);
  const { width, height } = page.getSize();

  // Fonts
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontItal = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Background
  try {
    const letterheadBytes = await loadLetterhead();
    const bgJpg = await pdfDoc.embedJpg(letterheadBytes);
    page.drawImage(bgJpg, { x: 0, y: 0, width, height });
  } catch {}

  // Layout constants (spacious)
  const Mx = 68;           // side margins
  const MyTop = 200;       // generous top margin
  const MyBottom = 168;    // reserved for signatures
  const gutter = 44;       // wide gutter between columns
  const colW = (width - Mx * 2 - gutter) / 2;

  const palette = {
    ink: rgb(0.08, 0.10, 0.12),
    blue: rgb(0.10, 0.22, 0.40),
    mute: rgb(0.78, 0.84, 0.90),
    rule: rgb(0.85, 0.90, 0.95),
    idColor: rgb(0.10, 0.16, 0.26),
  };

  // Title
  let y = height - MyTop;
  page.drawText("Expediente digital del empleado", {
    x: Mx,
    y,
    size: 18,
    font: fontBold,
    color: palette.blue,
  });

  // Progress chip (top-right)
  const chipText = `${docsDone}/${docsTotal}  •  ${progressPct}%`;
  const chipSize = 9.6;
  const chipPadX = 8;
  const chipPadY = 4;
  const chipW = fontReg.widthOfTextAtSize(chipText, chipSize) + chipPadX * 2;
  const chipH = chipSize + chipPadY * 2;
  const chipX = width - Mx - chipW;
  const chipY = y - 2;
  page.drawRectangle({
    x: chipX,
    y: chipY - chipH + 3,
    width: chipW,
    height: chipH,
    color: rgb(0.96, 0.98, 1),
    borderColor: rgb(0.76, 0.83, 0.93),
    borderWidth: 1,
  });
  page.drawText(chipText, {
    x: chipX + chipPadX,
    y: chipY - chipH + 3 + chipPadY + 1,
    size: chipSize,
    font: fontReg,
    color: palette.idColor,
  });

  y -= 18;
  page.drawRectangle({ x: Mx, y: y - 6, width: width - Mx * 2, height: 0.9, color: palette.rule });
  y -= 32;

  // Column headers
  let yL = drawSectionHeader(page, "Datos del empleado", Mx, y, fontBold, palette.blue);
  let yR = drawSectionHeader(page, "Identificación fiscal y social", Mx + colW + gutter, y, fontBold, palette.blue);

  // Vertical divider to clearly separate columns
  page.drawRectangle({
    x: Mx + colW + gutter / 2 - 0.5,
    y: MyBottom + 110,
    width: 1,
    height: y - (MyBottom + 110),
    color: palette.rule,
  });

  const fonts = { labelFont: fontBold, valueFont: fontReg, italFont: fontItal };
  const colors = { labelColor: palette.blue, valueColor: palette.ink, dividerColor: palette.rule };

  // Left column rows
  const commonSizes = { labelSize: 11.2, valueSize: 12.2, labelWidth: 126, rowGap: 14, singleLine: false };
  yL = drawRow({
    page,
    x: Mx,
    topY: yL,
    colWidth: colW,
    label: "Nombre",
    value: safeField(user.name),
    fonts,
    sizes: { ...commonSizes },
    colors,
    options: {},
  });
  yL = drawRow({
    page,
    x: Mx,
    topY: yL,
    colWidth: colW,
    label: "Correo",
    value: safeField(user.email),
    fonts,
    sizes: { ...commonSizes, valueSize: 11.8, singleLine: true }, // keep email on one line
    colors,
    options: {},
  });
  yL = drawRow({
    page,
    x: Mx,
    topY: yL,
    colWidth: colW,
    label: "Plantel",
    value: safeField(user.plantel?.label || user.plantel?.name),
    fonts,
    sizes: { ...commonSizes },
    colors,
    options: {},
  });
  yL = drawRow({
    page,
    x: Mx,
    topY: yL,
    colWidth: colW,
    label: "Puesto",
    value: safeField(user.puesto),
    fonts,
    sizes: { ...commonSizes },
    colors,
    options: {},
  });
  yL = drawRow({
    page,
    x: Mx,
    topY: yL,
    colWidth: colW,
    label: "Fecha de ingreso",
    value: formatDateField(user.fechaIngreso),
    fonts,
    sizes: { ...commonSizes },
    colors,
    options: {},
  });
  yL = drawRow({
    page,
    x: Mx,
    topY: yL,
    colWidth: colW,
    label: "Horario laboral",
    value: safeField(user.horarioLaboral),
    fonts,
    sizes: { ...commonSizes },
    colors,
    options: {},
  });

  // Right column rows (CURP/RFC single-line, smaller)
  yR = drawRow({
    page,
    x: Mx + colW + gutter,
    topY: yR,
    colWidth: colW,
    label: "Domicilio fiscal",
    value: safeField(user.domicilioFiscal),
    fonts,
    sizes: { ...commonSizes },
    colors,
    options: {},
  });
  yR = drawRow({
    page,
    x: Mx + colW + gutter,
    topY: yR,
    colWidth: colW,
    label: "CURP",
    value: safeField(user.curp),
    fonts,
    sizes: { ...commonSizes, valueSize: 10.4, singleLine: true },
    colors,
    options: {},
  });
  yR = drawRow({
    page,
    x: Mx + colW + gutter,
    topY: yR,
    colWidth: colW,
    label: "RFC",
    value: safeField(user.rfc),
    fonts,
    sizes: { ...commonSizes, valueSize: 10.4, singleLine: true },
    colors,
    options: {},
  });
  yR = drawRow({
    page,
    x: Mx + colW + gutter,
    topY: yR,
    colWidth: colW,
    label: "NSS",
    value: safeField(user.nss),
    fonts,
    sizes: { ...commonSizes, singleLine: true, valueSize: 11.2 },
    colors,
    options: {},
  });
  yR = drawRow({
    page,
    x: Mx + colW + gutter,
    topY: yR,
    colWidth: colW,
    label: "Sustituye a",
    value: safeField(user.sustituyeA),
    fonts,
    sizes: { ...commonSizes, singleLine: true },
    colors,
    options: {},
  });
  yR = drawRow({
    page,
    x: Mx + colW + gutter,
    topY: yR,
    colWidth: colW,
    label: "Baja de",
    value: formatDateField(user.fechaBajaSustituido),
    fonts,
    sizes: { ...commonSizes, singleLine: true },
    colors,
    options: {},
  });

  // Next section baseline (below shorter column)
  y = Math.min(yL, yR) - 18;

  // Estado del expediente
  y = drawSectionHeader(page, "Estado del expediente", Mx, y, fontBold, palette.blue);

  const barX = Mx;
  const barW = width - Mx * 2;
  const barH = 8.5;
  const barY = y - 8;

  // Track
  page.drawRectangle({ x: barX, y: barY, width: barW, height: barH, color: rgb(0.93, 0.95, 0.98) });
  // Fill
  const fillW = Math.max(2, Math.round((Math.min(100, Math.max(0, progressPct)) / 100) * barW));
  page.drawRectangle({
    x: barX,
    y: barY,
    width: fillW,
    height: barH,
    color: progressPct === 100 ? rgb(0.17, 0.55, 0.3) : rgb(0.16, 0.40, 0.74),
  });

  page.drawText(
    progressPct === 100 ? "Completado" : `Entregados ${docsDone}/${docsTotal} (${progressPct}%)`,
    { x: barX, y: barY + 12, size: 10.8, font: fontReg, color: palette.idColor }
  );

  // Missing docs (airy, capped)
  let listY = barY - 16;
  if (missingDocs.length > 0) {
    page.drawText("Pendientes:", { x: barX, y: listY, size: 10.6, font: fontItal, color: rgb(0.50, 0.20, 0.20) });
    listY -= 12;
    const maxList = 6;
    const bulletMaxWidth = barW - 24;
    let shown = 0;
    for (const md of missingDocs) {
      if (shown >= maxList || listY < MyBottom + 96) break;
      const lines = wrapText(`• ${md}`, fontReg, 10.2, bulletMaxWidth);
      for (const ln of lines) {
        if (listY < MyBottom + 96) break;
        page.drawText(ln, { x: barX + 14, y: listY, size: 10.2, font: fontReg, color: rgb(0.40, 0.16, 0.16) });
        listY -= 11.5;
      }
      shown++;
    }
    if (missingDocs.length > shown) {
      page.drawText(`+ ${missingDocs.length - shown} más`, {
        x: barX + 14,
        y: listY,
        size: 9.8,
        font: fontItal,
        color: rgb(0.35, 0.14, 0.14),
      });
    }
  }

  // ----- Signatures (anchored to bottom, -_- layout) -----
  const sigBase = MyBottom;
  const lineY = sigBase + 72;
  const nameY = lineY - 14;
  const roleY = nameY - 12;

  const innerPad = 20;
  const usableW = width - (Mx + innerPad) * 2;
  const slotW = usableW / 3;

  const signatures = [
    { title: "Dirección", name: firma1 },
    { title: "Administración", name: firma2 }, // center, lowered
    { title: "Coordinación general", name: firma3 },
  ];

  for (let i = 0; i < 3; i++) {
    const slotX = Mx + innerPad + i * slotW;
    const lW = Math.min(200, slotW - 24);
    const lX = slotX + (slotW - lW) / 2;

    const delta = i === 1 ? -10 : 0;

    // line
    page.drawLine({
      start: { x: lX, y: lineY + delta },
      end: { x: lX + lW, y: lineY + delta },
      thickness: 1,
      color: rgb(0.44, 0.54, 0.60),
    });

    // name
    const nm = signatures[i].name;
    const nmMax = lW - 10;
    const nmSize = fitFontSizeToWidth(nm, fontReg, nmMax, 10.8, 8.2);
    const nmW = fontReg.widthOfTextAtSize(nm, nmSize);
    page.drawText(nm, {
      x: lX + (lW - nmW) / 2,
      y: nameY + delta,
      size: nmSize,
      font: fontReg,
      color: rgb(0.12, 0.14, 0.16),
    });

    // role
    const rl = signatures[i].title;
    const rlSize = 10;
    const rlW = fontItal.widthOfTextAtSize(rl, rlSize);
    page.drawText(rl, {
      x: lX + (lW - rlW) / 2,
      y: roleY + delta,
      size: rlSize,
      font: fontItal,
      color: rgb(0.20, 0.30, 0.48),
    });
  }

  // Fine baseline above signatures
  page.drawRectangle({
    x: Mx,
    y: sigBase + 98,
    width: width - Mx * 2,
    height: 0.8,
    color: palette.mute,
    opacity: 0.6,
  });

  // Generated date (subtle)
  page.drawText(`Generado: ${formatDateField(new Date())}`, {
    x: Mx,
    y: sigBase + 18,
    size: 8.5,
    font: fontItal,
    color: rgb(0.30, 0.34, 0.40),
  });

  // Tiny credit with logo + "Signia"
  try {
    const signiaBytes = await fetchExternalImage("https://colaborador.casitaapps.com/signia.png");
    const signiaPng = await pdfDoc.embedPng(signiaBytes);
    const logoH = 10;
    const logoW = (signiaPng.width / signiaPng.height) * logoH;
    const creditY = sigBase + 16;
    const creditX = width - Mx - 100;

    page.drawImage(signiaPng, { x: creditX, y: creditY, width: logoW, height: logoH, opacity: 0.92 });
    page.drawText("Signia", {
      x: creditX + logoW + 6,
      y: creditY + 2,
      size: 8,
      font: fontReg,
      color: rgb(0.28, 0.32, 0.38),
    });
  } catch {
    page.drawText("Signia", {
      x: width - Mx - 50,
      y: sigBase + 18,
      size: 8,
      font: fontReg,
      color: rgb(0.28, 0.32, 0.38),
    });
  }

  // Output
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
