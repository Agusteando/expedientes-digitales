
"use client";
import Image from "next/image";
import FloatingWhatsappButton from "@/components/FloatingWhatsappButton";
import { usePathname } from "next/navigation";

export default function LayoutBody({ children, montserrat, fredoka }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  return (
    <body
      className={`${montserrat} ${fredoka} antialiased min-h-screen flex flex-col`}
      style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif" }}
    >
      {!isAdminRoute && (
        <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
          <div className="max-w-5xl mx-auto flex items-center justify-between px-4">
            <Image
              src="/signia.png"
              alt="Signia"
              width={140}
              height={140}
              priority
            />
            <span className="hidden sm:block text-xs font-medium text-slate-500 tracking-wider">
              Plataforma Laboral IECS-IEDIS
            </span>
          </div>
        </header>
      )}

      <main className="flex-1 flex flex-col items-center justify-center">
        {children}
      </main>

      <div className="pointer-events-none fixed bottom-0 left-0 w-full flex items-end justify-center select-none">
        <Image
          src="/IMAGOTIPO-IECS-IEDIS.png"
          alt=""
          width={260}
          height={58}
          className="opacity-5 blur-[1.5px] mb-12"
          draggable={false}
          aria-hidden
          priority
        />
      </div>

      <FloatingWhatsappButton />
    </body>
  );
}
