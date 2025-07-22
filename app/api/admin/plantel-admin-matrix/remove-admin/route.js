
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

export async function DELETE(req, ctx) {
  const session = await getSessionFromCookies(req.cookies);
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  const admin = await prisma.user.findUnique({ where: { id } });
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "No es admin" }, { status: 404 });
  }
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
