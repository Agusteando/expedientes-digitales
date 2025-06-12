
import "./globals.css";
import { Montserrat, Fredoka } from "next/font/google";

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

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="bg-gradient-to-br from-[#fdf6ff] via-[#e5f2ff] to-[#e2ffe2] dark:from-[#181e2a] dark:via-[#1c2232] dark:to-[#2d3d64] min-h-full">
      <body
        className={`min-h-screen ${montserrat.variable} ${fredoka.variable} antialiased font-sans bg-fixed`}
        style={{
          fontFamily: "var(--font-montserrat), system-ui, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
