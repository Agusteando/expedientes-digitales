
import "./globals.css";
import { Montserrat, Fredoka } from "next/font/google";
import Image from "next/image";
import FloatingWhatsappButton from "@/components/FloatingWhatsappButton";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-montserrat",
  display: "swap",
});
const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-fredoka",
  display: "swap",
});

export const metadata = {
  title: "Expedientes Digitales | IECS-IEDIS",
  description: "Plataforma para administrar expedientes laborales y firmas digitales con MiFiel.",
};

/* SaaS-level, not-crowded, brand glass look */
function Brand() {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/IMAGOTIPO-IECS-IEDIS.png"
        alt="IECS-IEDIS"
        width={34}
        height={34}
        className="rounded-md shadow bg-white"
        priority
      />
      <span className="font-fredoka text-lg sm:text-2xl font-bold text-purple-800 dark:text-purple-200 tracking-tight drop-shadow-sm">
        Expediente Digital
      </span>
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="es"
      className="bg-gradient-to-br from-[#f8f6fc] via-[#e0ebfa] to-[#f0fbe1] dark:from-[#151728] dark:via-[#2a3446] dark:to-[#255242] min-h-full">
      <body
        className={
          `min-h-screen flex items-center justify-center
          transition-all duration-300 bg-fixed
          ${montserrat.variable} ${fredoka.variable} antialiased font-sans`
        }
        style={{
          fontFamily: "var(--font-montserrat), system-ui, sans-serif",
        }}
      >
        {/* Glassy SaaS-style header */}
        <header
          className="fixed top-0 left-0 z-40 w-full flex items-center justify-center bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/0 dark:border-slate-800/0 shadow-none"
          style={{ backdropFilter: "blur(12px)" }}>
          <div className="w-full max-w-3xl px-2 py-3 flex items-center justify-between">
            <Brand />
            <span className="ml-4 text-xs xs:text-sm font-medium text-slate-500 dark:text-slate-300 tracking-wider hidden sm:inline pt-1">
              Plataforma Laboral IECS-IEDIS
            </span>
          </div>
        </header>

        {/* SaaS glass card in the center */}
        <main
          className="w-full min-h-screen flex flex-col items-center justify-center
            pt-[88px] pb-4
            bg-[url('/IMAGOTIPO-IECS-IEDIS.png')] bg-bottom bg-no-repeat bg-contain
            sm:bg-[length:128px] md:bg-[length:164px] lg:bg-[length:220px] xl:bg-auto"
        >
          <div className="flex items-center justify-center w-full min-h-[75vh] sm:min-h-[82vh] relative">
            {children}
          </div>
        </main>
        <FloatingWhatsappButton />
      </body>
    </html>
  );
}
