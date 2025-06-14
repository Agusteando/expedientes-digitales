
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

export async function PATCH(req, context) {
  const params = await context.params;
  const { plantelId } = params;
  const session = getSessionFromCookies(req.cookies);

  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "Solo superadmin puede renombrar planteles." }, { status: 403 });
  }

  let data;
  try { data = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }
  if (!data.name || typeof data.name !== "string" || data.name.length < 2) {
    return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
  }
  const plantelIdInt = parseInt(plantelId, 10);
  if (isNaN(plantelIdInt)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const updated = await prisma.plantel.update({
    where: { id: plantelIdInt },
    data: { name: data.name.trim() }
  });

  return NextResponse.json(updated);
}

export async function DELETE(req, context) {
  const params = await context.params;
  const { plantelId } = params;
  const session = getSessionFromCookies(req.cookies);

  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "Solo superadmin puede borrar planteles." }, { status: 403 });
  }
  const plantelIdInt = parseInt(plantelId, 10);
  if (isNaN(plantelIdInt)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const userOrAdminAssigned = await prisma.user.count({
    where: {
      OR: [
        { plantelId: plantelIdInt },
        { plantelesAdmin: { some: { id: plantelIdInt } } }
      ]
    }
  });
  if (userOrAdminAssigned > 0) {
    return NextResponse.json({ error: "No se puede eliminar un plantel con usuarios/asignaciones." }, { status: 400 });
  }

  await prisma.plantel.delete({ where: { id: plantelIdInt } });
  return NextResponse.json({ ok: true, deleted: plantelIdInt });
}
