
import { NextResponse } from "next/server";
import { fetchAllPlantelStats } from "@/lib/admin/plantelStats";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET(req) {
  const session = getSessionFromCookies(req.cookies);
  if (!session || !["superadmin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const stats = await fetchAllPlantelStats();
  return NextResponse.json(stats);
}
