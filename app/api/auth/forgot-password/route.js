
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendResetPasswordEmail } from "@/lib/gmail";

/**
 * Handle forgot-password POST: create token, store, send email.
 * Always respond truthfully: on backend error, return error code and never success.
 */
export async function POST(req) {
  let data;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  if (!email) {
    return NextResponse.json({ error: "Correo electrónico requerido." }, { status: 400 });
  }

  // Always return generic response except for server errors.
  // Don't reveal user existence for security, but handle backend/email failures safely.
  let user;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch (e) {
    console.error("[FORGOT PASSWORD PRISMA ERROR]", e);
    return NextResponse.json({ error: "Error del servidor. Intenta más tarde." }, { status: 500 });
  }

  // If user not found, do NOT indicate it (avoid account enumeration)—simulate success, but skip send:
  if (!user || !user.isActive) {
    // Return success but do not attempt to send email or store token.
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Generate a token, store, attempt email. Ensure all errors are explicit and cause a non-200.
  const crypto = await import("crypto");
  const rawToken = crypto.randomBytes(32).toString("hex");
  const token = rawToken;
  const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

  // Delete any previous tokens for this user, then create a new one.
  try {
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: expires
      }
    });
  } catch (err) {
    console.error("[FORGOT PASSWORD TOKEN CREATE ERROR]", err);
    return NextResponse.json({ error: "No se pudo generar el enlace, intenta más tarde." }, { status: 500 });
  }

  // Construct a reset link for the email.
  const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "https://iecs-iedis.com";
  const resetLink = `${origin}/reset-password?token=${encodeURIComponent(token)}`;

  try {
    await sendResetPasswordEmail(user.email, resetLink);
  } catch (err) {
    // Email error—likely not user's fault!
    console.error("[FORGOT PASSWORD EMAIL ERROR]", err);
    return NextResponse.json({ error: "No se pudo enviar el correo de recuperación. Intenta después o contacta soporte." }, { status: 500 });
  }

  // If all succeeded, send ok:true
  return NextResponse.json({ ok: true }, { status: 200 });
}
