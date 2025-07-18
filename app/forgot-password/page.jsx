
"use client";

import { useState } from "react";
import { EnvelopeIcon, AtSymbolIcon, ArrowPathIcon, CheckCircleIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setPending(true);
    setError("");
    setSent(false);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSent(true);
        setPending(false);
      } else {
        setPending(false);
        setError(data?.error || "Ocurrió un error. Intenta de nuevo.");
      }
    } catch (err) {
      setError("No se pudo contactar el servidor.");
      setPending(false);
    }
  }

  function renderForm() {
    return (
      <form className="w-full flex flex-col gap-4 mt-2" onSubmit={handleSubmit} autoComplete="off">
        <label className="font-semibold text-xs text-cyan-700 dark:text-cyan-200" htmlFor="forgot-email">
          Correo electrónico
        </label>
        <div className="relative">
          <input
            className="rounded-xl px-4 py-3 pr-12 border border-cyan-100 dark:border-cyan-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-cyan-400 transition text-base shadow-md dark:shadow-none w-full"
            type="email"
            id="forgot-email"
            name="email"
            autoComplete="username"
            required
            autoFocus
            placeholder="tu@correo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={pending}
          />
          <AtSymbolIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none" />
        </div>
        <button
          className="mt-3 py-3 rounded-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-teal-700 hover:to-cyan-800 shadow-lg text-white font-bold text-lg tracking-wide transition-all disabled:opacity-80 flex flex-row gap-2 items-center justify-center"
          type="submit"
          disabled={pending}
        >
          <EnvelopeIcon className="w-5 h-5" />
          {pending ? (
            <span className="flex items-center">
              <ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" />
              Enviando...
            </span>
          ) : (
            "Enviar enlace"
          )}
        </button>
        {error && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-red-200/80 text-sm text-red-900 font-semibold text-center shadow">
            {error}
          </div>
        )}
      </form>
    );
  }

  function renderSuccess() {
    return (
      <div className="flex flex-col items-center mt-6">
        <CheckCircleIcon className="w-14 h-14 text-emerald-500 mb-2" />
        <div className="font-bold text-xl mb-2 text-emerald-700">¡Listo!</div>
        <div className="text-base text-slate-700 dark:text-slate-200 mb-2 text-center">
          Si tu correo electrónico es válido, te enviamos un enlace para restablecer tu contraseña.
          <br />
          Revisa tu bandeja de entrada y spam.
        </div>
        <Link
          href="/login"
          className="mt-4 inline-flex items-center gap-1 bg-cyan-600 hover:bg-cyan-800 text-white font-semibold px-6 py-2 rounded-full transition"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-fuchsia-50 via-cyan-50 to-emerald-50 dark:from-[#181e2a] dark:via-[#192736] dark:to-[#225245] p-4">
      <div className="w-full max-w-md xs:max-w-xl mx-auto relative bg-white/85 dark:bg-slate-900/90 shadow-2xl rounded-3xl px-5 xs:px-9 py-8 sm:py-10 border border-cyan-100 dark:border-cyan-800 flex flex-col items-center backdrop-blur-2xl">
        {/* Brand */}
        <div className="flex flex-col items-center gap-1 mb-4 select-none">
          <div className="mb-2 relative w-14 h-14 xs:w-16 xs:h-16">
            <Image
              src="/IMAGOTIPO-IECS-IEDIS.png"
              alt="IECS-IEDIS"
              fill
              className="object-contain bg-white rounded-xl shadow-sm"
              priority
            />
          </div>
          <span className="font-fredoka font-bold text-lg sm:text-xl text-cyan-800 dark:text-cyan-200 tracking-tight">
            IECS-IEDIS
          </span>
        </div>
        <span className="mx-auto mb-1 text-center inline-flex items-center gap-2 font-bold text-base xs:text-xl text-cyan-800 dark:text-cyan-100 tracking-tight select-none">
          <EnvelopeIcon className="w-6 h-6 text-cyan-700 dark:text-cyan-300" />
          Recuperar contraseña
        </span>
        <div className="text-slate-700 dark:text-slate-200 text-xs xs:text-sm font-semibold text-center mb-4">
          Ingresa tu correo para recibir un enlace seguro y restablecer el acceso.
        </div>
        {sent ? renderSuccess() : renderForm()}
      </div>
    </div>
  );
}
