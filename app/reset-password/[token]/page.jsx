
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from "@heroicons/react/24/solid";

function validatePassword(password) {
  return !!password && password.length >= 7;
}

export default function ResetPasswordPage() {
  const { token } = useParams();
  const router = useRouter();

  const [step, setStep] = useState(0); // 0=verifying, 1=form, 2=success, 3=fail
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ password: "", password2: "" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  useEffect(() => {
    if (!token) return setStep(3);
    fetch(`/api/auth/reset-password/${token}`)
      .then(r => r.json())
      .then(res => {
        if (res.valid) {
          setUser({ email: res.email, name: res.name });
          setStep(1);
        } else {
          setStep(3);
        }
      })
      .catch(() => setStep(3));
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!validatePassword(form.password)) {
      setError("La contraseña debe tener al menos 7 caracteres.");
      return;
    }
    if (form.password !== form.password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch(`/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo cambiar contraseña");
        setPending(false);
        return;
      }
      setStep(2);
      setTimeout(() => router.replace("/empleado"), 1800);
    } catch {
      setError("Hubo un error al contactar el servidor.");
      setPending(false);
    }
  }

  if (step === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-fuchsia-50 via-cyan-50 to-emerald-50 dark:from-[#181e2a] dark:via-[#192736] dark:to-[#225245]">
        <div className="bg-white/95 dark:bg-slate-900 shadow-xl rounded-3xl px-7 py-10 border border-cyan-100 dark:border-cyan-800 w-full max-w-lg flex flex-col items-center">
          <div className="text-lg text-cyan-900 dark:text-cyan-200 font-bold">Verificando enlace...</div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-fuchsia-50 via-cyan-50 to-emerald-50 dark:from-[#181e2a] dark:via-[#192736] dark:to-[#225245]">
        <div className="bg-white/95 dark:bg-slate-900 shadow-xl rounded-3xl px-7 py-10 border border-cyan-100 dark:border-cyan-800 w-full max-w-lg flex flex-col items-center">
          <div className="text-xl text-red-700 font-bold mb-2">Enlace inválido o expirado</div>
          <div className="text-base text-gray-700 dark:text-gray-200 mb-3 text-center">
            Por razones de seguridad, tu enlace caducó o ya fue utilizado.<br />
            Solicita otro enlace para restablecer tu contraseña.
          </div>
          <a href="/forgot-password" className="underline text-cyan-700 dark:text-cyan-300 font-bold">Solicitar nuevo enlace</a>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-fuchsia-50 via-cyan-50 to-emerald-50 dark:from-[#181e2a] dark:via-[#192736] dark:to-[#225245]">
        <div className="bg-white/95 dark:bg-slate-900 shadow-xl rounded-3xl px-7 py-10 border border-cyan-100 dark:border-cyan-800 w-full max-w-lg flex flex-col items-center">
          <CheckCircleIcon className="w-12 h-12 text-emerald-500 mb-4" />
          <div className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mb-2">
            Contraseña actualizada
          </div>
          <div className="text-base text-gray-700 dark:text-gray-200 mb-3 text-center">
            Ahora puedes iniciar sesión con tu nueva contraseña.
          </div>
          <a href="/empleado" className="mt-2 font-semibold text-cyan-700 underline">Ir a iniciar sesión</a>
        </div>
      </div>
    );
  }

  // Main reset form
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-fuchsia-50 via-cyan-50 to-emerald-50 dark:from-[#181e2a] dark:via-[#192736] dark:to-[#225245]">
      <div className="bg-white/95 dark:bg-slate-900 shadow-xl rounded-3xl px-7 py-10 border border-cyan-100 dark:border-cyan-800 w-full max-w-lg flex flex-col items-center">
        <h1 className="font-bold text-xl text-cyan-900 dark:text-cyan-200 mb-2">
          Restablecer contraseña
        </h1>
        <p className="text-gray-700 dark:text-gray-200 mb-5 text-center font-medium">
          {user && <span>Correo: <b>{user.email}</b></span>}
        </p>
        <form className="w-full space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-cyan-900 dark:text-cyan-100 mb-1">Nueva contraseña</label>
            <div className="relative flex items-center">
              <input
                className="rounded-lg px-4 py-3 border border-cyan-100 dark:border-cyan-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-cyan-400 text-base shadow"
                type={showPass ? "text" : "password"}
                name="password"
                minLength={7}
                required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <button type="button" tabIndex={-1}
                onClick={() => setShowPass(v => !v)}
                className="absolute right-2 top-3 text-gray-400 hover:text-cyan-700 focus:outline-none"
                aria-label={showPass ? "Ocultar" : "Mostrar"}>
                {showPass ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-cyan-900 dark:text-cyan-100 mb-1">Repetir contraseña</label>
            <div className="relative flex items-center">
              <input
                className="rounded-lg px-4 py-3 border border-cyan-100 dark:border-cyan-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-cyan-400 text-base shadow"
                type={showPass2 ? "text" : "password"}
                name="password2"
                required
                value={form.password2}
                onChange={e => setForm(f => ({ ...f, password2: e.target.value }))}
                placeholder="Repite contraseña"
                autoComplete="new-password"
              />
              <button type="button" tabIndex={-1}
                onClick={() => setShowPass2(v => !v)}
                className="absolute right-2 top-3 text-gray-400 hover:text-cyan-700 focus:outline-none"
                aria-label={showPass2 ? "Ocultar" : "Mostrar"}>
                {showPass2 ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {error && <div className="text-sm text-red-700 bg-red-100 py-2 rounded text-center">{error}</div>}
          <button
            type="submit"
            className="w-full py-3 mt-3 rounded-full bg-gradient-to-r from-cyan-700 to-teal-600 hover:to-cyan-900 text-white font-bold text-lg tracking-wide transition-all"
            disabled={pending}
          >
            {pending ? "Cambiando..." : "Actualizar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
