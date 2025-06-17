
import Providers from "@/components/Providers";

// your other imports...
import LogoutButton from "@/components/LogoutButton";
import Image from "next/image";

/**
 * Dashboard layout: wraps children in NextAuth SessionProvider for logout and session hooks.
 * Assumes user is passed via props or uses useSession if required.
 */
export default function DashboardLayout({ children }) {
  return (
    <Providers>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <nav className="w-full bg-white/90 dark:bg-slate-900/80 shadow flex items-center justify-between px-4 py-2 fixed z-40">
          <div className="flex items-center gap-2">
            <Image
              src="/signia.png"
              alt="Signia"
              width={48}
              height={48}
              priority
              className="rounded"
            />
            <span className="ml-2 font-bold text-lg tracking-tight text-slate-900 dark:text-white">Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Bienvenido</span>
            <LogoutButton className="ml-2" />
          </div>
        </nav>
        <main className="flex-1 w-full flex flex-col items-center justify-center pt-20">
          {children}
        </main>
      </div>
    </Providers>
  );
}
