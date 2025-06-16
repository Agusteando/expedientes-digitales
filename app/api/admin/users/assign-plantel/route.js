
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

// POST: { userIds: [...], plantelId }
export async function POST(req, context) {
  const session = await getSessionFromCookies(req.cookies);
  // Extremely minimal log
  console.debug("[users/assign-plantel][POST] session:", session ? `{id:${session.id},role:${session.role}}` : "none");
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

  // Ensure plantelId is INT (fix: Prisma expects Int)
  const plantelIdInt = parseInt(plantelId, 10);
  if (Number.isNaN(plantelIdInt)) {
    return NextResponse.json({ error: "PlantelId debe ser un número" }, { status: 400 });
  }

  // Only allow assignment to plantel that admin manages (or all for superadmin)
  if (session.role === "admin" && session.plantelId !== plantelIdInt) {
    return NextResponse.json({ error: "No admin rights for that plantel" }, { status: 403 });
  }

  await prisma.user.updateMany({
    where: { id: { in: userIds } },
    data: { plantelId: plantelIdInt }
  });
  return NextResponse.json({ ok: true });
}
