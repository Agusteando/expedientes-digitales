
import { NextResponse } from "next/server";
const { getSigniaPool, getEva, waitEva } = require("../../../shared");

export async function GET(req, context) {
  const params = await context.params;
  const userId = params.userId;
  let signiaPool;
  try {
    signiaPool = getSigniaPool();
    // Find user's evaId
    const [[user]] = await signiaPool.query("SELECT evaId FROM `user` WHERE id=?", [userId]);
    if (!user || !user.evaId) {
      return new NextResponse("EVA ID no encontrado para este usuario", { status: 404 });
    }
    const eva = getEva();
    await waitEva(eva);
    // PDF as Buffer
    try {
      const pdfBuffer = await eva.downloadPDF(user.evaId);
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="eva_dictamen_${user.evaId}.pdf"`,
          "Cache-Control": "no-store, must-revalidate",
        }
      });
    } catch (e) {
      return new NextResponse("No se pudo obtener el dictamen EVA", { status: 404 });
    }
  } catch (err) {
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
