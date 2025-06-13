
import Link from "next/link";

const links = [
  { label: "¿Qué es esto?", href: "#como-funciona" },
  { label: "FAQ", href: "#faq" },
  { label: "Soporte", href: "/soporte", external: true },
];

export default function FooterLinks({ className = "" }) {
  return (
    <nav className={`w-full flex flex-row flex-wrap justify-center items-center gap-x-5 gap-y-2 select-none text-xs md:text-sm text-slate-400 dark:text-slate-300 ${className}`}>
      {links.map(link =>
        <Link
          key={link.href}
          href={link.href}
          target={link.external ? "_blank" : undefined}
          className="underline underline-offset-2 hover:text-fuchsia-700 dark:hover:text-fuchsia-200 font-semibold transition"
        >
          {link.label}
        </Link>
      )}
    </nav>
  );
}
