
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

// PATCH { isActive: true/false }
export async function PATCH(req, context) {
  const params = await context.params;
  const { userId } = params;
  const session = await getSessionFromCookies(req.cookies);

  if (!session || !["superadmin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  let data;
  try { data = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }
  const { isActive } = data;

  if (typeof isActive !== "boolean") {
    return NextResponse.json({ error: "isActive debe ser booleano" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  // Restrict admins to only users in their own planteles
  if (
    session.role === "admin" &&
    (!user.plantelId || !(session.plantelesAdminIds || []).includes(user.plantelId))
  ) {
    return NextResponse.json({ error: "Solo puedes cambiar estatus de usuarios en tu plantel" }, { status: 403 });
  }
  // Prevent self-deactivation unless superadmin
  if (session.role !== "superadmin" && session.id === user.id) {
    return NextResponse.json({ error: "No puedes cambiar tu propio estatus" }, { status: 403 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { isActive },
    select: { id: true, isActive: true }
  });
  return NextResponse.json({ ok: true, user: updated });
}
