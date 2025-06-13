
import Link from "next/link";
import Image from "next/image";
import ClientLogout from "./ClientLogout";

/**
 * Steers users to canonical home by role.
 * - superadmin/admin ⇒ /admin/inicio
 * - employee/candidate ⇒ /expediente
 * - others/none ⇒ /
 */
function getHomeHref(session) {
  if (!session || !session.user || !session.user.role) return "/";
  const role = session.user.role;
  if (role === "admin" || role === "superadmin") return "/admin/inicio";
  if (role === "employee" || role === "candidate") return "/expediente";
  return "/";
}

/**
 * Renders the top navigation header. Handles role-based landing.
 */
export default function SessionHeader({ session }) {
  const homeHref = getHomeHref(session);
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-2.5">
        <Link href={homeHref} className="group flex items-center gap-2">
          <Image
            src="/signia.png"
            alt="Signia"
            width={140}
            height={140}
            priority
            className="transition-transform group-hover:scale-105"
          />
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs font-medium text-slate-500 tracking-wider">
            Plataforma Laboral IECS-IEDIS
          </span>
          {/* Logout only displays when authenticated via ClientLogout */}
          <ClientLogout />
        </div>
      </div>
    </header>
  );
}
