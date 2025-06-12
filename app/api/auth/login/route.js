
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req) {
  let data, email, password;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  password = typeof data.password === "string" ? data.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Campos requeridos: correo y contraseña." }, { status: 400 });
  }

  let user;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch (e) {
    console.error("[login/prisma error]", e);
    return NextResponse.json({ error: "Error interno. Intente más tarde." }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
  }
  if (!user.passwordHash) {
    return NextResponse.json({ error: "Inicie sesión con Google para cuentas administrativas." }, { status: 403 });
  }
  if (!user.isActive) {
    return NextResponse.json({ error: "Cuenta deshabilitada." }, { status: 403 });
  }
  if (user.role === "admin" || user.role === "superadmin") {
    return NextResponse.json({ error: "Administradores deben acceder con Google." }, { status: 403 });
  }

  // Secure password check
  let valid = false;
  try {
    valid = await bcrypt.compare(password, user.passwordHash);
  } catch (e) {
    console.error("[login/bcrypt error]", e);
    return NextResponse.json({ error: "Error interno validando usuario." }, { status: 500 });
  }

  if (!valid) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
  }

  // User may be ok—return only non-sensitive fields
  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      picture: user.picture ?? null
    }
  }, { status: 200 });
}
