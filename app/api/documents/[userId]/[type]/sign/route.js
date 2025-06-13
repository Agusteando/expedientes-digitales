
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-options";
import fs from "fs/promises";
import path from "path";
import { mifielCreateDocument } from "@/lib/mifiel";

export async function POST(req, context) {
  const params = await context.params;
  const { userId, type } = params;
  const userIdInt = Number(userId);
  console.log("[MiFiel/sign] userId:", userId, "type:", type);

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
  console.log("[MiFiel/sign] Session source:", sessionSource, ", session:", session);

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "No autenticado.", debug: { session, sessionSource } },
      { status: 401 }
    );
  }

  const allowedTypes = ["reglamento", "contrato"];
  const universalDocTypes = ["reglamento", "contrato"];
  const isUniversal = universalDocTypes.includes(type);

  if (session.user.role === "employee" && String(session.user.id) !== String(userIdInt)) {
    return NextResponse.json({
      error: "Acceso denegado.",
      debug: { sessionUserId: session.user.id, paramUserId: userId, role: session.user.role },
    }, { status: 403 });
  }

  let user = null;
  try {
    user = await prisma.user.findUnique({ where: { id: userIdInt } });
  } catch (e) {
    console.error("[MiFiel/sign] Prisma.user.findUnique error:", e);
  }
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado.", debug: { userId: userIdInt } }, { status: 404 });
  }

  if (!user.rfc || !/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(user.rfc)) {
    return NextResponse.json({
      error: "El usuario no tiene un RFC válido registrado. No es posible firmar este documento. Contacta a Recursos Humanos.",
      debug: { userId, rfc: user.rfc }
    }, { status: 400 });
  }
  let rfc = user.rfc;
  console.log("[MiFiel/sign] RFC:", rfc);

  let fileBuff = null, filePath = null, parentDocId = null;
  if (isUniversal) {
    filePath = path.join(process.cwd(), "storage", `${type}.pdf`);
    try {
      fileBuff = await fs.readFile(filePath);
    } catch (e) {
      console.error("[MiFiel/sign] Could not read system PDF:", filePath, e);
      return NextResponse.json({
        error: `Archivo PDF universal no encontrado para ${type}.`,
        debug: { filePath }
      }, { status: 500 });
    }
  } else {
    let doc = null;
    try {
      doc = await prisma.document.findFirst({
        where: { userId: userIdInt, type, status: "pending" },
        orderBy: { uploadedAt: "desc" }
      });
    } catch (e) {
      console.error("[MiFiel/sign] Prisma.document.findFirst error:", e);
      return NextResponse.json({ error: "DB error.", debug: { e: e.message } }, { status: 500 });
    }
    if (!doc) {
      return NextResponse.json({ error: "Documento no subido o ya firmado.", debug: { userId, type } }, { status: 404 });
    }
    parentDocId = doc.id;
    filePath = path.join(process.cwd(), doc.filePath);
    try {
      fileBuff = await fs.readFile(filePath);
    } catch (e) {
      return NextResponse.json({ error: "Archivo PDF del usuario no encontrado.", debug: { filePath } }, { status: 500 });
    }
  }

  let signatureWhere = isUniversal
    ? { userId: userIdInt, type }
    : { userId: userIdInt, type, documentId: parentDocId };

  let existingSig = null;
  try {
    existingSig = await prisma.signature.findFirst({
      where: signatureWhere
    });
  } catch (e) {
    console.error("[MiFiel/sign] Prisma.signature.findFirst error:", e);
  }
  if (existingSig && existingSig.status === "completed")
    return NextResponse.json({ error: "Ya firmado.", debug: { existingSig } }, { status: 409 });
  if (existingSig && existingSig.status === "pending")
    return NextResponse.json({ error: "Firma en curso.", signature: existingSig, debug: { existingSig } }, { status: 409 });

  // Send all required fields per doc!
  const external_id = `expdig_${type}_${userIdInt}_${Date.now()}`;
  const signersArr = [{
    name: user.name,
    email: user.email,
    tax_id: rfc,
  }];
  const viewersArr = session.user && session.user.email ? [{ email: session.user.email }] : [];

  let result = null;
  try {
    result = await mifielCreateDocument({
      file: fileBuff,
      signatories: signersArr,
      name: `${type}.pdf`,
      days_to_expire: 7,
      external_id,
      message_for_signers: `Por favor firma el documento oficial (${type}) de IECS-IEDIS.`,
      payer: user.email,
      remind_every: 2,
      send_invites: true,
      massive: false,
      transfer_operation_document_id: 0,
      viewers: viewersArr
    });
    console.log("[MiFiel/sign] MiFiel API createDocument SUCCESS: ", result.id);
  } catch (e) {
    // FULLY LOG and return Mifiel errors!
    const mifielStatus = e?.response?.status;
    const mifielData = e?.response?.data;
    console.error("[MiFiel/sign] CreateDocument API error status:", mifielStatus);
    console.error("[MiFiel/sign] CreateDocument API error body:", mifielData);
    return NextResponse.json({
      error: "No se pudo generar el flujo de firma.",
      mifielStatus,
      mifielData,
      debug: { userId, type, filePath }
    }, { status: 500 });
  }

  let sig = null;
  try {
    sig = await prisma.signature.create({
      data: {
        userId: userIdInt,
        documentId: parentDocId,
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

  return NextResponse.json({
    ok: true,
    signatureId: sig.id,
    mifielId: result.id,
    state: result.state,
    widgetSigners: result.signers,
    mifielDocument: result,
    debug: {
      userId: userIdInt,
      type,
      filePath,
      user,
    }
  });
}
