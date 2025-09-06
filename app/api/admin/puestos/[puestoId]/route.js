
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

export async function PATCH(req, context) {
  const params = await context.params;
  const { puestoId } = params;
  const session = await getSessionFromCookies(req.cookies);
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const id = parseInt(puestoId, 10);
  if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  let data;
  try { data = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const updates = {};
  if (typeof data.name === "string") {
    const name = data.name.trim();
    if (!name || name.length < 2) return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
    updates.name = name;
  }
  if (typeof data.active === "boolean") {
    updates.active = data.active;
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
  }
  try {
    const updated = await prisma.puesto.update({ where: { id }, data: updates });
    console.log("[puestos/:id][PATCH]", { id, updates });
    return NextResponse.json({ ok: true, puesto: updated });
  } catch (e) {
    return NextResponse.json({ error: "Error al actualizar puesto" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  const params = await context.params;
  const { puestoId } = params;
  const session = await getSessionFromCookies(req.cookies);
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const id = parseInt(puestoId, 10);
  if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  try {
    await prisma.puesto.delete({ where: { id } });
    console.log("[puestos/:id][DELETE]", { id, deleted: true });
    return NextResponse.json({ ok: true, deleted: id });
  } catch (e) {
    // If there is a constraint due to unique name use-case, fallback to soft-off
    try {
      await prisma.puesto.update({ where: { id }, data: { active: false } });
      console.log("[puestos/:id][DELETE->soft]", { id, deactivated: true });
      return NextResponse.json({ ok: true, deactivated: id });
    } catch (err) {
      return NextResponse.json({ error: "Error al eliminar/desactivar puesto" }, { status: 500 });
    }
  }
}
