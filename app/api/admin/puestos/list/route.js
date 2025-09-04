
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET(req, context) {
  const params = await context?.params;
  const session = await getSessionFromCookies(req.cookies);
  if (!session || !["admin", "superadmin"].includes(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const onlyActive = req.nextUrl.searchParams.get("active") === "1";
  try {
    const puestos = await prisma.puesto.findMany({
      where: onlyActive ? { active: true } : {},
      orderBy: [{ active: "desc" }, { name: "asc" }],
      select: { id: true, name: true, active: true, createdAt: true, updatedAt: true }
    });
    // Debug log
    // eslint-disable-next-line no-console
    console.log("[puestos/list][GET] user:", { id: session.id, role: session.role, count: puestos.length, onlyActive });
    return NextResponse.json({ puestos });
  } catch (e) {
    return NextResponse.json({ error: "Error al cargar puestos" }, { status: 500 });
  }
}
