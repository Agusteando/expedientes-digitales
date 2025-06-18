
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

// PATCH: ficha tecnica update for user { rfc, curp, domicilioFiscal, fechaIngreso, puesto, sueldo, horarioLaboral }
export async function PATCH(req, context) {
  const params = await context.params;
  const { userId } = params;
  const uid = parseInt(userId, 10);
  if (!uid) return NextResponse.json({ error: "Usuario inválido" }, { status: 400 });

  const session = await getSessionFromCookies(req.cookies);
  if (!session || !["superadmin", "admin"].includes(session.role))
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  let data;
  try { data = await req.json(); } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const allowedFields = ["rfc", "curp", "domicilioFiscal", "fechaIngreso", "puesto", "sueldo", "horarioLaboral", "plantelId"];
  const updateData = {};
  for (const k of allowedFields) if (k in data) updateData[k] = data[k];

  // Admins can only modify users in their own planteles
  if (session.role === "admin") {
    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user || !session.plantelesAdminIds?.includes(user.plantelId)) {
      return NextResponse.json({ error: "No tienes permisos para editar este usuario" }, { status: 403 });
    }
    // For plantelId change, only to their assigned planteles
    if ("plantelId" in updateData && !session.plantelesAdminIds?.includes(updateData.plantelId)) {
      return NextResponse.json({ error: "No permitido asignar a ese plantel" }, { status: 403 });
    }
  }

  // Superadmin can edit/assign any plantelId
  if (updateData.sueldo && typeof updateData.sueldo === "string")
    updateData.sueldo = Number(updateData.sueldo);

  if (updateData.fechaIngreso && typeof updateData.fechaIngreso === "string")
    updateData.fechaIngreso = new Date(updateData.fechaIngreso);

  const updated = await prisma.user.update({
    where: { id: uid },
    data: updateData,
    select: {
      id: true, rfc: true, curp: true, domicilioFiscal: true, fechaIngreso: true,
      puesto: true, sueldo: true, horarioLaboral: true, plantelId: true
    }
  });
  return NextResponse.json({ ok: true, ficha: updated });
}
