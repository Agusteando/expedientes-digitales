
"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ShieldCheckIcon, ArrowRightEndOnRectangleIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";

const GSI_CLIENT_ID = process.env.NEXT_PUBLIC_GSI_CLIENT_ID;

export default function AdminLogin() {
  const router = useRouter();
  const gsiInitialized = useRef(false);

  useEffect(() => {
    function handleCredentialResponse(response) {
      if (!response || !response.credential) {
        alert("No se recibió credencial de Google, intenta de nuevo.");
        return;
      }
      fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            alert(data.error || "Acceso denegado");
            return;
          }
          router.replace("/admin/inicio");
        })
        .catch(() => {
          alert("Error de red");
        });
    }

    if (!window.google?.accounts?.id) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client?hl=es";
      script.async = true;
      script.defer = true;
      script.onload = initializeGIS;
      document.body.appendChild(script);
    } else {
      initializeGIS();
    }

    function initializeGIS() {
      if (!window.google?.accounts?.id || gsiInitialized.current) return;
      window.google.accounts.id.initialize({
        client_id: GSI_CLIENT_ID,
        callback: handleCredentialResponse,
        ux_mode: "popup",
        auto_select: false,
      });
      window.google.accounts.id.renderButton(
        document.getElementById("g_id_signin"),
        {
          type: "standard",
          shape: "pill",
          theme: "filled_blue",
          text: "sign_in_with",
          size: "large",
          logo_alignment: "left",
          width: 260,
          locale: "es",
        }
      );
      gsiInitialized.current = true;
    }

    return () => {
      gsiInitialized.current = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-fuchsia-50 to-cyan-50 dark:from-[#181e2a] dark:via-[#22183b] dark:to-[#307da7] p-4">
      <div className="w-full max-w-md xs:max-w-xl mx-auto relative bg-white/90 dark:bg-slate-900/90 shadow-2xl rounded-3xl px-5 xs:px-10 py-8 sm:py-11 border border-purple-100 dark:border-purple-900 flex flex-col items-center backdrop-blur-2xl">
        {/* Brand */}
        <div className="flex flex-col items-center gap-1 mb-6 select-none">
          <div className="mb-2 relative w-14 h-14 xs:w-16 xs:h-16">
            <Image
              src="/IMAGOTIPO-IECS-IEDIS.png"
              alt="IECS-IEDIS"
              fill
              className="object-contain bg-white rounded-xl shadow-sm"
              priority
            />
          </div>
          <span className="font-fredoka font-bold text-lg text-purple-900 dark:text-fuchsia-200 tracking-tight">IECS-IEDIS</span>
        </div>
        <span className="mx-auto mb-1 text-center inline-flex items-center gap-2 font-bold text-base xs:text-xl text-purple-900 dark:text-fuchsia-100 tracking-tight select-none">
          <ShieldCheckIcon className="w-7 h-7 text-fuchsia-700 dark:text-fuchsia-300" />
          Ingreso de Administradores
        </span>
        <div className="text-slate-600 dark:text-slate-200 text-xs xs:text-sm font-semibold text-center mb-7">
          <span className="text-purple-700 dark:text-fuchsia-200">Panel administrativo<br />Plataforma IECS-IEDIS</span>
        </div>
        <div className="w-full flex flex-col items-center gap-2">
          <div id="g_id_signin" className="mb-2 w-full flex flex-col items-center"></div>
        </div>
        <div className="w-full text-center text-xs mt-5 text-slate-500 dark:text-slate-300">
          <ArrowRightEndOnRectangleIcon className="w-4 h-4 inline mr-1 mb-0.5 text-fuchsia-600 dark:text-fuchsia-300" />
          Solo personal autorizado con correo <span className="font-bold text-purple-900 dark:text-fuchsia-100">@casitaiedis.edu.mx</span>
        </div>
        <div className="w-full text-center pt-2 text-xs text-slate-400">
          ¿Eres empleado? <a href="/login" className="text-cyan-700 dark:text-cyan-300 underline font-bold hover:text-fuchsia-700 transition">Acceso de empleado</a>
        </div>
      </div>
    </div>
  );
}
