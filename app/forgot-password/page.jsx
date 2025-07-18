
"use client";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(0); // 0 = input, 1 = sent
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setPending(true);
    setError("");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });
      setStep(1);
    } catch (e) {
      setError("Error al enviar solicitud, intenta de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-fuchsia-50 via-cyan-50 to-emerald-50 dark:from-[#181e2a] dark:via-[#192736] dark:to-[#225245] p-4">
      <div className="w-full max-w-md mx-auto relative bg-white/90 dark:bg-slate-900 shadow-2xl rounded-3xl px-7 py-10 border border-cyan-100 dark:border-cyan-800 flex flex-col items-center">
        {step === 0 && (
          <>
            <h1 className="font-bold text-xl text-cyan-900 dark:text-cyan-200 mb-3 tracking-tight">
              ¿Olvidaste tu contraseña?
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 text-center">
              Ingresa tu correo electrónico institucional y te enviaremos instrucciones para restablecer tu contraseña.
            </p>
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
              <input
                className="rounded-xl px-4 py-3 border border-cyan-100 dark:border-cyan-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-cyan-400 transition text-base shadow-md dark:shadow-none"
                type="email"
                required
                placeholder="tu@correo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className="py-3 rounded-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-teal-700 hover:to-cyan-800 text-white font-bold text-lg tracking-wide transition-all disabled:opacity-80"
                disabled={pending || !email}
              >
                {pending ? "Enviando..." : "Enviar enlace"}
              </button>
              {error && (
                <div className="mt-2 px-3 py-2 bg-red-200/80 rounded text-center text-red-900 font-semibold">{error}</div>
              )}
            </form>
          </>
        )}
        {step === 1 && (
          <div className="flex flex-col items-center justify-center w-full">
            <div className="mb-3">
              <span className="inline-block rounded-full bg-emerald-100 text-emerald-700 px-4 py-2 font-bold">¡Listo!</span>
            </div>
            <div className="text-base text-center text-cyan-900 dark:text-cyan-200 font-semibold mb-1">
              Si tu correo electrónico es válido, te enviamos un enlace para restablecer tu contraseña.
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Revisa tu bandeja de entrada y spam.
            </div>
            <a
              href="/empleado"
              className="mt-6 underline text-cyan-700 dark:text-cyan-300 font-bold text-sm"
            >
              Volver a iniciar sesión
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
