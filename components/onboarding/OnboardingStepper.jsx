
"use client";
import { useRef, useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

/**
 * Carousel stepper with arrows, dots, a11y, and swipe—no redundant step titles/descriptions.
 * @param {object[]} steps - Array of { key }
 * @param {number} activeStep - current step index
 * @param {function} onStepChange - (idx) => void
 * @param {object} stepStatus - per stepKey: for dot status color
 * @param {boolean} allowFreeJump - allow jumping to any step via dot
 */
export default function OnboardingStepper({
  steps = [],
  activeStep = 0,
  onStepChange,
  stepStatus = {},
  allowFreeJump = true,
  className = ""
}) {
  const totalSteps = steps.length;
  const [touch, setTouch] = useState(null); // {startX, startT}
  const stepperRef = useRef();

  // Keyboard arrow navigation
  useEffect(() => {
    function handler(e) {
      if (
        document.activeElement &&
        stepperRef.current &&
        stepperRef.current.contains(document.activeElement)
      ) {
        if (e.key === "ArrowLeft" && activeStep > 0) {
          onStepChange(activeStep - 1);
          e.preventDefault();
        }
        if (e.key === "ArrowRight" && activeStep < totalSteps - 1) {
          onStepChange(activeStep + 1);
          e.preventDefault();
        }
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeStep, totalSteps, onStepChange]);

  // Touch/swipe navigation for mobile
  function handleTouchStart(e) {
    if (!e?.touches?.[0]) return;
    setTouch({ startX: e.touches[0].clientX, startT: Date.now() });
  }
  function handleTouchEnd(e) {
    if (!touch || !e.changedTouches?.[0]) return;
    const dx = e.changedTouches[0].clientX - touch.startX;
    const dt = Date.now() - touch.startT;
    // Right swipe = prev, Left swipe = next; threshold: 60px in <500ms
    if (Math.abs(dx) > 64 && dt < 600) {
      if (dx > 0 && activeStep > 0) {
        onStepChange(activeStep - 1);
      } else if (dx < 0 && activeStep < totalSteps - 1) {
        onStepChange(activeStep + 1);
      }
    }
    setTouch(null);
  }

  function getColor(key, idx) {
    // stepStatus[key]: {checklist, document, signature}
    // fallback color: gray
    if (
      stepStatus?.[key]?.checklist?.fulfilled ||
      stepStatus?.[key]?.signature?.status === "signed" ||
      stepStatus?.[key]?.signature?.status === "completed"
    ) return "#059669"; // emerald
    if (
      stepStatus?.[key]?.signature?.status === "rejected" ||
      stepStatus?.[key]?.checklist?.status === "rejected"
    ) return "#dc2626"; // red
    return "#d1d5db"; // neutral gray
  }

  return (
    <nav
      aria-label="Pasos del proceso"
      className={`w-full flex flex-col items-center select-none relative ${className}`}
      tabIndex={0}
      ref={stepperRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="w-full flex flex-row items-center justify-center gap-2 xs:gap-6 md:gap-8 relative mt-0 mb-2 z-20">
        <button
          type="button"
          aria-label={activeStep === 0 ? "Inicio" : "Paso anterior"}
          disabled={activeStep === 0}
          onClick={() => onStepChange(activeStep - 1)}
          className={`flex items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm p-1 xs:p-2 md:p-3 transition focus:ring-2 ring-cyan-400 ${activeStep === 0 ? " opacity-30 pointer-events-none" : "hover:bg-cyan-50"}`}
          tabIndex={0}
        >
          <ChevronLeftIcon className="w-7 h-7 xs:w-8 xs:h-8 md:w-9 md:h-9 text-cyan-500 " />
        </button>
        <div className="grow w-4 xs:w-5 md:w-7"></div>
        <div className="grow flex items-center justify-center"></div>
        <div className="grow w-4 xs:w-5 md:w-7"></div>
        <button
          type="button"
          aria-label={activeStep === totalSteps-1 ? "Ultimo paso" : "Paso siguiente"}
          disabled={activeStep === totalSteps - 1}
          onClick={() => onStepChange(activeStep + 1)}
          className={`flex items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm p-1 xs:p-2 md:p-3 transition focus:ring-2 ring-cyan-400 ${activeStep === totalSteps-1 ? " opacity-30 pointer-events-none" : "hover:bg-cyan-50"}`}
          tabIndex={0}
        >
          <ChevronRightIcon className="w-7 h-7 xs:w-8 xs:h-8 md:w-9 md:h-9 text-cyan-500 " />
        </button>
      </div>
      <div className="flex flex-row items-center gap-1 xs:gap-2 md:gap-4 mt-0 mb-1 xs:mb-2">
        {steps.map((step, idx) => (
          <button
            key={step.key}
            type="button"
            className={`
              w-4 h-4 xs:w-5 xs:h-5 md:w-7 md:h-7 rounded-full border
              border-slate-200 transition
              flex items-center justify-center
              ${idx === activeStep
                ? "bg-cyan-400 ring-2 ring-cyan-500"
                : "bg-white hover:bg-cyan-100 focus:bg-cyan-200"
              }
            `}
            tabIndex={0}
            aria-label={`Paso ${idx+1}`}
            style={{
              boxShadow:
                idx === activeStep
                ? "0 0 0 3px rgba(6,182,212,.1)"
                : undefined,
              borderColor: getColor(step.key, idx),
              outline: idx === activeStep ? "2px solid #06b6d4" : undefined,
              color: idx === activeStep ? "#fff" : "#555",
            }}
            disabled={!allowFreeJump && idx !== activeStep}
            onClick={() => onStepChange(idx)}
          >
            <div style={{
              width: idx === activeStep ? "13px" : "10px",
              height: idx === activeStep ? "13px" : "10px",
              background: getColor(step.key, idx),
              borderRadius: "50%",
              transition: "all .18s cubic-bezier(.55,1.4,.8,1)",
              margin: "auto"
            }}/>
          </button>
        ))}
      </div>
      <div className="text-[13px] xs:text-sm text-slate-400 mt-0.5 mb-1 font-semibold">
        Paso <span className="font-bold text-cyan-800">{activeStep+1}</span> de {totalSteps}
      </div>
    </nav>
  );
}
