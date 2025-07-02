
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET(req, context) {
  const params = await context.params;
  const session = await getSessionFromCookies(req.cookies);
  const plantelId = Number(params.plantelId);

  if (!session || !["superadmin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (session.role === "admin" && (!session.plantelesAdminIds || !session.plantelesAdminIds.includes(plantelId))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  // ... existing logic for users/progress
}
