
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET(req, context) {
  const session = await getSessionFromCookies(req.cookies);
  // Only log essentials (omit tokens)
  console.debug("[admin-users][GET] session:", session ? `{id:${session.id},role:${session.role}}` : "none");
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "Solo superadmin" }, { status: 403 });
  }

  const admins = await prisma.user.findMany({
    where: { role: { in: ["admin", "superadmin"] } },
    include: { plantelesAdmin: { select: { id: true, name: true } } },
    orderBy: { name: "asc" }
  });

  return NextResponse.json(admins.map(a => ({
    id: a.id, name: a.name, email: a.email, role: a.role,
    plantelesAdmin: a.plantelesAdmin
  })));
}
