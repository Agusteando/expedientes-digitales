
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

// PATCH: { plantelId }
export async function PATCH(req, context) {
  const params = await context.params;
  const { userId } = params;
  const session = await getSessionFromCookies(req.cookies);

  if (!session || !["superadmin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  let data;
  try { data = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const plantelIdInt = parseInt(data.plantelId, 10);
  if (isNaN(plantelIdInt)) return NextResponse.json({ error: "plantelId inválido" }, { status: 400 });

  // (Admins cannot assign planteles they don't manage)
  if (session.role === "admin" && (!session.plantelesAdminIds?.includes(plantelIdInt))) {
    return NextResponse.json({ error: "No autorizado para ese plantel" }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: parseInt(userId, 10) },
    data: { plantelId: plantelIdInt }
  });
  return NextResponse.json({ ok: true });
}
