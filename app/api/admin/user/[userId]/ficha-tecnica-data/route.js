
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET(req, context) {
  const params = await context.params;
  const session = await getSessionFromCookies(req.cookies);
  if (!session || !["superadmin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const userId = Number(params.userId);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        rfc: true,
        curp: true,
        domicilioFiscal: true,
        nss: true,
        fechaIngreso: true,
        puesto: true,
        horarioLaboral: true,
        plantelId: true,
        sustituyeA: true,
        fechaBajaSustituido: true,
      }
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ ficha: user });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 });
  }
}
