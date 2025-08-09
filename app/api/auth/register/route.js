
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// CURP regex (official+2024): 4 letters, 2 digits (YY), month MM, day DD, gender, state, 3 consonants, [A-Z0-9] year sign, check digit
function validCurp(curp) {
  const regex =
    /^[A-Z]{4}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$/i;
  return regex.test(curp ?? "");
}
function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validRfc(rfc) {
  return /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(rfc?.toUpperCase() ?? "");
}

export async function POST(req) {
  try {
    const { apellidoPaterno, apellidoMaterno, nombres, email, password, curp, rfc } = await req.json();
    const errors = {};

    // Validate required split-name fields
    if (!apellidoPaterno || typeof apellidoPaterno !== "string" || apellidoPaterno.trim().length < 2) {
      errors.apellidoPaterno = "El apellido paterno es obligatorio y debe contener al menos 2 caracteres.";
    }
    if (!apellidoMaterno || typeof apellidoMaterno !== "string" || apellidoMaterno.trim().length < 2) {
      errors.apellidoMaterno = "El apellido materno es obligatorio y debe contener al menos 2 caracteres.";
    }
    if (!nombres || typeof nombres !== "string" || nombres.trim().length < 2) {
      errors.nombres = "El(los) nombre(s) es obligatorio y debe contener al menos 2 caracteres.";
    }
    if (!email || typeof email !== "string" || !validEmail(email)) {
      errors.email = "El correo electrónico no es válido.";
    }
    if (
      !curp ||
      typeof curp !== "string" ||
      curp.trim().length !== 18 ||
      !validCurp(curp)
    ) {
      errors.curp =
        "El CURP debe tener 18 caracteres y cumplir con el formato oficial nacional. Ejemplo: GOMC960912HDFRRL04, SASN040606MMCNNTA8, o AARA000311MMCLDNB0";
    }
    if (
      !rfc ||
      typeof rfc !== "string" ||
      rfc.length < 12 ||
      rfc.length > 13 ||
      !validRfc(rfc)
    ) {
      errors.rfc =
        "El RFC debe tener entre 12 y 13 caracteres y cumplir con el formato oficial. Ejemplo: GOMC960912QX2";
    }
    if (!password || typeof password !== "string" || password.length < 7) {
      errors.password = "La contraseña debe tener al menos 7 caracteres.";
    }

    if (email && validEmail(email)) {
      const existing = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (existing) {
        errors.email =
          "Este correo electrónico ya está registrado. ¿Olvidaste tu contraseña?";
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);

    const name = `${apellidoPaterno.trim()} ${apellidoMaterno.trim()} ${nombres.trim()}`;

    await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash: hash,
        role: "candidate",
        isActive: true,
        curp: curp.toUpperCase().trim(),
        rfc: rfc.toUpperCase().trim(),
        apellidoPaterno: apellidoPaterno.trim(),
        apellidoMaterno: apellidoMaterno.trim(),
        nombres: nombres.trim(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[REGISTER]", e);
    return NextResponse.json(
      {
        error:
          "Error interno del servidor: no se pudo completar el registro. Intenta nuevamente más tarde.",
      },
      { status: 500 }
    );
  }
}
