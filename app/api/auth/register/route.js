
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !validEmail(email) || !password || password.length < 7)
      return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing)
      return NextResponse.json({ error: "Correo ya registrado." }, { status: 409 });

    const hash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash: hash,
        role: "candidate",
        isActive: true,
        canSign: false,
        isApproved: false
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[REGISTER]", e);
    return NextResponse.json({ error: "No se pudo registrar" }, { status: 500 });
  }
}
