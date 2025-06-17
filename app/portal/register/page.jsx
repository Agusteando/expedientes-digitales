
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
      setTimeout(() => router.push("/portal/login"), 1400);
    } catch (e) {
      setError("No se pudo conectar.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tr from-[#fef6f0] via-[#d7f7fc] to-[#d9ffe5] dark:from-[#151a22] dark:via-[#203146] dark:to-[#23403c] p-4">
      <div className="w-full max-w-md mx-auto bg-white/80 dark:bg-slate-900/90 rounded-3xl p-7 shadow-xl backdrop-blur-md border border-teal-100 dark:border-teal-800 flex flex-col items-center">
        <Image
          src="/IMAGOTIPO-IECS-IEDIS.png"
          alt="IECS-IEDIS"
          width={64}
          height={64}
          className="mb-3 rounded-lg bg-white object-contain shadow"
          priority
        />
        <UserPlusIcon className="h-9 w-9 text-teal-600 dark:text-teal-300 mb-3" />
        <h1
          className="font-bold text-xl xs:text-2xl mb-2 text-teal-900 dark:text-white"
          style={{ fontFamily: "var(--font-fredoka), sans-serif" }}
        >
          Registro | IECS-IEDIS
        </h1>
        <form className="w-full flex flex-col gap-2 mt-3" onSubmit={handleSubmit} autoComplete="off">
          <label className="font-semibold text-xs text-teal-800 dark:text-teal-200">Nombre Completo</label>
          <input className="rounded-md px-3 py-2 border border-gray-200 bg-white focus:ring-2 focus:ring-teal-300 transition text-base"
                 name="name" autoComplete="name" required value={form.name} onChange={formChange} />
          <label className="font-semibold text-xs text-teal-800 dark:text-teal-200">Correo electrónico</label>
          <input className="rounded-md px-3 py-2 border border-gray-200 bg-white focus:ring-2 focus:ring-teal-300 transition text-base"
                 name="email" autoComplete="email" type="email" required value={form.email} onChange={formChange} />
          <label className="font-semibold text-xs text-teal-800 dark:text-teal-200">CURP</label>
          <input className="rounded-md px-3 py-2 border border-gray-200 bg-white focus:ring-2 focus:ring-cyan-300 transition text-base uppercase tracking-wider"
                 name="curp" autoComplete="off" required minLength={18} maxLength={18} value={form.curp} onChange={formChange}
                 placeholder="Por ejemplo: GOMC960912HDFRRL04"
          />
          <label className="font-semibold text-xs text-teal-800 dark:text-teal-200">RFC</label>
          <input className="rounded-md px-3 py-2 border border-gray-200 bg-white focus:ring-2 focus:ring-cyan-300 transition text-base uppercase tracking-wider"
                 name="rfc" autoComplete="off" required minLength={12} maxLength={13} value={form.rfc} onChange={formChange}
                 placeholder="Por ejemplo: GOMC960912QX2"
          />
          <label className="font-semibold text-xs text-teal-800 dark:text-teal-200">Contraseña</label>
          <input className="rounded-md px-3 py-2 border border-gray-200 bg-white focus:ring-2 focus:ring-teal-300 transition text-base"
                 name="password" autoComplete="new-password" type="password" required value={form.password} onChange={formChange} />
          <label className="font-semibold text-xs text-teal-800 dark:text-teal-200">Repetir contraseña</label>
          <input className="rounded-md px-3 py-2 border border-gray-200 bg-white focus:ring-2 focus:ring-teal-300 transition text-base"
                 name="password2" autoComplete="new-password" type="password" required value={form.password2} onChange={formChange} />
          <button
            className="mt-4 py-2 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold text-lg shadow-md hover:from-cyan-700 hover:to-teal-900 transition"
            disabled={loading}
            type="submit"
          >
            {loading ? "Registrando..." : "Registrarme"}
          </button>
          {error && (
            <div className="mt-3 px-3 py-2 rounded bg-red-200 text-sm text-red-900 font-semibold text-center">{error}</div>
          )}
          {success && (
            <div className="mt-3 px-3 py-2 rounded bg-green-200 text-sm text-teal-900 font-semibold text-center">{success}</div>
          )}
        </form>
        <div className="w-full text-right pt-2 text-xs text-slate-600 dark:text-slate-400">
          ¿Ya tienes cuenta?{" "}
          <a href="/portal/login" className="text-teal-700 dark:text-teal-300 underline font-bold">
            Iniciar sesión
          </a>
        </div>
      </div>
    </div>
  );
}
