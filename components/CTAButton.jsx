
"use client";
import Link from "next/link";
import { UserPlusIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";

const iconMap = {
  employee: UserPlusIcon,
  admin: ShieldCheckIcon,
};

export default function CTAButton({ href, children, primary, icon = null }) {
  const Icon = iconMap[icon];
  return (
    <Link
      href={href}
      className={`
        group flex items-center justify-center w-full md:w-auto min-w-0
        px-6 py-4 xs:py-4 rounded-xl
        text-base xs:text-lg font-bold
        shadow-2xl ring-2
        ${primary
          ? "bg-gradient-to-r from-teal-600 to-cyan-500 text-white hover:from-teal-700 hover:to-cyan-700 focus:ring-cyan-400 ring-cyan-200"
          : "bg-gradient-to-r from-fuchsia-700 to-purple-700 text-white hover:from-fuchsia-800 hover:to-purple-900 focus:ring-fuchsia-300 ring-fuchsia-200"
        }
        transition-all duration-150 ease-in-out
        hover:scale-105 active:scale-98
        focus:outline-none
      `}
      style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
    >
      {Icon && (
        <Icon className="w-7 h-7 mr-2 xs:mr-3" aria-hidden="true" />
      )}
      {children}
    </Link>
  );
}
