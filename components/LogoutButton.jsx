
"use client";

import { useRouter } from "next/navigation";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

/**
 * Smart logout button: uses different method per authentication flow.
 * - Empleado/candidate (NextAuth JWT): signOut()
 * - Admin/superadmin (session cookie): POST to /api/auth/logout, hard reload or redirect
 */
export default function LogoutButton({ className = "" }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!session?.user) return null;

  const handleLogout = async (e) => {
    e.preventDefault();
    setLoading(true);

    const role = session?.user?.role;
    if (role === "admin" || role === "superadmin") {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch {}
      setTimeout(() => {
        router.replace("/admin");
        router.refresh();
      }, 100);
    } else {
      await signOut({ callbackUrl: "/empleado" });
    }
    setLoading(false);
  };

  return (
    <button
      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-fuchsia-700 to-cyan-700 text-white font-bold text-sm shadow hover:from-cyan-700 hover:to-fuchsia-900 transition focus-visible:ring-2 focus:ring-fuchsia-400 outline-none disabled:opacity-70 ${className}`}
      style={{ minWidth: 0 }}
      onClick={handleLogout}
      disabled={loading}
      title="Cerrar sesión"
    >
      <ArrowRightOnRectangleIcon className="w-5 h-5 mr-1 stroke-2" />
      <span className="hidden xs:inline">Cerrar sesión</span>
    </button>
  );
}
