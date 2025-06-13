
import { NextResponse } from "next/server";
import { fetchUnassignedUsers } from "@/lib/admin/plantelStats";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET(req) {
  const session = getSessionFromCookies(req.cookies);
  if (!session || !["superadmin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const users = await fetchUnassignedUsers();
  return NextResponse.json(users);
}
