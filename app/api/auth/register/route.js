
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
    // Field-specific validation errors
    const errors = {};

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      errors.name = "El nombre es obligatorio y debe contener al menos 2 caracteres.";
    }

    if (!email || typeof email !== "string" || !validEmail(email)) {
      errors.email = "El correo electrónico no es válido.";
    }

    if (!curp || typeof curp !== "string" || curp.trim().length !== 18 || !validCurp(curp)) {
      errors.curp = "El CURP debe tener 18 caracteres y cumplir con el formato oficial. Ejemplo: GOMC960912HDFRRL04";
    }

    if (!rfc || typeof rfc !== "string" || rfc.length < 12 || rfc.length > 13 || !validRfc(rfc)) {
      errors.rfc = "El RFC debe tener entre 12 y 13 caracteres y cumplir con el formato oficial. Ejemplo: GOMC960912QX2";
    }

    if (!password || typeof password !== "string" || password.length < 7) {
      errors.password = "La contraseña debe tener al menos 7 caracteres.";
    }

    // Check if email is already used
    if (email && validEmail(email)) {
      const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existing) {
        errors.email = "Este correo electrónico ya está registrado. ¿Olvidaste tu contraseña?";
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash: hash,
        role: "candidate",
        isActive: true,
        curp: curp.toUpperCase().trim(),
        rfc: rfc.toUpperCase().trim()
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[REGISTER]", e);
    return NextResponse.json({ error: "Error interno del servidor: no se pudo completar el registro. Intenta nuevamente más tarde." }, { status: 500 });
  }
}
