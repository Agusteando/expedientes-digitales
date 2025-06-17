
"use client";
import Image from "next/image";
import { useSession } from "next-auth/react";
import LogoutButton from "@/components/LogoutButton";
import { useState, useEffect, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

/**
 * SaaS-style, elegant, fully responsive top navigation for employees/candidates.
 * No extraneous titles, logo left, user identity center/right, always mobile first.
 */
export default function UserTopNav() {
  const { data: session } = useSession();
  const user = session?.user;
  const [open, setOpen] = useState(false);
  const popRef = useRef(null);

  // Close popover when clicking outside (for mobile menu)
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (!popRef.current) return;
      if (!popRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", handler);
    window.addEventListener("touchstart", handler);
    return () => {
      window.removeEventListener("mousedown", handler);
      window.removeEventListener("touchstart", handler);
    };
  }, [open]);

  if (!user) return null;

  // Use 2 names + 2surnames if present
  const nameParts = (user.name || "").trim().split(" ");
  const shortName =
    nameParts.length >= 3
      ? nameParts.slice(0, 2).join(" ") + " " + nameParts[2]
      : nameParts.join(" ");
  const avatarSrc = user.picture || "/IMAGOTIPO-IECS-IEDIS.png";

  return (
    <>
      {/* Top nav bar */}
      <nav className="
        fixed top-0 left-0 z-50 w-full
        bg-gradient-to-br from-white via-cyan-50 to-fuchsia-50 dark:from-slate-950 dark:via-cyan-950 dark:to-fuchsia-900
        border-b border-cyan-100 dark:border-slate-800
        shadow-md
        flex items-center
        h-[58px] xs:h-[64px] sm:h-[74px]
        px-2 xs:px-3 sm:px-6
        justify-between
      ">
        {/* Logo */}
        <div className="flex items-center min-w-0">
          <Image
            src="/signia.png"
            alt="Signia"
            width={140}
            height={44}
            priority
            className="w-[44px] xs:w-[56px] sm:w-[100px] md:w-[140px] h-auto object-contain bg-white rounded-lg shadow"
            draggable={false}
          />
        </div>
        {/* MOBILE: short name center, avatar right */}
        <div className="flex-1 flex min-w-0 md:hidden justify-center">
          <span
            className="font-bold text-cyan-900 dark:text-cyan-100 text-sm xs:text-base leading-tight
                       truncate max-w-[120px] xs:max-w-[180px] sm:max-w-[260px] text-center"
            title={user.name}
          >
            {shortName}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {/* Avatar: always present, menu trigger on mobile, pure display desktop */}
          <button
            type="button"
            aria-label="Cuenta"
            title="Cuenta"
            className="
              block md:hidden relative focus:outline-none
              w-11 h-11 xs:w-12 xs:h-12 border border-cyan-200 dark:border-cyan-700 rounded-full p-0 shadow-sm
              bg-cyan-100/60 dark:bg-slate-900/70
              flex items-center justify-center focus:ring-2 focus:ring-cyan-400
              hover:scale-105 transition"
            onClick={() => setOpen((s) => !s)}
          >
            <Image
              src={avatarSrc}
              alt={user.name}
              width={48} height={48}
              className="rounded-full object-cover bg-white"
              draggable={false}
            />
          </button>
          {/* Desktop: full info + logout */}
          <div className="hidden md:flex flex-row items-center gap-3">
            <div className="flex flex-col items-end justify-center min-w-0">
              <span className="
                font-extrabold text-cyan-900 dark:text-cyan-100 leading-tight text-base
                max-w-[320px] break-words
              ">
                {user.name}
              </span>
              <span className="
                text-xs xs:text-sm font-semibold text-slate-400 dark:text-slate-400
                leading-tight truncate max-w-[220px] md:max-w-[340px]"
                >
                {user.email}
              </span>
            </div>
            <Image
              src={avatarSrc}
              alt={user.name}
              width={56} height={56}
              className="rounded-full object-cover bg-white border-2 border-cyan-200 dark:border-cyan-800 shadow w-14 h-14"
              draggable={false}
            />
            <LogoutButton className="
              ml-1 px-5 py-2 rounded-full font-bold text-base bg-gradient-to-r from-cyan-700 to-fuchsia-700
              text-white shadow border-0 hover:from-fuchsia-700 hover:to-cyan-700
              transition
            " />
          </div>
        </div>
      </nav>
      
      {/* Mobile account modal (elegant popover, slides from top) */}
      {open && (
        <div className="fixed inset-0 z-[60] bg-black/30 flex items-start justify-end md:hidden">
          {/* Blurred backdrop, modal menu */}
          <div className="
            w-full max-w-xs ml-auto mt-[66px] xs:mt-[74px] mr-3 sm:mr-6
            bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-cyan-100 dark:border-cyan-800
            flex flex-col items-center px-6 py-8 gap-4 animate-[fade-in_0.18s_cubic-bezier(0.33,1.4,0.77,1)_both]
          " ref={popRef}>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="absolute top-2 right-3 bg-cyan-50 dark:bg-slate-800 rounded-full p-1.5 shadow"
            >
              <XMarkIcon className="w-5 h-5 text-cyan-400" />
            </button>
            <Image
              src={avatarSrc}
              alt={user.name}
              width={84}
              height={84}
              className="rounded-full object-cover border-4 border-cyan-200 dark:border-cyan-800 bg-white mt-0 shadow"
              draggable={false}
            />
            <div className="w-full text-lg xs:text-xl font-extrabold text-cyan-900 dark:text-cyan-100 text-center break-words">{user.name}</div>
            <div className="w-full text-xs xs:text-sm font-semibold text-slate-600 dark:text-slate-300 text-center break-all">{user.email}</div>
            <LogoutButton className="
              w-full justify-center text-base py-2 px-6 rounded-full mt-3
              bg-gradient-to-r from-cyan-700 to-fuchsia-700
              font-bold text-white shadow border-0
              hover:bg-gradient-to-r hover:from-fuchsia-700 hover:to-cyan-700
              transition
            " />
          </div>
        </div>
      )}
    </>
  );
}
