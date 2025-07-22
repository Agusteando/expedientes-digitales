
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET(req) {
  const session = await getSessionFromCookies(req.cookies);
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  // List admins and their planteles
  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    select: {
      id: true, name: true, email: true, picture: true,
      plantelesAdmin: { select: { id: true, name: true } },
      isActive: true
    },
    orderBy: { name: "asc" }
  });
  const planteles = await prisma.plantel.findMany({
    select: { id: true, name: true, label: true },
    orderBy: { name: "asc" }
  });
  return NextResponse.json({
    admins,
    planteles,
  });
}
