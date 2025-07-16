
"use client";

/**
 * Refined NextAuth login for IECS-IEDIS employees/candidates.
 * Styled to match brand & expediente wizard: glassy card, better spacing, logo header.
 * Uses signIn("credentials") from next-auth/react for proper cookie/session.
 */
import { useState } from "react";
import Image from "next/image";
import { ArrowRightEndOnRectangleIcon, CheckCircleIcon, KeyIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import OtherLoginPrompt from "@/components/OtherLoginPrompt";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const router = useRouter();

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setPending(true);
    setError("");
    setSuccess(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password,
      });

      setPending(false);

      if (!result.ok) {
        setError(result.error || "Usuario o contraseña incorrectos.");
        return;
      }
      setSuccess("Inicio de sesión exitoso.");
      setTimeout(() => {
        router.replace("/expediente");
      }, 800);
    } catch (err) {
      setPending(false);
      setError("No se pudo contactar el servidor.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-fuchsia-50 via-cyan-50 to-emerald-50 dark:from-[#181e2a] dark:via-[#192736] dark:to-[#225245] p-4">
      <div className="w-full max-w-md xs:max-w-xl mx-auto relative bg-white/85 dark:bg-slate-900/90 shadow-2xl rounded-3xl px-5 xs:px-9 py-8 sm:py-10 border border-cyan-100 dark:border-cyan-800 flex flex-col items-center backdrop-blur-2xl">
        {/* Brand */}
        <div className="flex flex-col items-center gap-1 mb-5 select-none">
          <div className="mb-2 relative w-14 h-14 xs:w-16 xs:h-16">
            <Image
              src="/IMAGOTIPO-IECS-IEDIS.png"
              alt="IECS-IEDIS"
              fill
              className="object-contain bg-white rounded-xl shadow-sm"
              priority
            />
          </div>
          <span className="font-fredoka font-bold text-lg sm:text-xl text-cyan-800 dark:text-cyan-200 tracking-tight">IECS-IEDIS</span>
        </div>
        <span className="mx-auto mb-1 text-center inline-flex items-center gap-2 font-bold text-base xs:text-xl text-cyan-800 dark:text-cyan-100 tracking-tight select-none">
          <ArrowRightEndOnRectangleIcon className="w-7 h-7 text-cyan-700 dark:text-cyan-300" />
          Acceso de Empleados y Candidatos
        </span>
        <div className="text-slate-700 dark:text-slate-200 text-xs xs:text-sm font-semibold text-center mb-5">
          Expediente Laboral Digital IECS-IEDIS<br />
          <span className="text-cyan-700 dark:text-cyan-300">Ingresa tus datos institucionales</span>
        </div>
        <form className="w-full flex flex-col gap-2 mt-2" onSubmit={handleSubmit} autoComplete="off">
          <label className="font-semibold text-xs text-cyan-700 dark:text-cyan-200">Correo electrónico</label>
          <input
            className="rounded-xl px-4 py-2 border border-cyan-100 dark:border-cyan-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-cyan-400 transition text-base shadow-md dark:shadow-none"
            type="email"
            name="email"
            autoComplete="email"
            autoFocus
            required
            placeholder="tu@correo.com"
            value={form.email}
            onChange={handleChange}
          />
          <label className="font-semibold text-xs text-cyan-700 dark:text-cyan-200">Contraseña</label>
          <input
            className="rounded-xl px-4 py-2 border border-cyan-100 dark:border-cyan-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-cyan-400 transition text-base shadow-md dark:shadow-none"
            type="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="Tu contraseña segura"
            value={form.password}
            onChange={handleChange}
          />
          <button
            className="mt-5 py-3 rounded-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-teal-700 hover:to-cyan-800 shadow-lg text-white font-bold text-lg tracking-wide transition-all disabled:opacity-80 flex flex-row gap-2 items-center justify-center"
            disabled={pending}
            type="submit"
          >
            <KeyIcon className="w-5 h-5" />
            {pending ? "Ingresando..." : "Entrar"}
          </button>
          {error &&
            <div className="mt-3 px-3 py-2 rounded-lg bg-red-200/80 text-sm text-red-900 font-semibold text-center shadow">
              {error}
            </div>
          }
          {success &&
            <div className="mt-3 px-3 py-2 rounded-lg bg-green-200/80 text-sm text-emerald-800 font-bold text-center flex flex-row items-center gap-2 justify-center shadow">
              <CheckCircleIcon className="w-6 h-6 text-green-700" /> {success}
            </div>
          }
        </form>
        <div className="w-full text-right pt-3 text-xs text-slate-600 dark:text-slate-400">
          ¿Aún no tienes cuenta?{" "}
          <a href="/register" className="text-cyan-700 dark:text-cyan-300 underline font-bold hover:text-emerald-600 transition">Regístrate aquí</a>
        </div>
        <OtherLoginPrompt forRole="employee" className="mt-4" />
      </div>
    </div>
  );
}
