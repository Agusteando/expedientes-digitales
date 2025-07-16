
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

export async function PATCH(req, context) {
  const params = await context.params;
  const session = await getSessionFromCookies(req.cookies);
  if (!session || !["superadmin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const userId = Number(params.userId);
  let data;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  // Accept nss and all ficha fields
  const {
    rfc, curp, domicilioFiscal, nss, fechaIngreso, puesto, horarioLaboral, plantelId
  } = data;

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        rfc: rfc ?? null,
        curp: curp ?? null,
        domicilioFiscal: domicilioFiscal ?? null,
        nss: nss ?? null,
        fechaIngreso: fechaIngreso ? new Date(fechaIngreso) : null,
        puesto: puesto ?? null,
        horarioLaboral: horarioLaboral ?? null,
        plantelId: plantelId ? Number(plantelId) : null,
      }
    });
    return NextResponse.json({ ok: true, ficha: user });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 });
  }
}
