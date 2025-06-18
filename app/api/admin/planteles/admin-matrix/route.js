
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET(req, context) {
  const session = await getSessionFromCookies(req.cookies);
  if (!session || session.role !== "superadmin")
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const planteles = await prisma.plantel.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true }
  });
  const admins = await prisma.user.findMany({
    where: { role: { in: ["admin", "superadmin"] } },
    select: { id: true, name: true, email: true,
      plantelesAdmin: { select: { id: true } }
    },
    orderBy: { name: "asc" }
  });
  // Multimap: plantel id → Set of admin ids
  const assignments = {};
  for (const p of planteles)
    assignments[p.id] = [];
  for (const admin of admins) {
    for (const p of admin.plantelesAdmin)
      assignments[p.id].push(admin.id);
  }
  return NextResponse.json({
    planteles,
    admins,
    assignments
  });
}
