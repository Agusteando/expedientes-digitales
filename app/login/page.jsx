
"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRightEndOnRectangleIcon, XCircleIcon, CheckCircleIcon } from "@heroicons/react/24/solid";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");     // short user facing error
  const [detail, setDetail] = useState(null); // API error data for dev/help
  const [success, setSuccess] = useState(null);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setPending(true);
    setError("");
    setDetail(null);
    setSuccess(null);

    let resp, result;
    try {
      resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } catch (err) {
      setError("No se pudo contactar backend.");
      setDetail({ network: String(err) });
      setPending(false);
      return;
    }

    try {
      result = await resp.json();
    } catch (err) {
      setError("Respuesta inválida del servidor.");
      setDetail({ decode: String(err) });
      setPending(false);
      return;
    }

    setPending(false);

    if (!resp.ok || !result.ok) {
      setError(result.error || "Error desconocido.");
      setDetail(result);
      return;
    }
    setSuccess("Inicio de sesión exitoso. Usuario " + (result.user?.email || result.user?.name || ""));
    setDetail(result);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tr from-[#fffbe6] via-[#f0f6fb] to-[#c6f7ee] dark:from-[#1a1e2e] dark:via-[#253747] dark:to-[#193e39] p-4">
      <div className="w-full max-w-md mx-auto bg-white/85 dark:bg-slate-900/90 rounded-3xl p-7 shadow-xl backdrop-blur-md border border-cyan-100 dark:border-cyan-800 flex flex-col items-center">
        <Image
          src="/IMAGOTIPO-IECS-IEDIS.png"
          alt="IECS-IEDIS"
          width={58}
          height={58}
          className="mb-3 rounded bg-white object-contain shadow"
          priority
        />
        <ArrowRightEndOnRectangleIcon className="h-9 w-9 text-cyan-700 dark:text-cyan-200 mb-2" />
        <h1
          className="font-bold text-lg xs:text-xl text-cyan-950 dark:text-white mb-2"
          style={{ fontFamily: "var(--font-fredoka), sans-serif" }}
        >
          Iniciar sesión IECS-IEDIS
        </h1>

        <form className="w-full flex flex-col gap-2 mt-2" onSubmit={handleSubmit} autoComplete="off">
          <label className="font-semibold text-xs text-cyan-700 dark:text-cyan-200">
            Correo electrónico
          </label>
          <input className="rounded-md px-3 py-2 border border-gray-200 bg-white focus:ring-2 focus:ring-cyan-300 transition text-base"
                 type="email" name="email" required autoComplete="email"
                 value={form.email} onChange={handleChange} />
          <label className="font-semibold text-xs text-cyan-700 dark:text-cyan-200">
            Contraseña
          </label>
          <input className="rounded-md px-3 py-2 border border-gray-200 bg-white focus:ring-2 focus:ring-cyan-300 transition text-base"
                 type="password" name="password" required autoComplete="current-password"
                 value={form.password} onChange={handleChange} />
          <button
            className="mt-4 py-2 rounded-full bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold text-lg shadow-md hover:from-teal-700 hover:to-cyan-900 transition"
            disabled={pending}
            type="submit"
          >
            {pending ? "Ingresando..." : "Entrar"}
          </button>
          {error &&
            <div className="mt-3 px-3 py-2 rounded bg-red-200 text-sm text-red-900 font-semibold text-center">
              {error}
            </div>
          }
          {success &&
            <div className="mt-3 px-3 py-2 rounded bg-green-200 text-sm text-emerald-800 font-semibold text-center flex flex-row items-center gap-2 justify-center">
              <CheckCircleIcon className="w-6 h-6 text-green-700" /> {success}
            </div>
          }
        </form>
        {detail &&
          <div className="w-full mt-2 text-xs">
            <div className="my-2 bg-slate-100 dark:bg-slate-800 p-2 font-mono rounded break-words">
              <div className="font-bold">Respuesta de servidor:</div>
              {JSON.stringify(detail, null, 2)}
            </div>
          </div>
        }
        <div className="w-full text-right pt-2 text-xs text-slate-600 dark:text-slate-400">
          ¿Aún no te registras?{" "}
          <a href="/register" className="text-cyan-700 dark:text-cyan-300 underline font-bold">
            Regístrate aquí
          </a>
        </div>
      </div>
    </div>
  );
}
