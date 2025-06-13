
import Link from "next/link";
import Image from "next/image";
import ActionButtons from "./ActionButtons";

export default function HeaderHero() {
  return (
    <>
      {/* Header */}
      <header className="w-full bg-white border-b border-slate-100 flex items-center justify-between px-3 xs:px-5 py-2 md:py-0 h-[64px] z-30">
        <div className="flex items-center gap-3">
          <Image
            src="/iedis-logo.svg"
            alt="IECS-IEDIS"
            width={36}
            height={36}
            className="object-contain"
            priority
          />
          <span className="font-extrabold text-lg sm:text-xl text-[#2E0D6B] font-montserrat tracking-tight select-none">IECS-IEDIS</span>
        </div>
        <span className="text-xs sm:text-sm md:text-base font-semibold text-slate-500 tracking-wider pr-1 select-none hidden xs:inline-block">
          Plataforma Laboral IECS-IEDIS
        </span>
      </header>

      {/* Hero */}
      <section className="
        relative w-full flex flex-col items-center justify-center
        bg-[#2E0D6B]
        pt-12 xs:pt-14 sm:pt-16 md:pt-24
        pb-16 xs:pb-20 sm:pb-24
        z-20
        rounded-b-[2.5rem]
        " style={{
          borderBottomLeftRadius: "3.5rem",
          borderBottomRightRadius: "3.5rem",
        }}>
        <h1
          className="font-extrabold font-montserrat text-3xl xs:text-4xl sm:text-5xl lg:text-6xl text-white text-center leading-tight tracking-tight mb-5 sm:mb-7 drop-shadow-md"
        >
          Expediente Laboral Digital
        </h1>
        <p className="max-w-lg mx-auto text-center text-base xs:text-lg sm:text-xl text-[#F5F5F5] font-medium font-montserrat leading-relaxed mb-8 sm:mb-10 px-2">
          Administra, sube y firma tus documentos laborales de manera segura con <span className="font-bold text-white">IECS-IEDIS</span>.
        </p>
        <ActionButtons />
      </section>
    </>
  );
}
