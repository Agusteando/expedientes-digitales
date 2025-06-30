
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

export async function DELETE(req, context) {
  const params = await context.params;
  const { userId } = params;
  const session = await getSessionFromCookies(req.cookies);

  if (!session || !["superadmin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  if (
    session.role === "admin" &&
    (!user.plantelId || !(session.plantelesAdminIds || []).includes(user.plantelId))
  ) {
    return NextResponse.json({ error: "Solo puedes eliminar usuarios de tu plantel" }, { status: 403 });
  }
  // Prevent deleting self unless superadmin
  if (session.role !== "superadmin" && session.id === user.id) {
    return NextResponse.json({ error: "No puedes eliminar tu propio usuario" }, { status: 403 });
  }

  // Optionally: Clean up related data, but foreign key CASCADE would be best.
  await prisma.user.delete({ where: { id: user.id } });

  return NextResponse.json({ ok: true, deleted: user.id });
}
