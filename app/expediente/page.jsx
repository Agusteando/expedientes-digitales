
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-options";
import prisma from "@/lib/prisma";
import EmployeeOnboardingWizard from "@/components/onboarding/EmployeeOnboardingWizard";

/**
 * /expediente onboarding main entry-point.
 * This is a server component that fetches current user and onboarding state.
 */
export default async function ExpedientePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    // You may want a login redirect here.
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-cyan-100 dark:from-slate-900 dark:to-cyan-950 px-2">
        <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/95 rounded-lg shadow-lg p-10 flex flex-col items-center">
          <h1 className="font-bold text-2xl mb-4 text-fuchsia-700 tracking-tight">Sesión requerida</h1>
          <p className="text-base text-slate-700 dark:text-slate-200 mb-3">Para acceder a tu expediente, por favor inicia sesión.</p>
          <a
            href="/login"
            className="py-2 px-6 rounded-full bg-cyan-700 hover:bg-cyan-900 text-white font-bold shadow transition"
          >
            Iniciar sesión
          </a>
        </div>
      </main>
    );
  }

  // Fetch full user profile from DB
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      picture: true,
      rfc: true,
      curp: true,
      role: true,
      plantelId: true,
      isActive: true
    }
  });

  if (!user || !user.isActive || !["employee", "candidate"].includes(user.role)) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-cyan-100 dark:from-slate-900 dark:to-cyan-950 px-2">
        <div className="w-full max-w-lg bg-red-50 dark:bg-slate-900/95 rounded-lg shadow-lg p-10 flex flex-col items-center">
          <h1 className="font-bold text-2xl mb-4 text-red-600 tracking-tight">Acceso denegado</h1>
          <p className="text-base text-slate-700 dark:text-slate-200 mb-1">No tienes permisos para ver el expediente.</p>
          <p className="text-sm text-slate-500">Si crees que esto es un error, contacta a Recursos Humanos.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-gradient-to-tr from-[#fef6f0] via-[#d7f7fc] to-[#d9ffe5] dark:from-[#151a22] dark:via-[#203146] dark:to-[#23403c] px-0 xs:px-2 py-4">
      <div className="w-full max-w-3xl mx-auto">
        <EmployeeOnboardingWizard user={user} />
      </div>
    </main>
  );
}
