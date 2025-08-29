
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET(req, context) {
  const session = await getSessionFromCookies(req.cookies);
  if (!session || !["superadmin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const planteles = await prisma.plantel.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, label: true,
      direccion: true, administracion: true, coordinacionGeneral: true
    }
  });
  return NextResponse.json(planteles);
}

export async function POST(req, context) {
  const session = await getSessionFromCookies(req.cookies);
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  let data;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!data.name || typeof data.name !== "string" || data.name.length < 2) {
    return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
  }
  if (!data.label || typeof data.label !== "string" || data.label.length < 2) {
    return NextResponse.json({ error: "Etiqueta (label) inválida" }, { status: 400 });
  }
  const plantel = await prisma.plantel.create({
    data: { name: data.name, label: data.label }
  });
  return NextResponse.json(plantel);
}
