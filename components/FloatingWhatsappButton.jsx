
"use client";
import { useEffect, useState } from "react";

export default function FloatingWhatsappButton() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 768);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <a
      href="https://wa.me/5217291065569?text=Hola%20tengo%20una%20duda%20sobre%20mi%20expediente"
      className={`fixed z-50 group transition-all
        ${isDesktop ? "right-14 bottom-10" : "right-4 bottom-4"}
      `}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="¿Tienes dudas? Escríbenos por WhatsApp"
      style={{
        boxShadow: "0 2px 16px 0 rgba(37,211,102,0.13)",
      }}
    >
      <span className="sr-only">Contáctanos por WhatsApp</span>
      <span className="flex items-center gap-2 bg-green-500 hover:bg-green-600 transition rounded-full shadow-lg px-5 py-3 
        text-white text-base font-bold drop-shadow-lg border-2 border-white/60 dark:border-slate-900/30">
        <svg height="29" width="29" viewBox="0 0 32 32" className="mr-1 shrink-0" aria-hidden>
          <circle cx="16" cy="16" r="16" fill="white"/>
          <path fill="#25D366" d="M16 6.4c5.28 0 9.6 4.07 9.6 9.1 0 1.83-.6 3.54-1.66 4.91l1.08 4.02-4.13-1.07A9.12 9.12 0 0116 25.6c-5.28 0-9.6-4.07-9.6-9.1s4.32-9.1 9.6-9.1zm-.05 2.2a7.02 7.02 0 00-7 7.23c.02 1.55.42 2.97 1.14 4.16l-1.17 4.41 4.54-1.14a7 7 0 008.49-.9 7.03 7.03 0 001.91-4.73 7.02 7.02 0 00-7.08-7.03zm.19 2.42c.23 0 .45.04.6.23l1.34 1.61c.18.21.2.5.04.71l-.34.5c-.07.1-.07.24 0 .34.54.93 1.37 1.77 2.33 2.33.09.06.23.06.34 0l.5-.34a.53.53 0 01.7.04l1.61 1.34c.19.16.23.45.1.66-.9 1.5-1.97 1.93-3.5 1.93-2.16 0-3.92-1.75-3.92-3.92 0-1.33.61-2.34 1.94-3.34.09-.07.17-.09.26-.09z"/>
        </svg>
        <span className="font-semibold hidden sm:inline">¿Dudas? WhatsApp</span>
      </span>
    </a>
  );
}
