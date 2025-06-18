
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET(req, context) {
  const params = await context.params;
  const { userId } = params;
  const uid = parseInt(userId, 10);

  const session = await getSessionFromCookies(req.cookies);
  if (!session || !["superadmin", "admin"].includes(session.role))
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  // For admin, enforce plantel scope
  if (session.role === "admin") {
    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user || !session.plantelesAdminIds?.includes(user.plantelId)) {
      return NextResponse.json({ error: "No tienes permisos para ver este usuario" }, { status: 403 });
    }
  }
  const ficha = await prisma.user.findUnique({
    where: { id: uid },
    select: {
      rfc: true, curp: true, domicilioFiscal: true, fechaIngreso: true,
      puesto: true, sueldo: true, horarioLaboral: true, plantelId: true
    }
  });
  return NextResponse.json({ ficha });
}
