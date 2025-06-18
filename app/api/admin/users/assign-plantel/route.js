
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

export async function PATCH(req, context) {
  const session = await getSessionFromCookies(req.cookies);
  if (!session || !["superadmin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  let data;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { userIds, plantelId } = data;
  if (!Array.isArray(userIds) || !plantelId) {
    return NextResponse.json({ error: "Invalid arguments" }, { status: 400 });
  }
  const plantelIdInt = parseInt(plantelId, 10);

  if (session.role === "admin" && !session.plantelesAdminIds?.includes(plantelIdInt)) {
    return NextResponse.json({ error: "No admin rights for plantel" }, { status: 403 });
  }

  await prisma.user.updateMany({
    where: { id: { in: userIds } },
    data: { plantelId: plantelIdInt }
  });
  return NextResponse.json({ ok: true });
}
