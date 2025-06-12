
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import { mifielGetDocument } from "@/lib/mifiel";

/**
 * Fetch progress for [userId] + [type], with signature/Mifiel info if available.
 */
export async function GET(req, context) {
  const params = await context.params;
  const { userId, type } = params;
  const allowedTypes = ["contract", "reglamento"];
  if (!allowedTypes.includes(type))
    return NextResponse.json({ error: "Tipo no soportado." }, { status: 400 });

  const session = getSessionFromCookies(req.cookies);
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (session.role === "employee" && session.id !== userId)
    return NextResponse.json({ error: "Prohibido." }, { status: 403 });

  const doc = await prisma.document.findFirst({ where: { userId, type }, orderBy: { createdAt: "desc" } });
  if (!doc) return NextResponse.json({ status: "none" });

  const item = await prisma.checklistItem.findFirst({ where: { userId, type, documentId: doc.id }, orderBy: { id: "desc" } });
  const sig = await prisma.signature.findFirst({ where: { userId, type, documentId: doc.id }, orderBy: { id: "desc" } });

  // If signed, refresh status from Mifiel live if we have ID stored
  let mifiel = null, mifielFresh = null;
  if (sig && sig.mifielMetadata?.id) {
    try {
      mifiel = sig.mifielMetadata;
      mifielFresh = await mifielGetDocument(mifiel.id);
      // Optionally update status
      if (sig.status !== mifielFresh.state) {
        await prisma.signature.update({ where: { id: sig.id }, data: { status: mifielFresh.state, signedAt: mifielFresh.signed_at ? new Date(mifielFresh.signed_at) : null, mifielMetadata: mifielFresh } });
      }
    } catch (e) {
      console.warn("[Mifiel] Error refreshing document status", sig.id, e);
    }
  }

  return NextResponse.json({
    document: doc,
    checklist: item,
    signature: sig,
    mifiel: mifielFresh || mifiel,
    status: sig?.status || doc.status,
  });
}
