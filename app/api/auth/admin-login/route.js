
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { OAuth2Client } from "google-auth-library";

const GSI_CLIENT_ID = process.env.NEXT_PUBLIC_GSI_CLIENT_ID;

const allowedEmails = [
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
      !email.endsWith("@casitaiedis.edu.mx") ||
      (allowedEmails.length && !allowedEmails.includes(email.toLowerCase()))
    ) {
      return NextResponse.json({ error: "Solo administradores IECS-IEDIS autorizados." }, { status: 403 });
    }

    // Upsert superadmin (these must exist for initial app boot)
    let user = await prisma.user.upsert({
      where: { email },
      update: { name, picture, isActive: true, role: "superadmin" },
      create: {
        name,
        email,
        picture,
        isActive: true,
        role: "superadmin",
        canSign: false,
        isApproved: true
      },
    });

    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, role: user.role } });
    setSessionCookie(res, user);
    return res;
  } catch (e) {
    console.error("[GSI-ADMIN]", e);
    return NextResponse.json({ error: "Acceso denegado" }, { status: 500 });
  }
}
