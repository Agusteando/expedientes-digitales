
"use client";
import { useRef, useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

// Exported as a reusable component: pass steps, currentStep, setCurrentStep, stepStatus, etc.
export default function ExpedienteStepper({
  steps,
  currentStep,
  setCurrentStep,
  stepStatus,
  uploadsComplete,
  uploading,
  iconMap = {},
}) {
  const scrollerRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  // Compute scroll chevron need
  const updateChevronState = () => {
    if (!scrollerRef.current) return;
    const el = scrollerRef.current;
    setShowLeft(el.scrollLeft > 2);
    setShowRight(el.scrollLeft + el.offsetWidth < el.scrollWidth - 2);
  };

  // Autosnap active to center
  useEffect(() => {
    if (!scrollerRef.current) return;
    const btn = scrollerRef.current.querySelector(".stepper-btn-active");
    if (btn) btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [currentStep]);

  // Show/hide arrows on mount/scroll/resize
  useEffect(() => {
    updateChevronState();
    if (!scrollerRef.current) return;
    const el = scrollerRef.current;
    el.addEventListener("scroll", updateChevronState);
    window.addEventListener("resize", updateChevronState);
    return () => {
      el.removeEventListener("scroll", updateChevronState);
      window.removeEventListener("resize", updateChevronState);
    };
    // eslint-disable-next-line
  }, []);

  const scrollByAmount = direction => {
    if (!scrollerRef.current) return;
    const el = scrollerRef.current;
    el.scrollBy({ left: direction === "right" ? +el.offsetWidth / 1.35 : -el.offsetWidth / 1.35, behavior: "smooth" });
  };

  return (
    <div className="relative w-full max-w-2xl px-0 overflow-visible z-20 pb-1">
      {showLeft && (
        <button
          className="absolute left-1 top-1/2 -translate-y-1/2 z-30 bg-white/80 hover:bg-white border border-slate-300 rounded-full p-1 shadow transition xs:hidden"
          aria-label="Ver pasos anteriores"
          onClick={() => scrollByAmount("left")}
        >
          <ChevronLeftIcon className="w-7 h-7 text-cyan-500" />
        </button>
      )}
      {showRight && (
        <button
          className="absolute right-1 top-1/2 -translate-y-1/2 z-30 bg-white/80 hover:bg-white border border-slate-300 rounded-full p-1 shadow transition xs:hidden"
          aria-label="Ver pasos siguientes"
          onClick={() => scrollByAmount("right")}
        >
          <ChevronRightIcon className="w-7 h-7 text-cyan-500" />
        </button>
      )}
      <ol
        ref={scrollerRef}
        className="flex w-full justify-center items-center gap-3 sm:gap-4 overflow-x-auto py-3 px-8 sm:px-12 scroll-smooth no-scrollbar relative z-20"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {steps.map((s, idx) => {
          const Icon = iconMap[s.iconKey];
          const isActive = idx === currentStep;
          // (Must match your wizard logic for done/active/locked!)
          const isDone = !s.signable
            ? stepStatus[s.key]?.checklist?.fulfilled
            : stepStatus[s.key]?.signature?.status === "signed" || stepStatus[s.key]?.signature?.status === "completed";
          return (
            <li key={s.key} className="flex flex-col items-center">
              <button
                className={`rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-xl font-bold border
                  focus:ring-2 focus:ring-fuchsia-400 transition
                  ${
                    isActive
                      ? "border-fuchsia-600 bg-fuchsia-100 text-fuchsia-800 ring-2 ring-fuchsia-500/40 stepper-btn-active"
                      : isDone
                        ? "border-emerald-400 bg-emerald-100 text-emerald-700"
                        : "border-slate-200 bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-500"
                  }`}
                aria-current={isActive ? "step" : undefined}
                disabled={(!uploadsComplete && s.signable) || uploading}
                style={{ minWidth: "48px", minHeight: "48px" }}
                onClick={() => setCurrentStep(idx)}
                aria-label={`Paso: ${s.label}`}
                type="button"
              >
                {Icon && <Icon className="h-8 w-8 sm:h-9 sm:w-9 align-middle" aria-hidden="true" />}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
