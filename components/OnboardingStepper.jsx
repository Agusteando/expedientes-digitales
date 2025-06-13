
"use client";
import { useRef, useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

/**
 * Carousel stepper with arrows, dots, a11y, and swipe.
 * @param {object[]} steps - Array of { key, label, iconKey }
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

  // Allow icons (if provided)
  const iconMap = {
    IdentificationIcon:     require("@heroicons/react/24/solid").IdentificationIcon,
    DocumentTextIcon:       require("@heroicons/react/24/solid").DocumentTextIcon,
    BriefcaseIcon:          require("@heroicons/react/24/solid").BriefcaseIcon,
    ShieldCheckIcon:        require("@heroicons/react/24/solid").ShieldCheckIcon,
    AcademicCapIcon:        require("@heroicons/react/24/solid").AcademicCapIcon,
    UserCircleIcon:         require("@heroicons/react/24/solid").UserCircleIcon,
    UserGroupIcon:          require("@heroicons/react/24/solid").UserGroupIcon,
    ReceiptRefundIcon:      require("@heroicons/react/24/solid").ReceiptRefundIcon,
    UserPlusIcon:           require("@heroicons/react/24/solid").UserPlusIcon,
    CheckCircleIcon:        require("@heroicons/react/24/solid").CheckCircleIcon,
    BookOpenIcon:           require("@heroicons/react/24/solid").BookOpenIcon,
    PencilSquareIcon:       require("@heroicons/react/24/solid").PencilSquareIcon,
    DocumentDuplicateIcon:  require("@heroicons/react/24/solid").DocumentDuplicateIcon,
    ChatBubbleLeftEllipsisIcon: require("@heroicons/react/24/solid").ChatBubbleLeftEllipsisIcon,
  };

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
      <div className="w-full flex flex-row items-center justify-center gap-2 xs:gap-6 md:gap-8 relative mt-0 mb-3 z-20">
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
        {/* Step label and icon */}
        <div className="flex flex-col items-center grow min-w-0 max-w-[86vw] xs:max-w-[370px]">
          <div className="flex flex-row items-center gap-3 xs:gap-4 py-1 mb-1">
            {steps[activeStep]?.iconKey && iconMap[steps[activeStep].iconKey]
             ? (
              (() => {
                const Icon = iconMap[steps[activeStep].iconKey];
                return (
                  <span className="inline-block">
                    <Icon className="w-7 h-7 xs:w-9 xs:h-9 md:w-14 md:h-14 text-cyan-700" aria-hidden="true" />
                  </span>
                );
              })()
            ) : null}
            <span className="truncate font-bold text-base xs:text-xl md:text-2xl text-cyan-900 dark:text-cyan-100">{steps[activeStep]?.label}</span>
          </div>
          <div className="text-xs xs:text-base text-slate-500 px-1 truncate max-w-full text-center">{steps[activeStep]?.description}</div>
          <div className="mt-2 text-[13px] text-slate-400">
            Paso <span className="font-bold text-cyan-800">{activeStep+1}</span> de {totalSteps}
          </div>
        </div>
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
      <div className="flex flex-row items-center gap-1 xs:gap-2 md:gap-4 mt-0 mb-3 xs:mb-4">
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
            aria-label={`Paso ${idx+1}: ${step.label}`}
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
    </nav>
  );
}
