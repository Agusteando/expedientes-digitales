
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET(req) {
  const session = await getSessionFromCookies(req.cookies);
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const admins = await prisma.user.findMany({
    where: { role: "admin", isActive: true },
    select: { id: true, email: true, name: true, picture: true }
  });
  return NextResponse.json(admins);
}
