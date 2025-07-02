
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

  // For admin: prevent re-assigning users outside plantelesAdminIds, both for assigned plantel and for input users
  if (session.role === "admin") {
    if (!session.plantelesAdminIds?.includes(plantelIdInt)) {
      return NextResponse.json({ error: "No admin rights for plantel" }, { status: 403 });
    }
    // Check all target users are in-scope
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, plantelId: true }
    });
    const outOfScope = users.filter(
      u => !session.plantelesAdminIds.includes(u.plantelId)
    );
    if (outOfScope.length > 0) {
      return NextResponse.json({ error: "No puedes asignar usuarios fuera de tus planteles.", outOfScope }, { status: 403 });
    }
  }
  await prisma.user.updateMany({
    where: { id: { in: userIds } },
    data: { plantelId: plantelIdInt }
  });
  return NextResponse.json({ ok: true });
}
