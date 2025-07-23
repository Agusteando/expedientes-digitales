
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
  // console.log("[Expediente API GET] params:", params);
  // console.log("[Expediente API GET] session.user:", session?.user);

  if (
    !session ||
    !session.user ||
    (session.user.role !== "employee" && session.user.role !== "candidate" && session.user.role !== "admin" && session.user.role !== "superadmin")
  ) {
    return Response.json({ error: "Unauthorized", debug: { session } }, { status: 401 });
  }

  if (!params || typeof params.userId !== "string") {
    return Response.json({ error: "Invalid or missing userId param", debug: { params } }, { status: 400 });
  }

  const { userId } = params;
  const userIdNum = Number(userId);
  if (Number.isNaN(userIdNum)) {
    return Response.json({ error: "userId invalid", debug: { userId } }, { status: 400 });
  }

  // Only allow fetching self (unless admin/superadmin)
  if (
    String(session.user.id) !== String(userId) &&
    !(session.user.role === "admin" || session.user.role === "superadmin")
  ) {
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

  // Fetch full user profile for virtual plantel checklist fulfillment logic
  let userProfile = null;
  try {
    userProfile = await prisma.user.findUnique({
      where: { id: userIdNum },
      select: {
        plantelId: true,
        rfc: true,
        curp: true,
        email: true,
      },
    });
  } catch (err) {
    return Response.json({ error: "User fetch failed", debug: { errMsg: err.message } }, { status: 500 });
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
    // console.log(`[Expediente API] checklistItems found: ${checklistItems.length}`);
  } catch (err) {
    return Response.json({ error: "Checklist error", debug: { errMsg: err.message } }, { status: 500 });
  }

  // All doc uploads (history, versioning, reviewer comments)
  let allDocuments = [];
  try {
    allDocuments = await prisma.document.findMany({
      where: { userId: userIdNum },
      orderBy: [{ uploadedAt: "desc" }],
    });
  } catch (err) {
    allDocuments = [];
  }

  // Signatures for the user
  let signatures = [];
  try {
    signatures = await prisma.signature.findMany({
      where: { userId: userIdNum },
      orderBy: [{ createdAt: "desc" }],
    });
  } catch (err) {
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

  // Step status for each step (virtual checklist fulfillment for "plantel" step!)
  const stepStatus = {};
  for (let s of stepsExpediente) {
    let checklist = checklistItems.find(c => c.type === s.key) || null;
    let document = (stepHistory[s.key] && stepHistory[s.key][0]) || null; // latest
    let signature = null;

    // SPECIAL LOGIC: Plantel step is "done" when plantelId, rfc, curp, email are all present
    if (s.key === "plantel") {
      checklist = {
        fulfilled:
          !!userProfile.plantelId &&
          !!userProfile.rfc &&
          !!userProfile.curp &&
          !!userProfile.email
      };
    }

    stepStatus[s.key] = { checklist, document, signature };
  }

  return Response.json({ stepHistory, stepStatus });
}
