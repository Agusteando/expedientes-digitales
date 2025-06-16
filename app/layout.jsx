
import "./globals.css";
import { Montserrat, Fredoka } from "next/font/google";
import LayoutBody from "@/components/LayoutBody";

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

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="min-h-full scroll-smooth">
      <LayoutBody montserrat={montserrat.variable} fredoka={fredoka.variable}>{children}</LayoutBody>
    </html>
  );
}
