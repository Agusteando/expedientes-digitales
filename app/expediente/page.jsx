
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-options";
import EmployeeOnboardingWizard from "@/components/EmployeeOnboardingWizard";

export default async function ExpedientePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !["employee", "candidate"].includes(session.user.role)) {
    return null;
  }
  return (
    <div className="flex w-full min-h-[80vh] justify-center items-start px-0 sm:px-1 py-1">
      <EmployeeOnboardingWizard
        user={session.user}
      />
    </div>
  );
}
