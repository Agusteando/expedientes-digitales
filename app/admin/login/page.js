
"use client";

import { useEffect } from "react";
import Image from "next/image";
import { ShieldCheckIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";

const GSI_CLIENT_ID = process.env.NEXT_PUBLIC_GSI_CLIENT_ID;

export default function AdminLogin() {
  const router = useRouter();

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
          // REDIRIGE SOLO A ADMIN INICIO!
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
      if (!window.google?.accounts?.id || document.getElementById("g_id_signin_initialized")) return;
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
      // Mark as initialized to avoid double-init
      const flag = document.createElement("div");
      flag.id = "g_id_signin_initialized";
      flag.style.display = "none";
      document.body.appendChild(flag);
    }

    return () => {
      const flag = document.getElementById("g_id_signin_initialized");
      if (flag) flag.remove();
    };
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tr from-[#e6e9fe] via-[#faf6fa] to-[#def1e4] dark:from-[#1a1e2e] dark:via-[#22253b] dark:to-[#25404d] gap-6 p-4">
      <div className="w-full max-w-lg mx-auto bg-white/75 dark:bg-slate-800/90 rounded-3xl p-7 shadow-lg backdrop-blur-md border border-purple-100 dark:border-purple-800 flex flex-col items-center">
        <Image
          src="/IMAGOTIPO-IECS-IEDIS.png"
          alt="IECS-IEDIS"
          width={82}
          height={82}
          className="mb-3 rounded-xl bg-white object-contain shadow"
          priority
        />
        <ShieldCheckIcon className="h-10 w-10 text-purple-700 dark:text-fuchsia-200 mb-4" />
        <h1
          className="font-bold text-xl xs:text-2xl mb-2 text-center text-slate-800 dark:text-white"
          style={{ fontFamily: "var(--font-fredoka), sans-serif" }}
        >
          Ingreso administrativo IECS-IEDIS
        </h1>
        <p className="mb-4 text-slate-600 dark:text-slate-300 font-bold text-center">
          Solo personal autorizado <br />
          Ingresa con Google usando tu <b>correo institucional</b>
        </p>
        <div id="g_id_signin" className="mb-3" style={{ width: 260 }} />
      </div>
    </div>
  );
}
