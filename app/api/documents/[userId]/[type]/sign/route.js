
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-options";
import fs from "fs/promises";
import path from "path";
import { mifielCreateDocument } from "@/lib/mifiel";

/**
 * Robustly debugged: MiFiel sign trigger endpoint.
 * - Logs request headers, cookies, params, and session detail.
 * - Outputs diagnostics on all error paths.
 * - Ensures role and backend userId checks are auditable.
 */
export async function POST(req, context) {
  const params = await context.params;
  const { userId, type } = params;

  // Debug: Basic incoming info
  console.log("[MiFiel/sign] Incoming SIGN request for userId:", userId, "type:", type);
  console.log("[MiFiel/sign] Headers:", JSON.stringify([...req.headers]));
  const allCookies = req.cookies ? req.cookies.getAll() : (req.headers?.get?.("cookie") ? req.headers.get("cookie") : "NO req.cookies, NO cookie header found");
  console.log("[MiFiel/sign] Incoming cookies:", allCookies);

  // Try both session mechanisms for debugging
  let session = null, sessionSource = "unknown";
  try {
    session = getSessionFromCookies(req.cookies);
    sessionSource = "cookie";
    if (!session) {
      session = await getServerSession(authOptions);
      sessionSource = "next-auth";
    }
  } catch (e) {
    console.error("[MiFiel/sign] Session error:", e);
  }

  console.log("[MiFiel/sign] Session (", sessionSource, "):", session);

  if (!session || !session.user) {
    console.error("[MiFiel/sign] No authenticated session.");
    return NextResponse.json(
      { error: "No autenticado.", debug: { session, sessionSource, userId, type, cookies: allCookies } },
      { status: 401 }
    );
  }

  // Defensive: check role and userId
  const allowedTypes = ["contract", "contrato", "reglamento"];
  if (!allowedTypes.includes(type)) {
    console.warn("[MiFiel/sign] Invalid type.", type);
    return NextResponse.json({ error: "Tipo no firmable.", debug: { type } }, { status: 400 });
  }
  // Employees can only sign for themselves (strong type check)
  if (session.user.role === "employee" && String(session.user.id) !== String(userId)) {
    console.warn("[MiFiel/sign] Forbidden: session user mismatch.", { role: session.user.role, sessionId: session.user.id, routeUserId: userId });
    return NextResponse.json(
      { error: "Acceso denegado.", debug: { sessionUserId: session.user.id, paramUserId: userId, role: session.user.role } },
      { status: 403 }
    );
  }

  // Log complete session state and parameters for deep debugging
  console.log("[MiFiel/sign] Proceeding with session.user:", session.user, "params.userId:", userId, "type:", type);

  // Find latest pending Document
  let doc = null;
  try {
    doc = await prisma.document.findFirst({
      where: { userId, type, status: "pending" },
      orderBy: { createdAt: "desc" }
    });
  } catch (e) {
    console.error("[MiFiel/sign] Prisma.document.findFirst error:", e);
    return NextResponse.json({ error: "DB error. Contacte a soporte.", debug: { e: e.message } }, { status: 500 });
  }
  if (!doc) {
    console.warn("[MiFiel/sign] No pending document for this step.", { userId, type });
    return NextResponse.json(
      { error: "Documento no subido o ya firmado.", debug: { userId, type } },
      { status: 404 }
    );
  }

  // Check for existing Signature record
  let existingSig = null;
  try {
    existingSig = await prisma.signature.findFirst({
      where: { userId, type, documentId: doc.id }
    });
  } catch (e) {
    console.error("[MiFiel/sign] Prisma.signature.findFirst error:", e);
  }
  if (existingSig && existingSig.status === "completed")
    return NextResponse.json({ error: "Ya firmado.", debug: { existingSig } }, { status: 409 });
  if (existingSig && existingSig.status === "pending")
    return NextResponse.json({ error: "Firma en curso.", signature: existingSig, debug: { existingSig } }, { status: 409 });

  // Read user info (name/email)
  let user = null;
  try {
    user = await prisma.user.findUnique({ where: { id: userId } });
  } catch (e) {
    console.error("[MiFiel/sign] Prisma.user.findUnique error:", e);
  }
  if (!user) {
    console.warn("[MiFiel/sign] Usuario no encontrado.", userId);
    return NextResponse.json({ error: "Usuario no encontrado.", debug: { userId } }, { status: 404 });
  }

  // Lookup RFC, for MiFiel signer; assume user.profile.rfc or fallback
  let rfc = "XAXX010101000";
  if (user.profile && user.profile.rfc) rfc = user.profile.rfc;
  console.log("[MiFiel/sign] RFC for signer:", rfc);

  // Read PDF file
  const filePath = path.join(process.cwd(), doc.filePath);
  let fileBuff = null;
  try {
    fileBuff = await fs.readFile(filePath);
  } catch (e) {
    console.error("[MiFiel/sign] File read failed:", filePath, e);
    return NextResponse.json({ error: "Archivo no encontrado, contacte a soporte.", debug: { filePath } }, { status: 500 });
  }

  // Compose signatories
  const signatories = [{
    name: user.name,
    email: user.email,
    tax_id: rfc,
  }];

  // Compose external_id (unique/idempotent per doc ID)
  const external_id = `expdig_${type}_${userId}_${doc.id}`;

  // Call MiFiel API
  let result = null;
  try {
    result = await mifielCreateDocument({
      file: fileBuff,
      signers: signatories,
      name: `${type}.pdf`,
      external_id,
      days_to_expire: 7,
      message_for_signers: "Por favor firme este documento oficial de IECS-IEDIS.",
      payer: user.email,
      remind_every: 2,
      send_invites: true,
      transfer_operation_document_id: 0,
      viewers: [{ email: session.user.email }],
    });
    console.log("[MiFiel/sign] MiFiel API createDocument SUCCESS: ", result);
  } catch (e) {
    console.error("[MiFiel/sign] CreateDocument API error:", e);
    return NextResponse.json({ error: "No se pudo generar el flujo de firma.", debug: { e: e.message, stack: e.stack } }, { status: 500 });
  }

  // Save to Signature table
  let sig = null;
  try {
    sig = await prisma.signature.create({
      data: {
        userId,
        documentId: doc.id,
        type,
        status: result.state,
        mifielMetadata: result,
        signedAt: result.signed_at ? new Date(result.signed_at) : null,
      }
    });
    console.log("[MiFiel/sign] Signature row created:", sig.id);
  } catch (e) {
    console.error("[MiFiel/sign] Prisma.signature.create error:", e);
    return NextResponse.json({ error: "No se pudo guardar la firma.", debug: { e: e.message } }, { status: 500 });
  }

  // Update doc.status to "signing"
  try {
    await prisma.document.update({ where: { id: doc.id }, data: { status: "signing" } });
  } catch (e) {
    console.error("[MiFiel/sign] Could not update document status:", e);
    // Not a fatal error, continue
  }

  return NextResponse.json({
    ok: true,
    signatureId: sig.id,
    mifielId: result.id,
    state: result.state,
    widgetSigners: result.signers,
    mifielDocument: result,
    debug: {
      calledBy: { userId, type, sessionUser: session.user, sessionSource },
      doc,
      filePath,
      user,
      rfc,
    }
  });
}
