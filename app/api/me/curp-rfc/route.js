
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-options";

function validCurp(curp) {
  return /^[A-Z]{4}\d{6}[A-Z]{6}\d{2}$/.test((curp ?? "").toUpperCase());
}
function validRfc(rfc) {
  return /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test((rfc ?? "").toUpperCase());
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  let data = {};
  try { data = await req.json(); } catch {}
  const { curp, rfc } = data;
  if (!validCurp(curp) || !validRfc(rfc)) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }
  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      curp: curp.toUpperCase().trim(),
      rfc: rfc.toUpperCase().trim(),
    }
  });
  return NextResponse.json({ ok: true, curp: updated.curp, rfc: updated.rfc });
}
