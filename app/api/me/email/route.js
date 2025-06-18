
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-options";

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email ?? ""));
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  let data = {};
  try { data = await req.json(); } catch {}
  const { email } = data;
  if (!validEmail(email)) {
    return NextResponse.json({ error: "Correo electrónico inválido." }, { status: 400 });
  }
  // Email must be unique in User table
  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (exists && exists.id !== session.user.id) {
    return NextResponse.json({ error: "Correo ya registrado por otro usuario." }, { status: 409 });
  }
  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { email: email.toLowerCase().trim() }
  });
  return NextResponse.json({ ok: true, email: updated.email });
}
