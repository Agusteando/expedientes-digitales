
import { getSessionFromCookies } from "@/lib/auth";
import { cookies } from "next/headers";
import Image from "next/image";

export default async function AdminInicioPage() {
  const cookiesInstance = await cookies();
  const session = getSessionFromCookies(cookiesInstance);

  if (!session || !["admin", "superadmin"].includes(session.role)) {
    return (
      <html>
        <head>
          <meta httpEquiv="refresh" content="0;url=/admin/login" />
        </head>
      </html>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf6fe] via-[#dbf3de] to-[#e2f8fe] flex flex-col items-center pt-10">
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
