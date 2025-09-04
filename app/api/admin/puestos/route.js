
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

// Create a single puesto
export async function POST(req, context) {
  const params = await context?.params;
  const session = await getSessionFromCookies(req.cookies);
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  let data;
  try { data = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }
  const name = (data?.name || "").trim();
  if (!name || name.length < 2) return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
  try {
    const existing = await prisma.puesto.findUnique({ where: { name } });
    let puesto;
    if (existing) {
      puesto = await prisma.puesto.update({ where: { name }, data: { active: true } });
    } else {
      puesto = await prisma.puesto.create({ data: { name, active: true } });
    }
    // Debug log
    // eslint-disable-next-line no-console
    console.log("[puestos][POST] created/activated:", { name, id: puesto.id });
    return NextResponse.json({ ok: true, puesto });
  } catch (e) {
    return NextResponse.json({ error: "Error al crear puesto" }, { status: 500 });
  }
}
