
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import {
  ArrowLeftCircleIcon, ArrowRightCircleIcon,
  ArrowPathIcon, CheckCircleIcon, XCircleIcon, CloudArrowUpIcon, InformationCircleIcon,
  IdentificationIcon, DocumentTextIcon, BriefcaseIcon, ShieldCheckIcon, AcademicCapIcon, UserCircleIcon, UserGroupIcon, ReceiptRefundIcon, UserPlusIcon, CheckCircleIcon as CheckCircleIconOutline, BookOpenIcon, PencilSquareIcon,
} from "@heroicons/react/24/solid";
import { stepsExpediente } from "./stepMetaExpediente";
import { wizardCard, stepperButton, navigationButton, secondaryButton, mainButton } from "../lib/ui-classes";
import dynamic from "next/dynamic";
import DocumentDropzone from "./DocumentDropzone";
import PdfViewer from "./PdfViewer";
import { StubReglamento, StubContrato } from "./ReglamentoContratoStub";
const MifielWidgetClient = dynamic(() => import("./MifielWidgetClient"), { ssr: false });

const iconMap = {
  IdentificationIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  UserCircleIcon,
  UserGroupIcon,
  ReceiptRefundIcon,
  UserPlusIcon,
  CheckCircleIcon: CheckCircleIconOutline,
  BookOpenIcon,
  PencilSquareIcon,
};

function statusIcon(status) {
  if (status === "fulfilled" || status === "accepted" || status === "signed") return <CheckCircleIcon className="text-emerald-500 w-7 h-7" />;
  if (status === "pending" || status === "signing") return <ArrowPathIcon className="text-yellow-500 w-7 h-7 animate-spin-slow" />;
  if (status === "rejected") return <XCircleIcon className="text-red-500 w-7 h-7" />;
  return <InformationCircleIcon className="text-gray-300 w-7 h-7" />;
}

