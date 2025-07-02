
"use client";

import { useState } from "react";
import Image from "next/image";
import { UserPlusIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password2: "",
    curp: "",
    rfc: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function formChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.name || !form.email || !form.password || !form.password2 || !form.curp || !form.rfc) {
      setError("Por favor llena todos los campos requeridos.");
      return;
    }
    if (form.password !== form.password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          curp: form.curp,
          rfc: form.rfc,
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo registrar.");
        setLoading(false);
        return;
      }
      setSuccess("Registro exitoso, puedes iniciar sesión.");
      setTimeout(() => router.push("/login"), 1400);
    } catch (e) {
      setError("No se pudo conectar.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#fef6f0] via-[#d7f7fc] to-[#d9ffe5] dark:from-[#151a22] dark:via-[#203146] dark:to-[#23403c] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto bg-white/90 dark:bg-gray-900 shadow-xl rounded-xl md:rounded-2xl px-5 py-8 md:px-10 md:py-12 border border-gray-100 dark:border-gray-800 transition">
        <div className="w-full flex flex-col items-center mb-6">
          <div className="relative h-14 w-14 rounded-lg bg-white shadow-lg mb-4">
            <Image
              src="/IMAGOTIPO-IECS-IEDIS.png"
              alt="IECS-IEDIS"
              fill
              className="object-contain rounded-lg"
              priority
            />
          </div>
          <UserPlusIcon className="w-8 h-8 text-cyan-600 mb-2" />
          <h1
            className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight"
            style={{ fontFamily: "var(--font-fredoka), sans-serif" }}
          >
            Crear tu cuenta
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Regístrate para acceder a IECS-IEDIS
          </p>
        </div>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} autoComplete="off">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1" htmlFor="name">
              Nombre completo
            </label>
            <input
              className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white transition"
              id="name"
              name="name"
              autoComplete="name"
              required
              value={form.name}
              onChange={formChange}
              placeholder="Ingresa tu nombre"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1" htmlFor="email">
              Correo electrónico
            </label>
            <input
              className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white transition"
              id="email"
              name="email"
              autoComplete="email"
              type="email"
              required
              value={form.email}
              onChange={formChange}
              placeholder="ejemplo@dominio.com"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1" htmlFor="curp">
                CURP
              </label>
              <input
                className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-3 text-sm uppercase tracking-wide placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white transition"
                id="curp"
                name="curp"
                autoComplete="off"
                required
                minLength={18}
                maxLength={18}
                value={form.curp}
                onChange={formChange}
                placeholder="GOMC960912HDFRRL04"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1" htmlFor="rfc">
                RFC
              </label>
              <input
                className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-3 text-sm uppercase tracking-wide placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white transition"
                id="rfc"
                name="rfc"
                autoComplete="off"
                required
                minLength={12}
                maxLength={13}
                value={form.rfc}
                onChange={formChange}
                placeholder="GOMC960912QX2"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1" htmlFor="password">
                Contraseña
              </label>
              <input
                className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white transition"
                id="password"
                name="password"
                autoComplete="new-password"
                type="password"
                required
                value={form.password}
                onChange={formChange}
                placeholder="••••••••"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1" htmlFor="password2">
                Repetir contraseña
              </label>
              <input
                className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white transition"
                id="password2"
                name="password2"
                autoComplete="new-password"
                type="password"
                required
                value={form.password2}
                onChange={formChange}
                placeholder="••••••••"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-700 hover:to-teal-600 focus:outline-none focus:ring-4 focus:ring-cyan-200 dark:focus:ring-cyan-800 text-white font-bold text-base shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Registrando..." : "Registrarme"}
          </button>
          {error && (
            <div className="w-full mt-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 font-semibold text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="w-full mt-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-sm text-teal-800 font-semibold text-center">
              {success}
            </div>
          )}
        </form>
        <div className="w-full flex flex-col items-center mt-7 text-sm">
          <span className="text-gray-500 dark:text-gray-400 mb-1">¿Ya tienes cuenta?</span>
          <a
            href="/empleado"
            className="text-cyan-700 dark:text-cyan-300 font-semibold hover:underline transition"
          >
            Iniciar sesión
          </a>
        </div>
      </div>
    </div>
  );
}