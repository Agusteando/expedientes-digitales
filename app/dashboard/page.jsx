
import prisma from "@/lib/prisma";
import EmployeeOnboardingWizard from "@/components/EmployeeOnboardingWizard";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-options";
import Link from "next/link";

export default async function DashboardPage({ searchParams }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !["employee", "candidate"].includes(session.user.role)) {
    return (
      <html>
        <head>
          <meta httpEquiv="refresh" content="0;url=/login" />
        </head>
      </html>
    );
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
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f6eafe] via-[#e4f7fb] to-[#eafff7] dark:from-[#181e2a] dark:via-[#192736] dark:to-[#225245] flex flex-col">
      <nav className="w-full bg-white/90 dark:bg-slate-900/90 border-b border-slate-100 dark:border-slate-800 py-2 px-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div>
          <Link href="/" className="font-bold text-lg text-cyan-700 dark:text-cyan-200 hover:underline" style={{ fontFamily: "var(--font-fredoka), var(--font-montserrat)" }}>
            Expedientes Digitales
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-semibold">{session.user.name}</span>
          <button
            onClick={async () => {
              await fetch("/api/auth/signout", { method: "POST" });
              window.location.href = "/";
            }}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-full text-xs shadow transition"
            title="Cerrar sesión"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>
      <main className="flex-1 w-full flex flex-col items-center">
        <EmployeeOnboardingWizard
          user={session.user}
          steps={onboardingSteps}
          stepStatus={stepStatus}
        />
      </main>
    </div>
  );
}
