
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import {
  ArrowLeftCircleIcon, ArrowRightCircleIcon,
  ArrowPathIcon, CheckCircleIcon, XCircleIcon, CloudArrowUpIcon, InformationCircleIcon,
  IdentificationIcon, DocumentTextIcon, BriefcaseIcon, ShieldCheckIcon, AcademicCapIcon, UserCircleIcon, UserGroupIcon, ReceiptRefundIcon, UserPlusIcon, CheckCircleIcon as CheckCircleIconOutline, BookOpenIcon, PencilSquareIcon,
  DocumentDuplicateIcon,
  ChatBubbleLeftEllipsisIcon
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
  DocumentDuplicateIcon,
  ChatBubbleLeftEllipsisIcon
};

function formatDateDisplay(date) {
  if (!date) return "";
  try {
    return new Date(date).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return String(date);
  }
}

function formatStatusIcon(status) {
  if (status === "fulfilled" || status === "accepted" || status === "signed" || status === "completed")
    return <CheckCircleIcon className="text-emerald-500 w-5 h-5 inline align-middle" />;
  if (status === "pending" || status === "signing")
    return <ArrowPathIcon className="text-yellow-500 w-5 h-5 inline align-middle animate-spin-slow" />;
  if (status === "rejected")
    return <XCircleIcon className="text-red-500 w-5 h-5 inline align-middle" />;
  return <InformationCircleIcon className="text-gray-300 w-5 h-5 inline align-middle" />;
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

  // Live wizard state
  const [stepStatus, setStepStatus] = useState({});
  const [stepHistory, setStepHistory] = useState({});
  const [fetchError, setFetchError] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  // Always refetch data on mount or after upload
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

  // Fetch on mount
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
          // Optimistically re-fetch the latest file list/histories
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
        // After sign init, refetch to get latest signature object/status
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

  // Rerender after download/signature event (calls to MiFiel, etc.)
  function handleWidgetSuccess() {
    fetchExpedienteSteps();
    setSignatureStatus("¡Documento firmado!");
  }

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
                {Icon && <Icon className="h-8 w-8 sm:h-9 sm:w-9 align-middle" aria-hidden="true" />}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  , [steps, currentStep, stepStatus, uploadsComplete, uploading]);

  if (loadingData) return <div className="w-full flex flex-col items-center justify-center py-12"><span className="text-slate-500 text-lg font-bold">Cargando expediente...</span></div>;
  if (fetchError) return <div className="w-full flex flex-col items-center justify-center py-8"><span className="text-red-500 font-bold">{fetchError}</span></div>;

  const step = steps[currentStep];
  const status = stepStatus[step.key] || {};
  const { checklist, document, signature } = status;

  // Historical versions from up-to-date fetch, newest first
  const historyDocs = Array.isArray(stepHistory?.[step.key]) ? stepHistory[step.key] : [];
  const latestDoc = historyDocs[0] || null;

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
      <div className="w-full flex flex-col items-center sticky top-[56px] md:top-[60px] bg-transparent z-30">{stepper}</div>
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
                  <span className="inline-flex items-center gap-1 text-xs font-bold">
                    {formatStatusIcon(latestDoc.status)}
                    {latestDoc.status}
                  </span>
                </div>
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
                      {historyDocs.slice(1).map((doc, idx) => (
                        <div key={doc.id} className="flex flex-col gap-0.5 border border-cyan-50 dark:border-slate-800 py-1 px-2 rounded bg-cyan-50/50 dark:bg-slate-800/30 text-[12px]">
                          <div className="flex flex-row gap-2 items-center">
                            <a href={doc.filePath} target="_blank" className="underline text-cyan-800 dark:text-cyan-200 font-bold break-all">{`Versión v${doc.version}`}</a>
                            <span className="ml-2 text-slate-500">{formatDateDisplay(doc.uploadedAt)}</span>
                            <span className="inline-flex items-center gap-1 ml-2">
                              {formatStatusIcon(doc.status)}
                              {doc.status}
                            </span>
                          </div>
                          {doc.reviewComment && (
                            <div className="flex flex-row items-center gap-2 bg-fuchsia-50 border border-fuchsia-100 rounded px-2 py-1 text-xs text-fuchsia-900 mt-1 shadow-sm max-w-xl w-full">
                              <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-fuchsia-400" />
                              <span className="break-words">{doc.reviewComment}</span>
                            </div>
                          )}
                        </div>
                      ))}
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
                  {uploadSuccess && <div className="text-emerald-700 mt-2 text-xs font-bold">{uploadSuccess}</div>}
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
