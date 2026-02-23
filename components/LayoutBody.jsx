"use client";

/**
 * LayoutBody now provides only the body wrapper.
 * The FloatingWhatsappButton has been removed.
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
    </body>
  );
}