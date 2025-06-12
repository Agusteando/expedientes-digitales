
import prisma from "@/lib/prisma";
import EmployeeOnboardingWizard from "@/components/EmployeeOnboardingWizard";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-options";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // This is a safeguard, layout protects already
  if (!session || !session.user || !["employee", "candidate"].includes(session.user.role)) {
    return null;
  }

  const userId = session.user.id;
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

  const checklistItems = await prisma.checklistItem.findMany({
    where: { userId },
    include: {
      document: true,
    },
    orderBy: [{ type: "asc" }, { createdAt: "asc" }],
  });

  const signatures = await prisma.signature.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }],
  });

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
      user={session.user}
      steps={onboardingSteps}
      stepStatus={stepStatus}
    />
  );
}
