
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import {
  ArrowLeftCircleIcon, ArrowRightCircleIcon,
  ChevronLeftIcon, ChevronRightIcon,
  CloudArrowUpIcon,
  DocumentDuplicateIcon,
  ChatBubbleLeftEllipsisIcon
} from "@heroicons/react/24/solid";
import { stepsExpediente } from "./stepMetaExpediente";
import { wizardCard, stepperButton, navigationButton, secondaryButton, mainButton } from "../lib/ui-classes";
import dynamic from "next/dynamic";
import DocumentDropzone from "./DocumentDropzone";
import PdfViewer from "./PdfViewer";
import { StubReglamento, StubContrato } from "./ReglamentoContratoStub";
import { getStatusMeta } from "@/lib/expedienteStatus";
const MifielWidgetClient = dynamic(() => import("./MifielWidgetClient"), { ssr: false });

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

function formatDateDisplay(date) {
  if (!date) return "";
  try {
    return new Date(date).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return String(date);
  }
}

export default function EmployeeOnboardingWizard({ user, mode = "expediente" }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [uploadProgress, setUploadProgress] = useState(null);
  const [signatureStatus, setSignatureStatus] = useState(null);
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [freshWidgetId, setFreshWidgetId] = useState("");
  const scrollerRef = useRef(null);
  const successTimeout = useRef();

  // For stepper chevrons
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Live wizard state
  const [stepStatus, setStepStatus] = useState({});
  const [stepHistory, setStepHistory] = useState({});
  const [fetchError, setFetchError] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  // Track if we should run animation on "Siguiente" enable
  const [animateNext, setAnimateNext] = useState(false);

  // Helper text visibility/hints for novice users
  const [showHelperToast, setShowHelperToast] = useState(true);

  // Stepper chevron: update scroll state on scroll/resize
  useEffect(() => {
    function updateScrollers() {
      if (!scrollerRef.current) {
        setCanScrollLeft(false);
        setCanScrollRight(false);
        return;
      }
      const el = scrollerRef.current;
      setCanScrollLeft(el.scrollLeft > 5);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
    }
    if (!scrollerRef.current) return;
    updateScrollers();
    const el = scrollerRef.current;
    el.addEventListener("scroll", updateScrollers, { passive: true });
    window.addEventListener("resize", updateScrollers);
    return () => {
      el.removeEventListener("scroll", updateScrollers);
      window.removeEventListener("resize", updateScrollers);
    };
  }, []);

  // Fetch steps and status from backend
  async function fetchExpedienteSteps() {
    setLoadingData(true);
    setFetchError("");
    try {
      const res = await fetch(`/api/expediente/steps/${user.id}`);
      if (!res.ok) throw new Error("No se pudo leer los datos del expediente.");
      const { stepHistory: history, stepStatus: status } = await res.json();
      setStepHistory(history || {});
      setStepStatus(status || {});
    } catch (err) {
      setFetchError(err.message || "Error de conexión.");
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    fetchExpedienteSteps();
    // eslint-disable-next-line
  }, [user.id]);

  const steps = stepsExpediente;
  const totalSteps = steps.length;
  const requiredUploadSteps = useMemo(
    () => steps.filter(s => !s.signable).map(s => s.key),
    [steps]
  );
  let numUploadedDocs = 0;
  for (const key of requiredUploadSteps) {
    const status = stepStatus[key];
    if (status && status.checklist && status.checklist.fulfilled) numUploadedDocs++;
  }
  const uploadsComplete = numUploadedDocs === requiredUploadSteps.length;

  useEffect(() => {
    if (!uploadsComplete && steps[currentStep]?.signable) {
      const idx = steps.findIndex(s => !s.signable && (!stepStatus[s.key]?.checklist?.fulfilled));
      if (idx !== -1) setCurrentStep(idx);
    }
    // eslint-disable-next-line
  }, [uploadsComplete, currentStep, stepStatus]);

  // Center active step in stepper horizontal scroll
  useEffect(() => {
    if (!scrollerRef.current) return;
    const btn = scrollerRef.current.querySelector(".stepper-btn-active");
    if (btn) {
      // Center it nicely, with "peek"
      const scrollerBox = scrollerRef.current;
      const btnBox = btn.getBoundingClientRect();
      const parentBox = scrollerBox.getBoundingClientRect();
      // Scroll so btn is centered (or as close as possible)
      const btnCenter = btnBox.left + btnBox.width / 2;
      const parentCenter = parentBox.left + parentBox.width / 2;
      const scrollOffset = btnCenter - parentCenter;
      scrollerBox.scrollBy({
        left: scrollOffset,
        behavior: "smooth",
      });
    }
  }, [currentStep]);

  async function handleFileUpload(file) {
    setUploading(true);
    setUploadError("");
    setUploadSuccess("");
    setUploadProgress(0);
    const key = steps[currentStep].key;
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/documents/${user.id}/${key}/upload`, true);
    xhr.onload = function () {
      setUploading(false);
      setUploadProgress(null);
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status !== 200) {
          setUploadError(data.error || "Error al subir el archivo.");
        } else {
          setUploadSuccess("¡Archivo subido! Puedes avanzar al siguiente paso.");
          setAnimateNext(true);
          clearTimeout(successTimeout.current);
          successTimeout.current = setTimeout(() => setUploadSuccess(""), 4000);
          fetchExpedienteSteps();
        }
      } catch {
        setUploadError("Error al subir.");
      }
    };
    xhr.onerror = function () {
      setUploading(false);
      setUploadProgress(null);
      setUploadError("No se pudo subir.");
    };
    xhr.upload.onprogress = function (e) {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  }

  async function handleSign() {
    setSignatureLoading(true);
    setSignatureStatus("");
    setFreshWidgetId("");
    try {
      const key = steps[currentStep].key;
      const res = await fetch(`/api/documents/${user.id}/${key}/sign`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSignatureStatus(data.error || "No se pudo iniciar la firma.");
      } else {
        if (data.widgetSigners?.[0]?.widget_id) {
          setFreshWidgetId(data.widgetSigners[0].widget_id);
        }
        setSignatureStatus("Abre el widget y firma tu documento digital.");
        fetchExpedienteSteps();
      }
    } catch {
      setSignatureStatus("Error en la conexión para firmar.");
    }
    setSignatureLoading(false);
  }

  useEffect(() => {
    const step = steps[currentStep];
    if (
      step.signable &&
      stepStatus[step.key]?.signature &&
      stepStatus[step.key]?.signature.mifielMetadata?.signers?.[0]?.widget_id
    ) {
      setFreshWidgetId(stepStatus[step.key].signature.mifielMetadata.signers[0].widget_id);
    }
    // eslint-disable-next-line
  }, [currentStep, steps, stepStatus]);

  function handleWidgetSuccess() {
    fetchExpedienteSteps();
    setSignatureStatus("¡Documento firmado!");
  }

  // Show helper toast for onboarding
  useEffect(() => {
    setShowHelperToast(true);
    const timeout = setTimeout(() => setShowHelperToast(false), 10000);
    return () => clearTimeout(timeout);
  }, []);

  function getDisplayStatus(item, isSignable) {
    if (!item) return getStatusMeta("pending");
    if (isSignable) return getStatusMeta(item.status);
    // Checklist
    if (item.fulfilled) return getStatusMeta("fulfilled");
    return getStatusMeta(item.status || (item.fulfilled ? "fulfilled" : "pending"));
  }

  useEffect(() => {
    if (!animateNext) return;
    const timeout = setTimeout(() => setAnimateNext(false), 800);
    return () => clearTimeout(timeout);
  }, [animateNext]);

  // STEP 1: Mobile stepper with chevron overlay and scroll logic
  const mobileStepper = useMemo(() =>
    <div className="relative w-full max-w-2xl px-2 overflow-visible z-20 pb-1">
      {/* Chevrons (XS, SM): show only if needed */}
      <button
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-white/80 rounded-full p-[3px] shadow border border-slate-200 xs:hidden transition duration-150 ${canScrollLeft ? "opacity-95" : "opacity-0 pointer-events-none"}`}
        style={{display: canScrollLeft ? "block" : "none"}}
        onClick={() => {
          if (!scrollerRef.current) return;
          scrollerRef.current.scrollBy({ left: -scrollerRef.current.clientWidth * 0.8, behavior: "smooth" });
        }}
        aria-label="Ver pasos anteriores"
        tabIndex={canScrollLeft ? 0 : -1}
        type="button"
      >
        <ChevronLeftIcon className="w-7 h-7 text-cyan-500" />
      </button>
      <button
        className={`absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-white/80 rounded-full p-[3px] shadow border border-slate-200 xs:hidden transition duration-150 ${canScrollRight ? "opacity-95" : "opacity-0 pointer-events-none"}`}
        style={{display: canScrollRight ? "block" : "none"}}
        onClick={() => {
          if (!scrollerRef.current) return;
          scrollerRef.current.scrollBy({ left: scrollerRef.current.clientWidth * 0.8, behavior: "smooth" });
        }}
        aria-label="Ver pasos siguientes"
        tabIndex={canScrollRight ? 0 : -1}
        type="button"
      >
        <ChevronRightIcon className="w-7 h-7 text-cyan-500" />
      </button>
      <ol
        ref={scrollerRef}
        className="flex w-full justify-center items-center gap-3 sm:gap-4 overflow-x-auto py-3 px-5 sm:px-7 scroll-smooth no-scrollbar relative z-20"
        style={{ WebkitOverflowScrolling: "touch" }}>
        {steps.map((s, idx) => {
          const Icon = iconMap[s.iconKey];
          const isActive = idx === currentStep;
          const isDone = !s.signable
            ? stepStatus[s.key]?.checklist?.fulfilled
            : getDisplayStatus(stepStatus[s.key]?.signature, true).color === "emerald";
          // Use peeking: give min-w and margin to show prev/next peeks
          return (
            <li key={s.key} className="flex flex-col items-center select-none min-w-[52px] xs:min-w-[56px]">
              <button
                className={`${stepperButton} 
                  ${isActive
                    ? "border-fuchsia-600 bg-fuchsia-100 text-fuchsia-800 ring-2 ring-fuchsia-500/40 stepper-btn-active"
                    : isDone
                      ? "border-emerald-400 bg-emerald-100 text-emerald-700"
                      : "border-slate-200 bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-500"
                  }`}
                aria-current={isActive ? "step" : undefined}
                style={{ minWidth: "48px", minHeight: "48px" }}
                disabled={(!uploadsComplete && s.signable) || uploading}
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
  // Hide chevrons above xs/sm, stepper remains flex/grid responsive
  , [steps, currentStep, stepStatus, uploadsComplete, uploading, canScrollLeft, canScrollRight]);

  if (loadingData) return <div className="w-full flex flex-col items-center justify-center py-12"><span className="text-slate-500 text-lg font-bold">Cargando expediente...</span></div>;
  if (fetchError) return <div className="w-full flex flex-col items-center justify-center py-8"><span className="text-red-500 font-bold">{fetchError}</span></div>;

  const step = steps[currentStep];
  const status = stepStatus[step.key] || {};
  const { checklist, document, signature } = status;

  const historyDocs = Array.isArray(stepHistory?.[step.key]) ? stepHistory[step.key] : [];
  const latestDoc = historyDocs[0] || null;

  const isCurrentStepFulfilled = step.signable
    ? getDisplayStatus(signature, true).color === "emerald"
    : checklist && checklist.fulfilled;

  const canGoNext = currentStep < totalSteps - 1 && isCurrentStepFulfilled && !uploading && !signatureLoading;
  const nextButtonBase = mainButton + " min-w-[128px] flex items-center gap-2 justify-center transition relative overflow-visible";
  const nextButtonDisabled = "opacity-40 grayscale pointer-events-none";

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[620px] relative">
      <div className="w-full flex flex-col items-center sticky top-[56px] md:top-[60px] bg-transparent z-30">{mobileStepper}</div>
      <section className={wizardCard + " relative"}>
        {showHelperToast && (
          <div className="w-full bg-cyan-100/60 dark:bg-cyan-900/70 flex flex-row items-center justify-center rounded-xl py-3 px-4 shadow text-cyan-900 dark:text-cyan-100 font-semibold text-sm xs:text-base mb-1 text-center select-none animate-fade-in">
            <span className="inline">Para avanzar a cada paso, sube el archivo solicitado y espera la validación. Verás un mensaje de éxito cuando tu archivo haya sido recibido. Puedes navegar libremente en los pasos arriba si deseas consultar o regresar.</span>
          </div>
        )}
        <div className="flex flex-col items-center justify-center mb-3 pt-0">
          <div className="w-14 h-14 relative mb-2">
            <Image src="/IMAGOTIPO-IECS-IEDIS.png" alt="IECS-IEDIS" fill className="object-contain rounded-xl bg-white/70" />
          </div>
          <div className="flex flex-col items-center">
            <div className="inline-flex items-center text-xl xs:text-2xl md:text-3xl font-extrabold tracking-tight text-purple-900 dark:text-fuchsia-200 mb-0.5 leading-tight">
              {(() => {
                const Icon = iconMap[step.iconKey];
                return Icon ? <Icon className="h-9 w-9 md:h-11 md:w-11 align-middle inline-block mr-2 -mt-1" aria-hidden="true" /> : null;
              })()}
              <span>{step.label}</span>
            </div>
            <div className="text-xs xs:text-base md:text-lg text-slate-500 dark:text-slate-300 text-center max-w-[95vw] px-2 font-semibold leading-normal">
              {step.description}
            </div>
          </div>
        </div>
        {/* Status Badge and upload result display (persistent, always visible) */}
        <div className="w-full flex flex-row items-center justify-center py-1">
          {(() => {
            const stat = step.signable ? getDisplayStatus(signature, true) : getDisplayStatus(checklist, false);
            const Icon = stat.icon;
            return (
              <span className={`inline-flex items-center gap-2 font-bold text-xs md:text-sm px-3 py-1 rounded-full
                ${stat.color === "emerald"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : stat.color === "red"
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : stat.color === "yellow"
                      ? "bg-yellow-50 text-yellow-800 border border-yellow-100"
                      : "bg-slate-100 text-slate-500 border border-slate-100"
                } `
              }>
                {Icon && <Icon className="w-5 h-5 mr-0.5" />}
                {stat.display}
              </span>
            );
          })()}
        </div>
        <div className="flex-1 w-full px-0 flex flex-col gap-3 items-center mt-1 mb-1">
          {!step.signable ? (
            latestDoc ? (
              <div className="flex flex-col gap-2 items-center w-full">
                <PdfViewer url={latestDoc.filePath} height={380} className="mb-2"/>
                <div className="flex flex-row gap-3 w-full mb-1 items-center justify-center">
                  <a href={latestDoc.filePath} target="_blank" rel="noopener" className="flex items-center gap-2 border border-cyan-200 px-4 py-2 rounded-lg text-cyan-800 font-semibold bg-cyan-50 shadow-sm hover:bg-cyan-100 transition text-xs mt-1 mb-1">
                    <CloudArrowUpIcon className="w-5 h-5" />
                    Descargar PDF
                  </a>
                  <span className="inline-flex items-center px-2 py-1 rounded bg-cyan-50 text-xs text-slate-400 font-mono">
                    {latestDoc.uploadedAt ? `Subido ${formatDateDisplay(latestDoc.uploadedAt)}` : null}
                    {latestDoc.version ? <> &nbsp;| v{latestDoc.version}</> : null}
                  </span>
                </div>
                {uploadSuccess && (
                  <div className="flex items-center justify-center gap-2 px-5 py-2 mt-1 rounded-xl text-emerald-800 font-bold shadow bg-emerald-50 border-emerald-200 border animate-pop w-fit min-w-[210px]">
                    <svg className="w-7 h-7 text-emerald-400 animate-sparkle" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="#34D399" strokeWidth="3" fill="#A7F3D0"/>
                      <path d="M7 13l3 3 7-7" stroke="#059669" strokeWidth="2.3" fill="none" strokeLinecap="round"/>
                    </svg>
                    <span>{uploadSuccess}</span>
                  </div>
                )}
                {latestDoc.reviewComment && (
                  <div className="flex flex-row items-center gap-2 bg-fuchsia-50 border border-fuchsia-200 rounded px-3 py-2 text-xs text-fuchsia-900 mt-1 mb-1 shadow-sm max-w-xl w-full">
                    <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-fuchsia-400" />
                    <span className="break-words">{latestDoc.reviewComment}</span>
                  </div>
                )}
                {historyDocs.length > 1 && (
                  <div className="w-full mt-3 px-1">
                    <div className="font-bold text-cyan-900 dark:text-cyan-100 mb-1 text-xs flex items-center gap-2">
                      <DocumentDuplicateIcon className="w-5 h-5 text-cyan-400" />
                      Versiones anteriores
                    </div>
                    <div className="flex flex-col gap-1 max-h-40 overflow-auto">
                      {historyDocs.slice(1).map((doc, idx) => {
                        const stat = getStatusMeta(doc.status);
                        const Icon = stat.icon;
                        return (
                          <div key={doc.id} className="flex flex-col gap-0.5 border border-cyan-50 dark:border-slate-800 py-1 px-2 rounded bg-cyan-50/50 dark:bg-slate-800/30 text-[12px]">
                            <div className="flex flex-row gap-2 items-center">
                              <a href={doc.filePath} target="_blank" className="underline text-cyan-800 dark:text-cyan-200 font-bold break-all">{`Versión v${doc.version}`}</a>
                              <span className="ml-2 text-slate-500">{formatDateDisplay(doc.uploadedAt)}</span>
                              <span className={`inline-flex items-center gap-1 ml-2 font-bold text-xs ${stat.color === "emerald" ? "text-emerald-700" : stat.color === "red" ? "text-red-700" : "text-slate-400"}`}>
                                {Icon && <Icon className="w-4 h-4" />}
                                {stat.display}
                              </span>
                            </div>
                            {doc.reviewComment && (
                              <div className="flex flex-row items-center gap-2 bg-fuchsia-50 border border-fuchsia-100 rounded px-2 py-1 text-xs text-fuchsia-900 mt-1 shadow-sm max-w-xl w-full">
                                <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-fuchsia-400" />
                                <span className="break-words">{doc.reviewComment}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="w-full flex flex-col justify-center items-center mt-3">
                  <DocumentDropzone
                    loading={uploading}
                    error={uploadError}
                    onFile={handleFileUpload}
                    accept="application/pdf"
                  />
                  {uploadProgress !== null &&
                    <div className="w-full pt-2">
                      <div className="relative w-full h-3 rounded-full overflow-hidden bg-slate-100">
                        <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all"
                             style={{width: `${uploadProgress}%`}}></div>
                      </div>
                      <div className="text-center text-sm mt-1 font-bold text-cyan-700">{uploadProgress}%</div>
                    </div>
                  }
                </div>
              </div>
            ) : (
              <div className="w-full mt-3">
                <DocumentDropzone
                  loading={uploading}
                  error={uploadError}
                  onFile={handleFileUpload}
                  accept="application/pdf"
                />
                {uploadProgress !== null &&
                  <div className="w-full pt-2">
                    <div className="relative w-full h-3 rounded-full overflow-hidden bg-slate-100">
                      <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all"
                           style={{width: `${uploadProgress}%`}}></div>
                    </div>
                    <div className="text-center text-sm mt-1 font-bold text-cyan-700">{uploadProgress}%</div>
                  </div>
                }
                {uploadSuccess && (
                  <div className="flex items-center justify-center gap-2 px-5 py-2 mt-2 rounded-xl text-emerald-800 font-bold shadow bg-emerald-50 border-emerald-200 border animate-pop w-fit min-w-[210px]">
                    <svg className="w-7 h-7 text-emerald-400 animate-sparkle" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="#34D399" strokeWidth="3" fill="#A7F3D0"/>
                      <path d="M7 13l3 3 7-7" stroke="#059669" strokeWidth="2.3" fill="none" strokeLinecap="round"/>
                    </svg>
                    <span>{uploadSuccess}</span>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="flex flex-col gap-2 items-center w-full">
              {step.key === "reglamento" && <StubReglamento />}
              {step.key === "contrato" && <StubContrato />}
              {uploadsComplete ? (
                <>
                  {signature && signature.status !== "signed" && signature.status !== "completed" && (freshWidgetId || signature.mifielMetadata?.signers?.[0]?.widget_id) && (
                    <div className="w-full mx-auto mb-2">
                      <MifielWidgetClient
                        widgetId={freshWidgetId || (signature?.mifielMetadata?.signers?.[0]?.widget_id)}
                        env="production"
                        onSuccess={handleWidgetSuccess}
                        onError={(err) => setSignatureStatus("Error en la firma: " + (err?.message ?? err))}
                      />
                    </div>
                  )}
                  {signature && (signature.status === "signed" || signature.status === "completed") && (
                    <div className="w-full flex flex-col items-center gap-2 mt-2">
                      <div className="text-base xs:text-lg text-emerald-700 font-bold">¡Documento firmado digitalmente!</div>
                      {signature?.mifielMetadata?.file_signed && (
                        <a
                          href={`https://app.mifiel.com${signature.mifielMetadata.file_signed}`}
                          target="_blank"
                          rel="noopener"
                          className="text-cyan-700 underline font-bold text-xs"
                        >
                          Descargar documento firmado
                        </a>
                      )}
                    </div>
                  )}
                  {(signature?.status !== "signed" && signature?.status !== "completed") && !freshWidgetId && (
                    <button
                      onClick={handleSign}
                      disabled={signatureLoading}
                      className={mainButton + " mt-4 flex flex-row items-center justify-center gap-2"}
                    >
                      Firmar digitalmente ahora
                    </button>
                  )}
                  {signatureStatus && (
                    <div className="w-full text-center text-xs mt-2 text-purple-700 font-bold">{signatureStatus}</div>
                  )}
                  {!signature && !signatureLoading && (
                    <div className="w-full text-center text-xs mt-2 text-purple-700 font-bold">Debes firmar digitalmente el documento mostrado arriba.</div>
                  )}
                </>
              ) : (
                <div className="w-full text-center text-sm text-yellow-700 mt-2 font-semibold px-3">
                  Antes de firmar este documento, completa primero todos los archivos requeridos.
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex w-full justify-between items-center pt-10 sm:pt-12 pb-[68px] md:pb-6 gap-3 sticky bottom-0 bg-transparent z-10">
          <button
            className={secondaryButton + " min-w-[120px]"}
            style={{ fontWeight: 900, fontSize: "1.08em" }}
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={currentStep === 0}
            tabIndex={0}
          >
            <ArrowLeftCircleIcon className="w-6 h-6" />
            Atrás
          </button>
          <button
            className={
              nextButtonBase +
              (!canGoNext ? " " + nextButtonDisabled : "") +
              (animateNext ? " animate-pop" : "")
            }
            style={{
              fontWeight: 900,
              fontSize: "1.11em",
              filter: animateNext ? "drop-shadow(0 6px 16px #a7f3d0)" : undefined
            }}
            disabled={!canGoNext}
            onClick={() => {
              if (canGoNext) setCurrentStep(currentStep + 1);
            }}
            tabIndex={0}
            aria-disabled={!canGoNext}
          >
            <span>Siguiente</span>
            {animateNext &&
              <span className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <svg className="w-14 h-14 animate-sparkle" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="15" fill="#A7F3D0" fillOpacity=".16"/>
                  <circle cx="24" cy="24" r="8" fill="#34D399" fillOpacity=".33"/>
                  <circle cx="24" cy="24" r="4" fill="#059669" fillOpacity=".44"/>
                  <g>
                    {[...Array(7)].map((_, i) => {
                      const angle = i * (360/7);
                      const x = 24 + Math.cos(angle * Math.PI/180) * 14;
                      const y = 24 + Math.sin(angle * Math.PI/180) * 14;
                      return <circle key={i} cx={x} cy={y} r={2+i%2} fill="#34D399" opacity="0.8"/>;
                    })}
                  </g>
                </svg>
              </span>
            }
            <ArrowRightCircleIcon className="w-6 h-6" />
          </button>
        </div>
      </section>
      {numUploadedDocs === requiredUploadSteps.length &&
        stepStatus.contrato?.signature?.status === "signed" &&
        stepStatus.reglamento?.signature?.status === "signed" && (
        <div className="mt-7 text-base xs:text-lg font-extrabold text-emerald-700 bg-emerald-50 rounded-xl px-6 py-4 border border-emerald-200 text-center shadow w-full">
          ¡Has completado tu expediente! Muchas gracias y bienvenido(a) a IECS-IEDIS.
        </div>
      )}
      <style jsx global>{`
        @keyframes pop {
          0% { transform: scale(1);}
          20% { transform: scale(1.10);}
          40% { transform: scale(0.96);}
          60% { transform: scale(1.04);}
          80% { transform: scale(0.98);}
          100% { transform: scale(1);}
        }
        .animate-pop { animation: pop 0.8s cubic-bezier(.18,1.3,.99,1) both; }
        @keyframes sparkle {
          0% { opacity: 0; transform: scale(0.6);}
          20% { opacity: 1; transform: scale(1.08);}
          50% { opacity: 1; transform: scale(0.94);}
          75% { opacity: 1; transform: scale(1.03);}
          100% { opacity: 0; transform: scale(1.16);}
        }
        .animate-sparkle { animation: sparkle 0.9s cubic-bezier(.14,1.3,.45,1.02) both; }
        .animate-fade-in { animation: fadein 0.888s both; }
        @keyframes fadein {
          0% { opacity: 0; transform: translateY(-10px);}
          100% { opacity: 1; transform: translateY(0);}
        }
      `}</style>
    </div>
  );
}
