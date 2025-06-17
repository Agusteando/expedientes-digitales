
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-options";
import EmployeeOnboardingWizard from "@/components/EmployeeOnboardingWizard";

export default async function PortalHome() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !["employee", "candidate"].includes(session.user.role)) {
    // Optionally, could redirect to /portal/login using a client-side redirect
    return null;
  }

  return (
    <div className="flex w-full min-h-[80vh] justify-center items-start px-0 sm:px-1 py-1">
      <EmployeeOnboardingWizard user={session.user} />
    </div>
  );
}
