
import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import fs from "fs";
import path from "path";

async function loadLogoImage() {
  let filePath = path.join(process.cwd(), "public/IMAGOTIPO-IECS-IEDIS.png");
  if (fs.existsSync(filePath)) {
    return new Uint8Array(fs.readFileSync(filePath));
  }
  throw new Error("Logo image not found at /public/IMAGOTIPO-IECS-IEDIS.png");
}

function safeField(val) {
  return val && String(val).trim().length > 0 ? String(val) : "-";
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
      id: true, name: true, email: true, picture: true, role: true,
      rfc: true, curp: true, domicilioFiscal: true, nss: true,
      fechaIngreso: true, puesto: true, horarioLaboral: true,
      plantel: { select: { name: true, label: true } },
    }
  });
  if (!user) return new NextResponse("Usuario no encontrado", { status: 404 });

  // Page: A4 portrait, 595 x 842
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  const fontTitle = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontItal = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Header con logo y título
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

  // Título
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

  // Más espacio entre bloques (separación extra)
  y -= 92;

  // ----- BLOQUE 1: Nombre/correo/plantel/puesto -----
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

  // Bloque extra espacio
  y -= 36;
  // ----- BLOQUE 2: Ingreso, horario, ID -----
  page.drawText("Fecha de ingreso:", { x: 50, y, font: fontTitle, size: 12, color: rgb(0.12,0.33,0.53)});
  page.drawText(
    user.fechaIngreso ? new Date(user.fechaIngreso).toLocaleDateString("es-MX") : "-",
    { x: 173, y, font: fontReg, size: 13 }
  );
  y -= 27;
  page.drawText("Horario:", { x: 50, y, font: fontTitle, size: 13, color: rgb(0.13,0.3,0.45) });
  page.drawText(safeField(user.horarioLaboral), { x: 140, y, font: fontReg, size: 13 });
  y -= 39;

  // ----- BLOQUE 3: RFC, CURP, NSS -----
  page.drawText("RFC:", { x: 50, y, font: fontTitle, size: 12, color: rgb(0.20,0.12,0.31)});
  page.drawText(safeField(user.rfc), { x: 110, y, font: fontReg, size: 12 });
  y -= 24;
  page.drawText("CURP:", { x: 50, y, font: fontTitle, size: 12, color: rgb(0.20,0.12,0.31) });
  page.drawText(safeField(user.curp), { x: 110, y, font: fontReg, size: 12 });
  y -= 24;
  page.drawText("NSS:", { x: 50, y, font: fontTitle, size: 12, color: rgb(0.20,0.12,0.31) });
  page.drawText(safeField(user.nss), { x: 110, y, font: fontReg, size: 12 });

  // Más espacio antes de domicilio
  y -= 42;
  // ----- BLOQUE 4: Domicilio fiscal -----
  page.drawText("Domicilio fiscal:", { x: 50, y, font: fontTitle, size: 12, color: rgb(0.21,0.38,0.67) });
  page.drawText(safeField(user.domicilioFiscal), { x: 160, y, font: fontItal, size: 12, maxWidth: width-170 });

  // Línea divisora fin de datos
  y -= 56;
  page.drawRectangle({
    x: 38, y, width: width - 76, height: 1.2, color: rgb(0.77, 0.85, 0.97)
  });

  // -- FIRMAS (abajo de la hoja: 3, bien distribuidas y con etiquetas) --
  //
  //   Dirección      Administración     Coordinación general
  // Cada una una línea de firma, etiqueta centrada debajo.

  const firmasY = 110;
  const firmaW = 140;
  const gap = (width - 3*firmaW) / 4;

  // Dirección (izquierda)
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

  // Administración (centro)
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

  // Coordinación general (derecha)
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

  // Footer
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
