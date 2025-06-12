
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import EmployeeOnboardingWizard from "@/components/EmployeeOnboardingWizard";
import { cookies } from "next/headers";

// Nueva ruta de expediente para empleados/candidatos
export default async function ExpedientePage() {
  const cookiesInstance = await cookies();
  const session = getSessionFromCookies(cookiesInstance);

  // SSR: Solo empleados/candidatos pueden pasar
  if (!session || !(["employee", "candidate"].includes(session.role))) {
    return (
      <html>
        <head>
          <meta httpEquiv="refresh" content="0;url=/login" />
        </head>
      </html>
    );
  }

  // Pasos del expediente (ajusta orden/nombres según tus docs oficiales)
  const pasosExpediente = [
    {
      key: "ine",
      label: "Identificación Oficial (INE/IFE)",
      description: "Sube una copia de tu INE o IFE vigente.",
    },
    {
      key: "comprobante_domicilio",
      label: "Comprobante de Domicilio",
      description: "Recibo de luz, agua, teléfono, vigente.",
    },
    {
      key: "curp",
      label: "CURP",
      description: "Carga tu CURP digital.",
    },
    {
      key: "cv",
      label: "Currículum Vitae",
      description: "Tu CV en PDF actualizado.",
    },
    {
      key: "rfc",
      label: "RFC (SAT)",
      description: "Descarga tu constancia de RFC del SAT.",
    },
    {
      key: "acta_nacimiento",
      label: "Acta de Nacimiento",
      description: "Sube tu acta de nacimiento.",
    },
    { // SIGNABLE
      key: "contract",
      label: "Contrato Laboral",
      description: "Descarga, revisa y firma digitalmente tu contrato.",
      signable: true,
    },
    {
      key: "reglamento",
      label: "Reglamento Interno",
      description: "Lee, sube y firma digitalmente el reglamento interno.",
      signable: true,
    },
  ];

  // Progreso y documentos previos
  const userId = session.id;
  const checklistItems = await prisma.checklistItem.findMany({
    where: { userId },
    include: { document: true },
    orderBy: [{ type: "asc" }, { createdAt: "asc" }],
  });
  const signatures = await prisma.signature.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }],
  });

  const stepStatus = {};
  for (let s of pasosExpediente) {
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
      steps={pasosExpediente}
      stepStatus={stepStatus}
    />
  );
}
