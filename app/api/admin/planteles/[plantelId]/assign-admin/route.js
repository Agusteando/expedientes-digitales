
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

// POST: { adminUserId, action: "add" | "remove" }
export async function POST(req, context) {
  const params = await context.params;
  const { plantelId } = params;
  const session = await getSessionFromCookies(req.cookies);

  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "Solo superadmin puede asignar admins." }, { status: 403 });
  }

  let data;
  try { data = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }
  const { adminUserId, action } = data;
  const plantelIdInt = parseInt(plantelId, 10);
  const adminUserIdInt = parseInt(adminUserId, 10);

  if (isNaN(plantelIdInt) || isNaN(adminUserIdInt)) {
    return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
  }

  const adminUser = await prisma.user.findUnique({ where: { id: adminUserIdInt } });
  if (!adminUser || !["admin", "superadmin"].includes(adminUser.role)) {
    return NextResponse.json({ error: "Solo usuarios admin/superadmin se pueden asignar." }, { status: 400 });
  }

  if (action === "add") {
    await prisma.user.update({
      where: { id: adminUserIdInt },
      data: { plantelesAdmin: { connect: { id: plantelIdInt } } }
    });
  } else if (action === "remove") {
    await prisma.user.update({
      where: { id: adminUserIdInt },
      data: { plantelesAdmin: { disconnect: { id: plantelIdInt } } }
    });
  } else {
    return NextResponse.json({ error: "Acción no soportada" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
