
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { nanoid } from "nanoid";
import { sendResetPasswordEmail } from "@/lib/gmail";

// POST { email }
export async function POST(req) {
  let data, email;
  try {
    data = await req.json();
    email = (data.email || "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
  if (!email || typeof email !== "string" || email.length < 5) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Find user (must be empleado/candidato, is active)
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      isActive: true,
      role: true,
      email: true,
    },
  });

  // Always reply generically to avoid enumeration
  if (!user || !user.isActive || !["employee", "candidate"].includes(user.role)) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // ===== DEBUG LOGS: check Prisma client model keys =====
  // Remove after confirming fix!
  if (typeof prisma.passwordResetToken === "undefined") {
    // eslint-disable-next-line no-console
    console.error("[PRISMA] prisma.passwordResetToken is undefined. Available keys:", Object.keys(prisma));
    return NextResponse.json({ ok: false, error: "Server error: passwordResetToken model missing. Did you run migrations?" }, { status: 500 });
  }

  // Invalidate previous tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },
    data: { used: true },
  });

  // Create new token (random, 40 chars)
  const token = nanoid(40);
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: expires,
    },
  });

  // Send reset email
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.casitaiedis.edu.mx"}/reset-password/${token}`;

  try {
    await sendResetPasswordEmail({
      to: user.email,
      name: user.name,
      link: resetUrl,
    });
  } catch (e) {
    // Optionally, log error for support
    // eslint-disable-next-line no-console
    console.error("[FORGOT PASSWORD EMAIL ERROR]", e);
  }
  // Always reply generically
  return NextResponse.json({ ok: true }, { status: 200 });
}
