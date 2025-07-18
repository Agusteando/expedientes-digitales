
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

function validatePassword(password) {
  return !!password && password.length >= 7;
}

export default function ResetPasswordForm({ token, tokenValid, error }) {
  const router = useRouter();
  const [form, setForm] = useState({ password: "", password2: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSuccess("");
    if (!validatePassword(form.password)) {
      setFormError("La contraseña debe tener al menos 7 caracteres.");
      return;
    }
    if (form.password !== form.password2) {
      setFormError("Las contraseñas no coinciden.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: form.password }),
      });
      const data = await res.json();
      setPending(false);
      if (res.ok && data.ok) {
        setSuccess("Contraseña restablecida correctamente. ¡Ahora puedes iniciar sesión!");
        setTimeout(() => router.push("/login"), 1400);
        setForm({ password: "", password2: "" });
      } else {
        setFormError(data?.error || "Ocurrió un error al restablecer tu contraseña.");
      }
    } catch {
      setPending(false);
      setFormError("No se pudo contactar al servidor.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-cyan-100 dark:from-slate-900 dark:to-cyan-950 px-2">
      <div className="w-full max-w-md mx-auto bg-white/95 dark:bg-slate-900/95 rounded-lg shadow-lg p-10 flex flex-col items-center">
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
        <h1 className="font-bold text-2xl mb-4 text-cyan-800 dark:text-cyan-200 tracking-tight">Restablece tu contraseña</h1>
        {!tokenValid &&
          <div className="flex flex-col items-center text-center mt-4">
            <ExclamationCircleIcon className="w-10 h-10 text-red-400 mb-2" />
            <div className="text-lg font-bold text-red-600 mb-1">Enlace inválido o expirado</div>
            <div className="text-base text-gray-600 dark:text-gray-300">{error}</div>
            <a
              href="/forgot-password"
              className="mt-5 inline-flex px-5 py-2 rounded-full bg-cyan-600 text-white font-bold hover:bg-cyan-800 transition"
            >
              Solicitar otro enlace
            </a>
          </div>
        }
        {tokenValid && (
          <>
            <div className="text-base text-slate-700 dark:text-slate-200 mb-5 text-center">
              Por favor ingresa tu nueva contraseña.
            </div>
            <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit} autoComplete="off">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1" htmlFor="password">
                  Nueva contraseña
                </label>
                <div className="relative flex items-center">
                  <input
                    className="block w-full rounded-lg border px-3 py-3 text-sm focus:outline-none focus:ring-2 transition pr-10
                      border-cyan-200 dark:border-cyan-700 focus:ring-cyan-500 bg-white dark:bg-gray-800 placeholder-gray-400 dark:text-white"
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={7}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    aria-invalid={!!formError}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-2 top-2.5 text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-300 z-10 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className={`mt-1 text-xs ${
                  form.password ? (validatePassword(form.password) ? "text-emerald-600" : "text-red-600 font-medium") : "text-gray-500"
                }`}>
                  {form.password ? (
                    validatePassword(form.password) ? (
                      <span className="flex items-center gap-1">
                        <CheckCircleIcon className="w-4 h-4" /> Cumple con el requisito de longitud
                      </span>
                    ) : (
                      "Debe tener al menos 7 caracteres."
                    )
                  ) : "Debe tener al menos 7 caracteres."}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1" htmlFor="password2">
                  Repetir contraseña
                </label>
                <div className="relative flex items-center">
                  <input
                    className="block w-full rounded-lg border px-3 py-3 text-sm focus:outline-none focus:ring-2 transition pr-10
                      border-cyan-200 dark:border-cyan-700 focus:ring-cyan-500 bg-white dark:bg-gray-800 placeholder-gray-400 dark:text-white"
                    id="password2"
                    name="password2"
                    type={showPassword2 ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={form.password2}
                    onChange={handleChange}
                    placeholder="••••••••"
                    aria-invalid={!!formError}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={showPassword2 ? "Ocultar contraseña" : "Mostrar contraseña"}
                    onClick={() => setShowPassword2(v => !v)}
                    className="absolute right-2 top-2.5 text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-300 z-10 focus:outline-none"
                  >
                    {showPassword2 ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs">
                  {form.password && form.password2 ? (
                    form.password === form.password2 ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircleIcon className="w-4 h-4" />
                        Las contraseñas coinciden
                      </span>
                    ) : (
                      <span className="text-red-600 font-medium">
                        Las contraseñas no coinciden.
                      </span>
                    )
                  ) : (
                    <span className="text-gray-500">
                      Repite la contraseña para confirmar.
                    </span>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={pending || !validatePassword(form.password) || form.password !== form.password2}
                className="mt-4 py-3 rounded-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-teal-700 hover:to-cyan-800 shadow-lg text-white font-bold text-lg tracking-wide transition-all disabled:opacity-70 flex flex-row gap-2 items-center justify-center"
              >
                {pending ? "Actualizando..." : "Restablecer contraseña"}
              </button>
              {formError && (
                <div className="mt-2 px-3 py-2 rounded-lg bg-red-200/80 text-sm text-red-900 font-semibold text-center shadow">
                  {formError}
                </div>
              )}
              {success && (
                <div className="mt-2 px-3 py-2 rounded-lg bg-green-200/80 text-sm text-emerald-800 font-bold text-center flex flex-row items-center gap-2 justify-center shadow">
                  <CheckCircleIcon className="w-6 h-6 text-green-700" /> {success}
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </main>
  );
}