export default function EmployeeOnboardingWizard({ user, steps, stepStatus }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [uploadProgress, setUploadProgress] = useState(null);
  const [signatureStatus, setSignatureStatus] = useState(null);
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [freshWidgetId, setFreshWidgetId] = useState("");
  const scrollerRef = useRef(null);

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
      const idx = steps.findIndex(s => !s.signable && !stepStatus[s.key]?.checklist?.fulfilled);
      if (idx !== -1) setCurrentStep(idx);
    }
  }, [uploadsComplete, currentStep]);

  useEffect(() => {
    if (scrollerRef.current) {
      const btn = scrollerRef.current.querySelector(".stepper-btn-active");
      if (btn) btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
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
          setUploadSuccess("¡Archivo subido! Esperando validación.");
          setTimeout(() => window.location.reload(), 1000);
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
  }, [currentStep, steps, stepStatus]);

  const stepper = useMemo(() =>
    <div className="relative w-full max-w-2xl px-2 overflow-visible z-20 pb-1">
      <div className="pointer-events-none absolute left-0 top-0 h-full w-7 z-10" style={{
        background: "linear-gradient(to right,rgba(255,255,255,0.95) 75%,transparent 100%)"
      }} />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-7 z-10" style={{
        background: "linear-gradient(to left,rgba(255,255,255,0.95) 75%,transparent 100%)"
      }} />
      <ol
        ref={scrollerRef}
        className="flex w-full justify-center items-center gap-3 sm:gap-4 overflow-x-auto py-3 px-3 sm:px-7 scroll-smooth no-scrollbar relative z-20"
        style={{ WebkitOverflowScrolling: "touch" }}>
        {steps.map((s, idx) => {
          const Icon = iconMap[s.iconKey];
          const isActive = idx === currentStep;
          const isDone = !s.signable
            ? stepStatus[s.key]?.checklist?.fulfilled
            : stepStatus[s.key]?.signature?.status === "signed" || stepStatus[s.key]?.signature?.status === "completed";
          return (
            <li key={s.key} className="flex flex-col items-center">
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
                {Icon && <Icon className="h-8 w-8 sm:h-9 sm:w-9" aria-hidden="true" />}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  , [steps, currentStep, stepStatus, uploadsComplete, uploading]);

  const step = steps[currentStep];
  const status = stepStatus[step.key] || {};
  const { checklist, document, signature } = status;

  function formatStatus(item, isSignable) {
    if (isSignable) {
      if (!item) return { color: "gray", text: "Pendiente" };
      if (item.status === "completed" || item.status === "signed") return { color: "emerald", text: "Firmado" };
      if (item.status === "pending" || item.status === "signing") return { color: "yellow", text: "Firma en proceso" };
      return { color: "gray", text: "Pendiente" };
    } else {
      if (!item) return { color: "gray", text: "Pendiente" };
      if (item.fulfilled) return { color: "emerald", text: "Entregado" };
      if (item.status === "rejected") return { color: "red", text: "Rechazado" };
      return { color: "gray", text: "Pendiente" };
    }
  }

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[620px] relative">
      {/* Sticky stepper */}
      <div className="w-full flex flex-col items-center sticky top-[56px] md:top-[60px] bg-transparent z-30">{stepper}</div>

      {/* Main Glass Card */}
      <section className={wizardCard + " relative"}>
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
        <div className="w-full flex justify-center py-1">
          <span className={`font-bold text-xs md:text-sm px-3 py-1 rounded-full
            ${formatStatus(step.signable ? signature : checklist, step.signable).color === "emerald"
                ? "bg-emerald-50 text-emerald-700"
                : formatStatus(step.signable ? signature : checklist, step.signable).color === "red"
                    ? "bg-red-50 text-red-600"
                    : formatStatus(step.signable ? signature : checklist, step.signable).color === "yellow"
                        ? "bg-yellow-50 text-yellow-800"
                        : "bg-slate-100 text-slate-500"}
            `}>
            {formatStatus(step.signable ? signature : checklist, step.signable).text}
          </span>
        </div>
        <div className="flex-1 w-full px-0 flex flex-col gap-3 items-center mt-1 mb-1">
          {!step.signable ? (
            checklist && checklist.documentId && document ? (
              <div className="flex flex-col gap-2 items-center w-full">
                <PdfViewer url={document.filePath} height={380} className="mb-2"/>
                <div className="flex flex-row gap-2 w-full mb-1 items-center justify-center">
                  <a href={document.filePath} target="_blank" rel="noopener" className="flex items-center gap-2 border border-cyan-200 px-4 py-2 rounded-lg text-cyan-800 font-semibold bg-cyan-50 shadow-sm hover:bg-cyan-100 transition text-xs mt-1 mb-1">
                    <CloudArrowUpIcon className="w-5 h-5" />
                    Descargar PDF
                  </a>
                  <span className="text-xs text-slate-400">{document.uploadedAt ? `Subido ${new Date(document.uploadedAt).toLocaleDateString()}` : null}</span>
                </div>
                {/* progress, status, and re-upload */}
                <div className="w-full flex flex-col justify-center items-center">
                  {checklist.status === "rejected" && checklist.rejectionReason && (
                    <div className="px-3 py-1 mb-1 bg-red-50 text-red-700 rounded text-xs w-full text-left border border-red-200">
                      Motivo de rechazo: {checklist.rejectionReason}
                    </div>
                  )}
                  {(checklist.status === "rejected" || !checklist.fulfilled) && (
                    <div className="w-full">
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
                      {uploadSuccess && <div className="text-emerald-700 mt-2 text-xs font-bold">{uploadSuccess}</div>}
                    </div>
                  )}
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
                {uploadSuccess && <div className="text-emerald-700 mt-2 text-xs font-bold">{uploadSuccess}</div>}
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
                        onSuccess={() => window.location.reload()}
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
        {/* Nav bar: always visible, sticky, space for floating support */}
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
            className={navigationButton + " min-w-[128px]"}
            style={{ fontWeight: 900, fontSize: "1.11em" }}
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={currentStep === totalSteps - 1 || (steps[currentStep + 1]?.signable && !uploadsComplete)}
            tabIndex={0}
            aria-disabled={currentStep === totalSteps - 1 || (steps[currentStep + 1]?.signable && !uploadsComplete)}
          >
            Siguiente
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
    </div>
  );
}
