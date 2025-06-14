
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET(req) {
  const session = getSessionFromCookies(req.cookies);
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "Solo superadmin" }, { status: 403 });
  }

  const admins = await prisma.user.findMany({
    where: {
      role: { in: ["admin", "superadmin"] }
    },
    include: {
      plantelesAdmin: { select: { id: true, name: true } }
    },
    orderBy: { name: "asc" }
  });

  return NextResponse.json(admins.map(a => ({
    id: a.id, name: a.name, email: a.email, role: a.role,
    plantelesAdmin: a.plantelesAdmin
  })));
}
