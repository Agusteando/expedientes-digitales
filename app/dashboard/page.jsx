
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import EmployeeOnboardingWizard from "@/components/EmployeeOnboardingWizard";
import { cookies } from "next/headers";

// Server component: parent fetches user/checklist and full status, passes as props
export default async function DashboardPage({ searchParams }) {
  const cookiesInstance = cookies(); // The right way to get server-side cookies in App Router!

  // 1. Auth: Must be logged in as employee
  const session = getSessionFromCookies(cookiesInstance);
  if (!session || session.role !== "employee") {
    // SSR redirect if not in portal
    if (typeof window === "undefined") {
      return (
        <html>
          <head>
            <meta httpEquiv="refresh" content="0;url=/login" />
          </head>
        </html>
      );
    }
    if (typeof window !== "undefined") window.location.replace("/login");
    return null;
  }

  // 2. Fetch the onboarding checklist, existing documents, and signatures for this user
  const userId = session.id;
  const onboardingSteps = [
    {
      key: "ine",
      label: "Identificación Oficial (INE/IFE)",
      description: "Sube una copia de tu INE o IFE vigente.",
    },
    {
      key: "comprobante_domicilio",
      label: "Comprobante de Domicilio",
      description: "Ejemplo: recibo de luz, agua, teléfono, vigente.",
    },
    {
      key: "curp",
      label: "CURP",
      description: "Sube tu CURP digital.",
    },
    {
      key: "cv",
      label: "Currículum Vitae",
      description: "Tu CV actualizado en PDF.",
    },
    {
      key: "rfc",
      label: "RFC (SAT)",
      description: "Constancia de RFC, descargada del SAT.",
    },
    {
      key: "acta_nacimiento",
      label: "Acta de Nacimiento",
      description: "Acta de nacimiento reciente.",
    },
    {
      key: "contract",
      label: "Contrato Laboral",
      description: "Descarga, revisa, sube y firma digitalmente tu contrato.",
      signable: true,
    },
    {
      key: "reglamento",
      label: "Reglamento Interno",
      description: "Descarga, revisa, sube y firma digitalmente el reglamento interno.",
      signable: true,
    },
  ];

  // b) Get all checklist item progress for user (indexed for quick lookup)
  const checklistItems = await prisma.checklistItem.findMany({
    where: { userId },
    include: {
      document: true,
    },
    orderBy: [{ type: "asc" }, { createdAt: "asc" }],
  });

  // c) Get all signatures for the user (contract/reglamento)
  const signatures = await prisma.signature.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }],
  });

  // d) Prepare per-step status
  const stepStatus = {};
  for (let s of onboardingSteps) {
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
    <EmployeeOnboardingWizard
      user={session}
      steps={onboardingSteps}
      stepStatus={stepStatus}
    />
  );
}
