
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";
import { mifielCreateDocument } from "@/lib/mifiel";

/** Only 'contract' or 'reglamento' docs are signable */
export async function POST(req, context) {
  const params = await context.params;
  const { userId, type } = params;
  const allowedTypes = ["contract", "reglamento"];
  if (!allowedTypes.includes(type))
    return NextResponse.json({ error: "Tipo no firmable." }, { status: 400 });

  const session = getSessionFromCookies(req.cookies);
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  // Employees can only trigger their own signature
  if (session.role === "employee" && session.id !== userId)
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });

  // Find latest pending Document
  const doc = await prisma.document.findFirst({
    where: { userId, type, status: "pending" },
    orderBy: { createdAt: "desc" }
  });
  if (!doc) return NextResponse.json({ error: "Documento no subido o ya firmado." }, { status: 404 });

  // Check for existing Signature record
  const existingSig = await prisma.signature.findFirst({
    where: { userId, type, documentId: doc.id }
  });
  if (existingSig && existingSig.status === "completed")
    return NextResponse.json({ error: "Ya firmado." }, { status: 409 });
  if (existingSig && existingSig.status === "pending")
    return NextResponse.json({ error: "Firma en curso.", signature: existingSig }, { status: 409 });

  // Read user info (name/email)
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });

  // Lookup RFC, for MiFiel: Let's assume it's in user.profile.rfc for now
  let rfc = "XAXX010101000";
  if (user.profile?.rfc) rfc = user.profile.rfc;
  // [DEBUG] Log RFC for signatory.
  console.log("[Mifiel] RFC for Mifiel:", rfc);

  // Read PDF file
  const filePath = path.join(process.cwd(), doc.filePath);
  let fileBuff;
  try {
    fileBuff = await fs.readFile(filePath);
  } catch (e) {
    return NextResponse.json({ error: "Archivo no encontrado, contacte a soporte." }, { status: 500 });
  }

  // Compose signatories
  const signatories = [{
    name: user.name,
    email: user.email,
    tax_id: rfc,
  }];

  // Compose external_id (unique/idempotent per doc ID)
  const external_id = `expdig_${type}_${userId}_${doc.id}`;

  // POST file to Mifiel
  let result;
  try {
    result = await mifielCreateDocument(fileBuff, `${type}.pdf`, signatories, {
      days_to_expire: 7,
      external_id,
      message_for_signers: "Por favor firme este documento oficial de IECS-IEDIS.",
      payer: user.email,
      remind_every: 2,
      send_invites: true,
      transfer_operation_document_id: 0,
      viewers: [{ email: session.email }],
    });
  } catch (e) {
    console.error("[Mifiel] CreateDocument API error:", e);
    return NextResponse.json({ error: "No se pudo generar el flujo de firma." }, { status: 500 });
  }
  // Save to Signature table
  const sig = await prisma.signature.create({
    data: {
      userId,
      documentId: doc.id,
      type,
      status: result.state,
      mifielMetadata: result,
      signedAt: result.signed_at ? new Date(result.signed_at) : null,
    }
  });

  // Update doc.status to "signing"
  await prisma.document.update({ where: { id: doc.id }, data: { status: "signing" } });

  return NextResponse.json({
    ok: true,
    signatureId: sig.id,
    mifielId: result.id,
    state: result.state,
    widgetSigners: result.signers,
    mifielDocument: result,
  });
}
