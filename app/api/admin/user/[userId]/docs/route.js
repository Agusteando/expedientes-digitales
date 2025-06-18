
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

// GET: retrieves all docs, checklist, signatures
export async function GET(req, context) {
  const params = await context.params;
  const { userId } = params;
  const session = await getSessionFromCookies(req.cookies);

  if (!session || !["superadmin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const checklist = await prisma.checklistItem.findMany({
    where: { userId: Number(userId) }, orderBy: { type: "asc" }
  });
  const documents = await prisma.document.findMany({
    where: { userId: Number(userId) }, orderBy: { uploadedAt: "desc" }
  });
  const signatures = await prisma.signature.findMany({
    where: { userId: Number(userId) }, orderBy: { createdAt: "desc" }
  });
  return NextResponse.json({
    checklist,
    documents,
    signatures: signatures.map(s => ({
      ...s,
      mifielId: s.mifielMetadata?.id || null,
    }))
  });
}
