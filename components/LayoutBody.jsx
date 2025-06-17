
"use client";
import FloatingWhatsappButton from "@/components/FloatingWhatsappButton";

/**
 * LayoutBody now provides only the body wrapper and floating WhatsApp button.
 * Header and landing brand are moved to the home page (app/page.js) for correct scoping.
 */
export default function LayoutBody({ children, montserrat, fredoka }) {
  return (
    <body
      className={`${montserrat} ${fredoka} antialiased min-h-screen flex flex-col`}
      style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif" }}
    >
      <main className="flex-1 flex flex-col items-center justify-center">
        {children}
      </main>
      <FloatingWhatsappButton />
    </body>
  );
}
