
import { NextResponse } from "next/server";
import { fetchAllPlantelStats } from "@/lib/admin/plantelStats";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET(req, context) {
  const session = await getSessionFromCookies(req.cookies);
  console.debug(
    "[planteles/progress][GET] session:",
    session ? `{id:${session.id},role:${session.role}}` : "none"
  );
  if (!session || !["superadmin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const stats = await fetchAllPlantelStats();
  return NextResponse.json(stats);
}
