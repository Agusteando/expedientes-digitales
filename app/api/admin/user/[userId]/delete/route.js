
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

export async function DELETE(req, context) {
  const params = await context.params;
  const { userId } = params;
  const session = await getSessionFromCookies(req.cookies);

  // Debug: log attempted deletion and acting role
  console.debug(`[user/${userId}/delete][DELETE] session:`, session ? `{id:${session.id},role:${session.role}}` : "none");

  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "Solo superadmin puede eliminar usuarios." }, { status: 403 });
  }

  const userIdInt = parseInt(userId, 10);
  if (isNaN(userIdInt)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  // Debug/log: target user info for traceability
  const user = await prisma.user.findUnique({
    where: { id: userIdInt },
    select: { id: true, name: true, email: true, role: true, plantelId: true }
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  // For safety, prevent removing other superadmins (optional, can be removed if not desired)
  if (user.role === "superadmin") {
    return NextResponse.json({ error: "No puedes eliminar a otro superadmin." }, { status: 403 });
  }

  // Delete user (will also delete related documents, checklistItems if onDelete: CASCADE exists in schema)
  await prisma.user.delete({ where: { id: userIdInt } });

  // Log: successful
  console.info(`[user/${userId}/delete] User deleted:`, user);

  return NextResponse.json({ ok: true, deleted: userIdInt });
}
