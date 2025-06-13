
"use client";
import Image from "next/image";
import Link from "next/link";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

export default function BrandHeader() {
  return (
    <header className="sticky top-0 left-0 z-50 w-full flex justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-fuchsia-100 dark:border-fuchsia-900 shadow-lg px-2 py-3">
      <div className="flex items-center w-full max-w-2xl justify-between gap-2">
        <div className="flex items-center gap-2 select-none">
          <Image
            src="/IMAGOTIPO-IECS-IEDIS.png"
            alt="IECS-IEDIS"
            width={34}
            height={34}
            className="rounded-md shadow bg-white"
            priority
          />
          <span className="font-fredoka font-bold text-xl sm:text-2xl text-fuchsia-800 dark:text-fuchsia-200 tracking-tight drop-shadow-sm">
            IECS-IEDIS
          </span>
        </div>
        <Link
          href="#faq"
          className="group rounded-full p-2 bg-fuchsia-50 dark:bg-fuchsia-950 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900 border border-fuchsia-200 dark:border-fuchsia-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
          aria-label="FAQ ayuda"
        >
          <QuestionMarkCircleIcon className="w-6 h-6 text-fuchsia-600 dark:text-fuchsia-200 group-hover:scale-110 transition" />
        </Link>
      </div>
    </header>
  );
}
