
import { NextResponse } from "next/server";
import { fetchUnassignedUsers } from "@/lib/admin/plantelStats";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET(req, context) {
  const session = await getSessionFromCookies(req.cookies);
  console.debug("[users/unassigned][GET] session:", session ? `{id:${session.id},role:${session.role}}` : "none");
  if (!session || !["superadmin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const users = await fetchUnassignedUsers();
  return NextResponse.json(users);
}
