
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

// DELETE a user and all child records (Signatures, Documents, ChecklistItems, admins relation).
export async function DELETE(req, context) {
  const params = await context.params;
  const session = await getSessionFromCookies(req.cookies);
  console.debug("[user/[userId]/delete][DELETE] session:", session ? `{id:${session.id},role:${session.role}}` : "none");

  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const userId = Number(params.userId);
  if (!userId) return NextResponse.json({ error: "userId inválido" }, { status: 400 });

  try {
    // Unset plantelesAdmin many-to-many relationship (required to avoid FK fail)
    await prisma.user.update({
      where: { id: userId },
      data: { plantelesAdmin: { set: [] } },
    });

    // Delete dependent child records (order does not matter after join table unset)
    await prisma.signature.deleteMany({ where: { userId } });
    await prisma.document.deleteMany({ where: { userId } });
    await prisma.checklistItem.deleteMany({ where: { userId } });

    // Finally delete the user
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ ok: true, deleted: userId });
  } catch (e) {
    console.error("[user/[userId]/delete][DELETE] error:", e);
    return NextResponse.json({ error: e.message || "Error deleting user" }, { status: 500 });
  }
}
