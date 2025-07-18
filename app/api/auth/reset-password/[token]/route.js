
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Validate token (GET)
export async function GET(context) {
  const params = await context.params;
  const { token } = params;
  if (!token || typeof token !== "string") {
    return NextResponse.json({ valid: false }, { status: 400 });
  }
  const tokenRow = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });
  if (
    !tokenRow ||
    tokenRow.used ||
    !tokenRow.user?.isActive ||
    !["employee", "candidate"].includes(tokenRow.user?.role) ||
    new Date(tokenRow.expiresAt) < new Date()
  ) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }
  return NextResponse.json({ valid: true, email: tokenRow.user.email, name: tokenRow.user.name }, { status: 200 });
}

// Actual reset (POST { password })
export async function POST(context) {
  const params = await context.params;
  const { token } = params;
  let data;
  try {
    data = await context.request.json();
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const { password } = data;
  if (!password || typeof password !== "string" || password.length < 7) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 7 caracteres." }, { status: 400 });
  }

  const tokenRow = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });
  if (
    !tokenRow ||
    tokenRow.used ||
    !tokenRow.user?.isActive ||
    !["employee", "candidate"].includes(tokenRow.user?.role) ||
    new Date(tokenRow.expiresAt) < new Date()
  ) {
    return NextResponse.json({ error: "El enlace ha expirado o ya fue utilizado." }, { status: 400 });
  }

  // Hash new password
  const hash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: tokenRow.userId },
      data: { passwordHash: hash },
    }),
    prisma.passwordResetToken.update({
      where: { id: tokenRow.id },
      data: { used: true },
    }),
  ]);

  return NextResponse.json({ ok: true }, { status: 200 });
}
