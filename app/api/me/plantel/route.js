
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-options";
import prisma from "@/lib/prisma";

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  const { plantelId } = body;
  if (!plantelId || isNaN(parseInt(plantelId, 10))) {
    return NextResponse.json({ error: "Plantel inválido." }, { status: 400 });
  }
  // Validate Plantel exists
  const exists = await prisma.plantel.findUnique({ where: { id: parseInt(plantelId, 10) } });
  if (!exists) {
    return NextResponse.json({ error: "Plantel no existe." }, { status: 400 });
  }
  // Update user's plantelId
  await prisma.user.update({
    where: { id: session.user.id },
    data: { plantelId: parseInt(plantelId, 10) }
  });
  return NextResponse.json({ ok: true, plantelId: parseInt(plantelId, 10) });
}
