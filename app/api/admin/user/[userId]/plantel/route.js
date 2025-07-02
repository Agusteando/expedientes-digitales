
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

// PATCH: assign user to plantel (like assign-plantel, single)
export async function PATCH(req, context) {
  const params = await context.params;
  const session = await getSessionFromCookies(req.cookies);
  if (!session || !["superadmin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  let data;
  try { data = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }
  const { plantelId } = data;
  const userId = Number(params.userId);

  if (!plantelId || isNaN(userId)) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }
  const plantelIdInt = parseInt(plantelId, 10);

  // For admin: must control BOTH assigning target plantel, and only own users
  if (session.role === "admin") {
    if (!session.plantelesAdminIds?.includes(plantelIdInt)) {
      return NextResponse.json({ error: "No admin rights for plantel" }, { status: 403 });
    }
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { plantelId: true } });
    if (!user || !session.plantelesAdminIds.includes(user.plantelId)) {
      return NextResponse.json({ error: "No puedes editar usuarios fuera de tus planteles." }, { status: 403 });
    }
  }
  await prisma.user.update({
    where: { id: userId },
    data: { plantelId: plantelIdInt }
  });
  return NextResponse.json({ ok: true });
}
