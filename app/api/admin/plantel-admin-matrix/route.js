
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

// Returns all admins and all planteles as columns for matrix
export async function GET(req) {
  const session = await getSessionFromCookies(req.cookies);
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  // Fetch all admins (role=admin) with their plantelesAdmin
  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    select: {
      id: true,
      name: true,
      email: true,
      picture: true,
      plantelesAdmin: { select: { id: true, name: true } },
      isActive: true,
    },
    orderBy: { name: "asc" }
  });
  // Fetch all planteles (as columns, always show all)
  const planteles = await prisma.plantel.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });

  return NextResponse.json({ admins, planteles });
}
