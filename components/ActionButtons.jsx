
"use client";
import Link from "next/link";
import { UserPlusIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";

export default function ActionButtons() {
  return (
    <div
      className="
        flex flex-col xs:flex-row gap-4 xs:gap-6
        w-full max-w-sm mx-auto
        justify-center items-center
      "
    >
      <Link
        href="/login"
        className="
          flex items-center justify-center gap-2
          w-full xs:w-auto px-7 py-4 xs:py-3
          rounded-full
          bg-cyan-500
          text-white font-bold font-montserrat text-lg xs:text-base
          shadow-lg hover:shadow-xl
          hover:bg-cyan-600 focus:bg-cyan-700
          focus:outline-none focus:ring-2 focus:ring-cyan-300
          transition-all duration-150
          active:scale-96
          select-none
        "
        style={{ backgroundColor: "#00ACC1" }}
      >
        <UserPlusIcon className="w-6 h-6 xs:w-5 xs:h-5 text-white mr-1" />
        Soy Empleado/a o Candidato/a
      </Link>
      <Link
        href="/admin/login"
        className="
          flex items-center justify-center gap-2
          w-full xs:w-auto px-7 py-4 xs:py-3
          rounded-full
          bg-pink-500
          text-white font-bold font-montserrat text-lg xs:text-base
          shadow-lg hover:shadow-xl
          hover:bg-pink-600 focus:bg-pink-700
          focus:outline-none focus:ring-2 focus:ring-pink-300
          transition-all duration-150
          active:scale-96
          select-none
        "
        style={{ backgroundColor: "#EC407A" }}
      >
        <ShieldCheckIcon className="w-6 h-6 xs:w-5 xs:h-5 text-white mr-1" />
        Soy Administrador/a
      </Link>
    </div>
  );
}
