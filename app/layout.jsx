
import "./globals.css";
import { Montserrat, Fredoka } from "next/font/google";
import Image from "next/image";
import FloatingWhatsappButton from "@/components/FloatingWhatsappButton";
import SessionHeader from "@/components/SessionHeader";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-options";

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
  title: "Signia de IECS-IEDIS",
  description: "Plataforma para administrar expedientes y firmas digitales.",
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="es" className="min-h-full scroll-smooth">
      <body
        className={`${montserrat.variable} ${fredoka.variable} antialiased min-h-screen flex flex-col`}
        style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif" }}
      >
        <SessionHeader session={session} />
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
    </html>
  );
}
