
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Email/curp/rfc validators as before...
function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validCurp(curp) {
  return /^[A-Z]{4}\d{6}[A-Z]{6}\d{2}$/.test(curp?.toUpperCase() ?? "");
}
function validRfc(rfc) {
  return /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(rfc?.toUpperCase() ?? "");
}

export async function POST(req) {
  try {
    const { name, email, password, curp, rfc } = await req.json();
    if (
      !name ||
      !validEmail(email) ||
      !password ||
      password.length < 7 ||
      !curp ||
      !validCurp(curp) ||
      !rfc ||
      !validRfc(rfc)
    )
      return NextResponse.json({ error: "Datos de registro inválidos. Verifica nombre, correo, contraseña, CURP y RFC." }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing)
      return NextResponse.json({ error: "Correo ya registrado." }, { status: 409 });

    const hash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash: hash,
        role: "candidate", // or "employee" as needed
        isActive: true,
        curp: curp.toUpperCase().trim(),
        rfc: rfc.toUpperCase().trim()
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[REGISTER]", e);
    return NextResponse.json({ error: "No se pudo registrar" }, { status: 500 });
  }
}
