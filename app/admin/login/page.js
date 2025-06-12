
"use client";

import { useEffect } from "react";
import Image from "next/image";
import { ShieldCheckIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";

const GSI_CLIENT_ID = process.env.NEXT_PUBLIC_GSI_CLIENT_ID;

export default function AdminLogin() {
  const router = useRouter();

  // Register credential callback on window for GIS
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.handleGoogleCredential = async function (response) {
      if (!response || !response.credential) {
        alert("No se recibió credencial de Google, intenta de nuevo.");
        return;
      }
      try {
        const res = await fetch("/api/auth/admin-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });
        if (!res.ok) {
          const data = await res.json();
          alert(data.error || "Acceso denegado");
          return;
        }
        router.replace("/admin/dashboard");
      } catch (e) {
        alert("Error de red");
      }
    };
    return () => {
      delete window.handleGoogleCredential;
    };
  }, [router]);

  return (
    <>
      {/* Google Identity Services script */}
      <script
        src="https://accounts.google.com/gsi/client?hl=es"
        async
      ></script>
      {/* GSI onload setup and button */}
      <div
        id="g_id_onload"
        data-client_id={GSI_CLIENT_ID}
        data-callback="handleGoogleCredential"
        data-auto_prompt="false"
        data-ux_mode="popup"
        style={{ display: "none" }}
      ></div>
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
            Ingresa con Google usando tu <b>@casitaiedis.edu.mx</b>
          </p>
          {/* Standard GSI button */}
          <div
            className="g_id_signin mb-3"
            data-type="standard"
            data-shape="pill"
            data-theme="filled_blue"
            data-text="sign_in_with"
            data-size="large"
            data-locale="es"
            data-logo_alignment="left"
            style={{ width: 260 }}
          ></div>
        </div>
      </div>
    </>
  );
}
