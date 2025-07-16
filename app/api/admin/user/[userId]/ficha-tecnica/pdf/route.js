
import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import fs from "fs";
import path from "path";

// Load logo image as Uint8Array
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

  // Use a full-page layout (A4, portrait: 595 x 842)
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  // Fonts
  const fontTitle = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontItal = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Header with logo and title
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
  } catch {
    // Logo failed to load, no-op.
  }

  // Title block
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

  // Bar below header:
  page.drawRectangle({
    x: 0,
    y: y - 64,
    width,
    height: 2,
    color: rgb(0.13, 0.39, 0.70)
  });

  // Fields section starts here
  y -= 80;

  // --- 1: User and Plantel Block ---
  page.drawText("Nombre:", { x: 46, y, font: fontTitle, size: 14, color: rgb(0.12,0.3,0.4) });
  page.drawText(safeField(user.name), { x: 120, y, font: fontReg, size: 14 });
  page.drawText("Correo:", { x: 316, y, font: fontTitle, size: 13, color: rgb(0.26,0.26,0.32) });
  page.drawText(safeField(user.email), { x: 370, y, font: fontReg, size: 13 });
  y -= 26;

  page.drawText("Plantel:", { x: 46, y, font: fontTitle, size: 13, color: rgb(0.12,0.3,0.4)});
  page.drawText(safeField(user.plantel?.label || user.plantel?.name), { x: 106, y, font: fontReg, size: 13 });
  page.drawText("Puesto:", { x: 320, y, font: fontTitle, size: 13, color: rgb(0.12,0.3,0.4)});
  page.drawText(safeField(user.puesto), { x: 370, y, font: fontReg, size: 13 });
  y -= 22;

  page.drawText("Fecha de ingreso:", { x: 46, y, font: fontTitle, size: 12, color: rgb(0.12,0.3,0.4)});
  page.drawText(
    user.fechaIngreso ? new Date(user.fechaIngreso).toLocaleDateString("es-MX") : "-",
    { x: 158, y, font: fontReg, size: 13 }
  );
  page.drawText("Horario:", { x: 320, y, font: fontTitle, size: 13, color: rgb(0.12,0.3,0.4)});
  page.drawText(safeField(user.horarioLaboral), { x: 370, y, font: fontReg, size: 13 });
  y -= 30;

  // --- 2: Document IDs Block ---
  page.drawText("RFC:", { x: 46, y, font: fontTitle, size: 12, color: rgb(0.24,0.13,0.43)});
  page.drawText(safeField(user.rfc), { x: 80, y, font: fontReg, size: 12 });
  page.drawText("CURP:", { x: 186, y, font: fontTitle, size: 12, color: rgb(0.24,0.13,0.43)});
  page.drawText(safeField(user.curp), { x: 226, y, font: fontReg, size: 12 });
  page.drawText("NSS:", { x: 340, y, font: fontTitle, size: 12, color: rgb(0.24,0.13,0.43) });
  page.drawText(safeField(user.nss), { x: 380, y, font: fontReg, size: 12 });
  y -= 22;

  // --- 3: Address Block ---
  page.drawText("Domicilio fiscal:", { x: 46, y, font: fontTitle, size: 12, color: rgb(0.13,0.36,0.73) });
  page.drawText(safeField(user.domicilioFiscal), { x: 136, y, font: fontItal, size: 12, maxWidth: width-156 });
  y -= 38;

  // --- Divider for next section ---
  page.drawRectangle({
    x: 38,
    y: y,
    width: width - 76,
    height: 1.2,
    color: rgb(0.80, 0.87, 0.97)
  });
  y -= 25;

  // --- Signature Areas at Bottom ---

  const signatureBlockHeight = 90;
  const sigLineLength = 180;
  const sigBlockMargin = 60;

  // Prepare bottom signature areas
  const sigY = 82;
  // Left signature
  page.drawLine({
    start: { x: sigBlockMargin, y: sigY + 22 },
    end:   { x: sigBlockMargin + sigLineLength, y: sigY + 22 },
    thickness: 1,
    color: rgb(0.44,0.56,0.56)
  });
  page.drawText("Firma del empleado", {
    x: sigBlockMargin+26, y: sigY + 6,
    font: fontItal, size: 12, color: rgb(0.22,0.32,0.52)
  });
  // Right signature
  page.drawLine({
    start: { x: width - sigBlockMargin - sigLineLength, y: sigY + 22 },
    end:   { x: width - sigBlockMargin, y: sigY + 22 },
    thickness: 1,
    color: rgb(0.44,0.56,0.56)
  });
  page.drawText("Firma administración/dirección", {
    x: width - sigBlockMargin - sigLineLength + 12, y: sigY + 6,
    font: fontItal, size: 12, color: rgb(0.22,0.32,0.52)
  });

  // --- Footer Brand
  page.drawRectangle({
    x: 0, y: 0, width, height: 32,
    color: rgb(0.1,0.31,0.60), opacity: 0.13
  });
  page.drawText("Plataforma de expedientes digitales IECS-IEDIS", {
    x: 38, y: 15, size: 12, color: rgb(0.21,0.25,0.33), font: fontItal,
  });

  // --- Output as PDF stream
  const pdfBytes = await pdfDoc.save();
  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="FichaTecnica_${user.name.replace(/\W+/g,"_")}.pdf"`,
    }
  });
}
