
import prisma from "@/lib/prisma";
import { stepsExpediente } from "@/components/stepMetaExpediente";
import EmployeeOnboardingWizard from "@/components/EmployeeOnboardingWizard";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-options";

export default async function ExpedientePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !["employee", "candidate"].includes(session.user.role)) {
    return null;
  }

  const userId = session.user.id;
  let checklistItems = [];
  let signatures = [];

  try {
    checklistItems = await prisma.checklistItem.findMany({
      where: { userId },
      include: { document: true },
      orderBy: [{ type: "asc" }],
    });
  } catch (err) {
    console.error("[ExpedientePage] prisma.checklistItem.findMany failed:", err);
    throw new Error(
      "No se pudo leer los items del expediente. Si este error persiste, notifica a soporte. " +
      (err && err.message ? err.message : "")
    );
  }

  try {
    signatures = await prisma.signature.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }],
    });
  } catch (err) {
    console.error("[ExpedientePage] prisma.signature.findMany failed:", err);
    signatures = [];
  }

  const stepStatus = {};
  for (let s of stepsExpediente) {
    stepStatus[s.key] = {
      checklist: checklistItems.find(c => c.type === s.key),
      document: checklistItems.find(c => c.type === s.key)?.document || null,
      signature:
        s.signable
          ? signatures.find(sig => sig.type === s.key) || null
          : null,
    };
  }

  return (
    <div className="flex w-full min-h-[80vh] justify-center items-start px-0 sm:px-1 py-1">
      <EmployeeOnboardingWizard
        user={session.user}
        steps={stepsExpediente}
        stepStatus={stepStatus}
        mode="expediente"
      />
    </div>
  );
}
