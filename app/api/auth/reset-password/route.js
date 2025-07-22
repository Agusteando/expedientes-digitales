
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * POST /api/auth/reset-password
 * Body: { token: string, password: string }
 * 1. Validate token exists, not expired or used
 * 2. Hash and set new password on user
 * 3. Mark token as used
 */
export async function POST(req) {
  let token = "", password = "";
  try {
    const body = await req.json();
    token = typeof body.token === "string" ? body.token : "";
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }
  // Validate password length
  if (!token || !password || password.length < 7) {
    return NextResponse.json({ error: "Datos insuficientes o contraseña inválida." }, { status: 400 });
  }
  let tokenRecord;
  try {
    tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });
    // Debug: check if token found
    if (!tokenRecord) {
      console.warn("[RESET PASSWORD] Token not found:", token);
    }
  } catch (e) {
    console.error("[RESET PASSWORD][DB TOKEN LOOKUP ERROR]", e);
    return NextResponse.json({ error: "Error al validar el enlace. Intente más tarde." }, { status: 500 });
  }
  if (
    !tokenRecord ||
    tokenRecord.used ||
    new Date(tokenRecord.expiresAt) < new Date() ||
    !tokenRecord.user ||
    !tokenRecord.user.isActive
  ) {
    return NextResponse.json({
      error: "El enlace de recuperación es inválido, expiró, o ya fue utilizado."
    }, { status: 400 });
  }

  // Hash new password
  let hash;
  try {
    hash = await bcrypt.hash(password, 10);
  } catch (e) {
    console.error("[RESET PASSWORD][HASH ERROR]", e);
    return NextResponse.json({ error: "No se pudo actualizar la contraseña." }, { status: 500 });
  }
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { passwordHash: hash }
      }),
      prisma.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { used: true }
      })
    ]);
  } catch (e) {
    console.error("[RESET PASSWORD][TRANSACTION ERROR]", e);
    return NextResponse.json({ error: "Ocurrió un error al actualizar la contraseña." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
