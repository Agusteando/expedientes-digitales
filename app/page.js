
import HeroSection from "@/components/HeroSection";
import Image from "next/image";

export default function Home() {
  return (
    <div className="relative w-full h-full min-h-screen flex flex-col">
      {/* Header: Now only on home */}
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
      <main className="flex-1 flex flex-col items-center justify-center pt-20">
        <HeroSection />
      </main>
      {/* Brand blur logo footer: only on home */}
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
    </div>
  );
}
