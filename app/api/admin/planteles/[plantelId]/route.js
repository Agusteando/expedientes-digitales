
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

export async function PATCH(req, context) {
  const params = await context.params;
  const { plantelId } = params;
  const session = await getSessionFromCookies(req.cookies);
  console.debug("[planteles/:plantelId][PATCH] session:", session ? `{id:${session.id},role:${session.role}}` : "none");

  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "Solo superadmin puede editar planteles." }, { status: 403 });
  }

  let data;
  try { data = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }
  const plantelIdInt = parseInt(plantelId, 10);
  if (isNaN(plantelIdInt)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  // Build object with only allowed fields, allow PATCH of new signature columns
  const allowed = ["name", "label", "direccion", "administracion", "coordinacionGeneral"];
  const updateData = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const v = data[key];
      updateData[key] = typeof v === "string" ? v.trim() : (v ?? null);
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Sin cambios o campos inválidos" }, { status: 400 });
  }

  const updated = await prisma.plantel.update({
    where: { id: plantelIdInt },
    data: updateData
  });

  return NextResponse.json(updated);
}

export async function DELETE(req, context) {
  const params = await context.params;
  const { plantelId } = params;
  const session = await getSessionFromCookies(req.cookies);
  console.debug("[planteles/:plantelId][DELETE] session:", session ? `{id:${session.id},role:${session.role}}` : "none");

  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "Solo superadmin puede borrar planteles." }, { status: 403 });
  }
  const plantelIdInt = parseInt(plantelId, 10);
  if (isNaN(plantelIdInt)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const usersAssigned = await prisma.user.findMany({
    where: { plantelId: plantelIdInt },
    select: { id: true, name: true, email: true }
  });
  const adminsAssigned = await prisma.user.findMany({
    where: { plantelesAdmin: { some: { id: plantelIdInt } } },
    select: { id: true, name: true, email: true }
  });
  console.debug("[planteles/:plantelId][DELETE] assigned users:", usersAssigned);
  console.debug("[planteles/:plantelId][DELETE] assigned admins:", adminsAssigned);

  if (usersAssigned.length > 0 || adminsAssigned.length > 0) {
    return NextResponse.json({
      error: "No se puede eliminar un plantel con usuarios/asignaciones.",
      usersAssigned, adminsAssigned
    }, { status: 400 });
  }

  await prisma.plantel.delete({ where: { id: plantelIdInt } });
  return NextResponse.json({ ok: true, deleted: plantelIdInt });
}
