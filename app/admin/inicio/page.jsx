
import { getSessionFromCookies } from "@/lib/auth";
import { cookies } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function AdminInicioPage() {
  const cookiesInstance = cookies();
  const session = getSessionFromCookies(cookiesInstance);

  if (!session || !["admin", "superadmin"].includes(session.role)) {
    redirect("/admin/login");
  }

  // Simple logout POST handler to clear session cookie
  const nav = (
    <nav className="w-full flex items-center justify-between px-7 py-3 bg-white/95 dark:bg-slate-900/95 border-b border-purple-100 dark:border-purple-800 fixed top-0 left-0 z-30">
      <a href="/" className="font-bold text-xl text-purple-800 dark:text-purple-200" style={{ fontFamily: "var(--font-fredoka),var(--font-montserrat),sans-serif" }}>
        Expedientes Digitales | Admin
      </a>
      <div className="flex items-center gap-3">
        <span className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-semibold">
          {session.name}
        </span>
        <form
          action="/api/auth/logout"
          method="POST"
          onSubmit={async (e) => {
            e.preventDefault();
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/";
          }}
        >
          <button
            type="submit"
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-full text-xs shadow transition"
            title="Cerrar sesión"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf6fe] via-[#dbf3de] to-[#e2f8fe] flex flex-col items-center pt-24">
      {nav}
      <div className="w-full max-w-2xl bg-white/80 shadow-lg rounded-3xl p-8 mt-6 border border-purple-200 flex flex-col items-center gap-4">
        <Image
          src="/IMAGOTIPO-IECS-IEDIS.png"
          alt="IECS-IEDIS"
          width={64}
          height={64}
          className="mb-2 rounded-xl bg-white object-contain"
          priority
        />
        <h1 className="text-2xl font-bold text-purple-900 dark:text-fuchsia-200 text-center" style={{ fontFamily: "var(--font-fredoka),sans-serif" }}>
          Panel de Administración IECS-IEDIS
        </h1>
        <p className="text-base text-slate-700 dark:text-slate-300 text-center max-w-lg">
          Bienvenido(a) al panel administrativo. <br />Selecciona la sección para gestionar usuarios, planteles o ver el progreso de expedientes.
        </p>
        <nav className="flex flex-col gap-3 mt-4 w-full">
          <a href="/admin/usuarios" className="w-full py-3 px-6 rounded-xl text-center font-bold bg-gradient-to-r from-purple-700 to-fuchsia-700 text-white shadow hover:to-fuchsia-900 transition text-lg">Gestión de Usuarios</a>
          <a href="/admin/planteles" className="w-full py-3 px-6 rounded-xl text-center font-bold bg-gradient-to-r from-teal-700 to-cyan-600 text-white shadow hover:from-teal-900 transition text-lg">Gestión de Planteles</a>
        </nav>
      </div>
    </div>
  );
}
