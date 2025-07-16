
"use client";
import Link from "next/link";
import { ShieldCheckIcon, ArrowRightEndOnRectangleIcon } from "@heroicons/react/24/solid";

/**
 * Shows a clear link for users to switch between Employee/Candidate and Admin login screens.
 * Should be shown at the bottom of every login page.
 *
 * @param {("admin"|"employee")} forRole - The current screen's "role": "admin" or "employee"
 */
export default function OtherLoginPrompt({ forRole = "employee", className = "" }) {
  if (forRole === "admin") {
    // On admin login, link to empleado/candidato
    return (
      <div className={`w-full text-center pt-3 text-xs sm:text-sm font-bold ${className}`}>
        <ArrowRightEndOnRectangleIcon className="w-4 h-4 inline mb-0.5 text-cyan-600 mr-1" />
        ¿Eres empleado o candidato?{" "}
        <Link
          href="/empleado"
          className="text-cyan-700 underline font-bold hover:text-fuchsia-700 transition"
        >
          Ingresa aquí
        </Link>
      </div>
    );
  }
  // On empleado/candidato login, link to admin
  return (
    <div className={`w-full text-center pt-3 text-xs sm:text-sm font-bold ${className}`}>
      <ShieldCheckIcon className="w-4 h-4 inline mb-0.5 text-fuchsia-700 mr-1" />
      ¿Eres administrador?{" "}
      <Link
        href="/admin"
        className="text-fuchsia-700 underline font-bold hover:text-cyan-700 transition"
      >
        Ingresa aquí
      </Link>
    </div>
  );
}
