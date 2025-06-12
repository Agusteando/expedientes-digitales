
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password)
      return NextResponse.json({ error: "Favor de llenar los campos." }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user?.passwordHash)
      return NextResponse.json({ error: "Email no registrado." }, { status: 404 });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid)
      return NextResponse.json({ error: "Datos incorrectos." }, { status: 401 });

    if (user.role === "admin" || user.role === "superadmin")
      return NextResponse.json({ error: "Solo acceso con Google para administradores." }, { status: 403 });

    if (!user.isActive)
      return NextResponse.json({ error: "Cuenta deshabilitada." }, { status: 403 });

    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, role: user.role } });
    setSessionCookie(res, user);
    return res;
  } catch (e) {
    console.error("[LOGIN]", e);
    return NextResponse.json({ error: "No fue posible iniciar sesión" }, { status: 500 });
  }
}
