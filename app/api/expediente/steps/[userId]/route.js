
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-options";
import prisma from "@/lib/prisma";
import { stepsExpediente } from "@/components/stepMetaExpediente";

// GET /api/expediente/steps/[userId]
// Returns stepHistory and stepStatus arrays for the checklist onboarding wizard.

export async function GET(request, context) {
  const params = await context.params;

  const session = await getServerSession(authOptions);

  // Debug: Log incoming request params and session
  console.log("[Expediente API GET] params:", params);
  console.log("[Expediente API GET] session.user:", session?.user);

  if (
    !session ||
    !session.user ||
    (session.user.role !== "employee" && session.user.role !== "candidate" && session.user.role !== "admin" && session.user.role !== "superadmin")
  ) {
    console.warn("[Expediente API] Unauthorized: session invalid or role not allowed.", {
      session: session,
    });
    return Response.json({ error: "Unauthorized", debug: { session } }, { status: 401 });
  }

  if (!params || typeof params.userId !== "string") {
    console.error("[Expediente API] Invalid params:", params);
    return Response.json({ error: "Invalid or missing userId param", debug: { params } }, { status: 400 });
  }

  const { userId } = params;
  const userIdNum = Number(userId);
  if (Number.isNaN(userIdNum)) {
    console.error("[Expediente API] userId is not a number:", userId);
    return Response.json({ error: "userId invalid", debug: { userId } }, { status: 400 });
  }
  console.log("[Expediente API] Param userId as string:", userId, "; as number:", userIdNum);

  // Compare as strings to avoid type mismatches (id may be number or string)
  console.log("[Expediente API] Comparing session.user.id to userId:", session.user.id, userId, "(as strings)", String(session.user.id), String(userId));
  console.log("[Expediente API] session.user.role:", session.user.role);

  // Only allow fetching self (unless admin/superadmin)
  if (
    String(session.user.id) !== String(userId) &&
    !(session.user.role === "admin" || session.user.role === "superadmin")
  ) {
    console.warn("[Expediente API] No access: Not self or admin/superadmin.", {
      sessionUserId: session.user.id,
      paramUserId: userId,
      sessionRole: session.user.role,
    });
    return Response.json({
      error: "No access",
      debug: {
        sessionUserId: session.user.id,
        paramUserId: userId,
        sessionRole: session.user.role,
        session,
      }
    }, { status: 403 });
  }

  // Gather all checklist items with documents for user, order by type
  let checklistItems = [];
  try {
    checklistItems = await prisma.checklistItem.findMany({
      where: { userId: userIdNum },
      include: {
        document: true,
      },
      orderBy: [{ type: "asc" }],
    });
    console.log(`[Expediente API] checklistItems found: ${checklistItems.length}`);
  } catch (err) {
    console.error("[Expediente API] checklistItem.findMany failed:", err);
    return Response.json({ error: "Checklist error", debug: { errMsg: err.message } }, { status: 500 });
  }

  // All doc uploads (history, versioning, reviewer comments)
  let allDocuments = [];
  try {
    allDocuments = await prisma.document.findMany({
      where: { userId: userIdNum },
      orderBy: [{ uploadedAt: "desc" }],
    });
    console.log(`[Expediente API] allDocuments found: ${allDocuments.length}`);
  } catch (err) {
    console.error("[Expediente API] document.findMany failed:", err);
    allDocuments = [];
  }

  // Signatures for the user
  let signatures = [];
  try {
    signatures = await prisma.signature.findMany({
      where: { userId: userIdNum },
      orderBy: [{ createdAt: "desc" }],
    });
    console.log(`[Expediente API] signatures found: ${signatures.length}`);
  } catch (err) {
    console.error("[Expediente API] signature.findMany failed:", err);
    signatures = [];
  }

  // Map versions for each type step for history table
  const stepHistory = {};
  const docGrouped = {};
  for (let doc of allDocuments) {
    if (!docGrouped[doc.type]) docGrouped[doc.type] = [];
    docGrouped[doc.type].push(doc);
  }
  for (let s of stepsExpediente) {
    stepHistory[s.key] = Array.isArray(docGrouped[s.key])
      ? [...docGrouped[s.key]].sort((a, b) => (b.version ?? 0) - (a.version ?? 0))
      : [];
  }

  // Step status for each step
  const stepStatus = {};
  for (let s of stepsExpediente) {
    const checklist = checklistItems.find(c => c.type === s.key) || null;
    const document = (stepHistory[s.key] && stepHistory[s.key][0]) || null; // latest
    const signature = s.signable
      ? signatures.find(sig => sig.type === s.key) || null
      : null;
    stepStatus[s.key] = { checklist, document, signature };
  }

  console.log("[Expediente API] Returning stepHistory and stepStatus.");
  return Response.json({ stepHistory, stepStatus });
}
