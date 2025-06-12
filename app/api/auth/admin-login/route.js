
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { OAuth2Client } from "google-auth-library";

const GSI_CLIENT_ID = process.env.NEXT_PUBLIC_GSI_CLIENT_ID;
const superadminSeedEmails = [
  "desarrollo.tecnologico@casitaiedis.edu.mx",
  "coord.admon@casitaiedis.edu.mx"
];

export async function POST(req) {
  try {
    const { credential } = await req.json();
    if (!credential) return NextResponse.json({ error: "Faltan credenciales." }, { status: 400 });

    const client = new OAuth2Client(GSI_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GSI_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Strictly enforce @casitaiedis.edu.mx email addresses
    if (
      typeof email !== "string" ||
      !email.endsWith("@casitaiedis.edu.mx")
    ) {
      return NextResponse.json({ error: "Solo administradores IECS-IEDIS autorizados." }, { status: 403 });
    }

    // Is this a pre-seeded superadmin email?
    let role = "admin";
    if (superadminSeedEmails.includes(email.toLowerCase())) {
      role = "superadmin";
    }

    // If user already exists, use their role (could be "admin" or "superadmin"), else upsert as inferred
    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // Only allow admin or superadmin
      if (!["admin", "superadmin"].includes(user.role)) {
        return NextResponse.json({ error: "Acceso restringido solo a administradores." }, { status: 403 });
      }
      // Update data
      user = await prisma.user.update({
        where: { email },
        data: {
          name,
          picture,
          isActive: true,
        }
      });
    } else {
      // Provision as superadmin or admin
      user = await prisma.user.create({
        data: {
          name,
          email,
          picture,
          isActive: true,
          role: role,
        }
      });
    }

    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, role: user.role } });
    setSessionCookie(res, user);
    return res;
  } catch (e) {
    console.error("[GSI-ADMIN]", e);
    return NextResponse.json({ error: "Acceso denegado" }, { status: 500 });
  }
}
