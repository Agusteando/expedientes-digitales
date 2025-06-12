
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton({ className = "", buttonText = "Cerrar sesión", ...props }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      className={`px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-full text-xs shadow transition disabled:opacity-60 ${className}`}
      title="Cerrar sesión"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await fetch("/api/auth/signout", { method: "POST" });
        } catch {}
        router.replace("/");
      }}
      {...props}
    >
      {loading ? "Saliendo..." : buttonText}
    </button>
  );
}
