
"use client";
import { useSession } from "next-auth/react";
import EmployeeOnboardingWizard from "@/components/EmployeeOnboardingWizard";

export default function ExpedientePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex w-full min-h-[60vh] justify-center items-center">
        <span className="text-slate-500 text-lg font-bold">Cargando expediente...</span>
      </div>
    );
  }

  if (!session?.user || !["employee", "candidate"].includes(session.user.role)) {
    return (
      <div className="flex w-full min-h-[60vh] justify-center items-center">
        <span className="text-red-600 text-lg font-bold">No autorizado. Inicia sesión como empleado o candidato.</span>
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-[80vh] justify-center items-start px-0 sm:px-1 py-1">
      <EmployeeOnboardingWizard user={session.user} />
    </div>
  );
}
