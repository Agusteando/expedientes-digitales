
"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRightEndOnRectangleIcon } from "@heroicons/react/24/solid";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // NextAuth - credentials provider classic login
    const res = await signIn("credentials", {
      redirect: false,
      email: form.email,
      password: form.password,
    });

    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Email/contraseña incorrectos.");
      return;
    }
    window.location.href = "/expediente";
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
          <input className="rounded-md px-3 py-2 border border-gray-200 bg-white focus:ring-2 focus:ring-cyan-300 transition text-base" type="email" name="email" required autoComplete="email" value={form.email} onChange={handleChange} />
          <label className="font-semibold text-xs text-cyan-700 dark:text-cyan-200">
            Contraseña
          </label>
          <input
            className="rounded-md px-3 py-2 border border-gray-200 bg-white focus:ring-2 focus:ring-cyan-300 transition text-base"
            type="password"
            name="password"
            required autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
          />
          <button
            className="mt-4 py-2 rounded-full bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold text-lg shadow-md hover:from-teal-700 hover:to-cyan-900 transition"
            disabled={loading}
            type="submit"
          >
            {loading ? "Ingresando..." : "Entrar"}
          </button>
          {error && (
            <div className="mt-3 px-3 py-2 rounded bg-red-200 text-sm text-red-900 font-semibold text-center">
              {error}
            </div>
          )}
        </form>
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
