
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

// POST: { userIds: [...], plantelId }
export async function POST(req) {
  const session = getSessionFromCookies(req.cookies);
  if (!session || !["superadmin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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

  // Only allow assignment to plantel that admin manages (or all for superadmin)
  if (session.role === "admin" && session.plantelId !== plantelId) {
    return NextResponse.json({ error: "No admin rights for that plantel" }, { status: 403 });
  }

  await prisma.user.updateMany({
    where: { id: { in: userIds } },
    data: { plantelId }
  });
  return NextResponse.json({ ok: true });
}
