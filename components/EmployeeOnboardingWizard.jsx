
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ArrowRightCircleIcon, ArrowLeftCircleIcon, DocumentPlusIcon, CheckCircleIcon, XCircleIcon, PencilIcon, CloudArrowUpIcon } from "@heroicons/react/24/solid";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

function statusIcon(status) {
  if (status === "fulfilled" || status === "accepted" || status === "signed") return <CheckCircleIcon className="text-emerald-500 w-7 h-7" />;
  if (status === "pending" || status === "signing") return <ArrowPathIcon className="text-yellow-500 w-7 h-7 animate-spin-slow" />;
  if (status === "rejected") return <XCircleIcon className="text-red-500 w-7 h-7" />;
  return <DocumentPlusIcon className="text-gray-400 w-7 h-7" />;
}

// Accepts:
// - user = { id, name, ... }
// - steps = onboarding step metadata
// - stepStatus = map from doc key to {checklist, document, signature}
export default function EmployeeOnboardingWizard({ user, steps, stepStatus }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [signatureStatus, setSignatureStatus] = useState(null);
  const [signatureLoading, setSignatureLoading] = useState(false);

  // Scroll wizard steps into view on mobile when switching step
  const stepRefs = useRef({});

  function goStep(idx) {
    setCurrentStep(idx);
    if (stepRefs.current[idx]) stepRefs.current[idx].scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const step = steps[currentStep];
  const myStatus = stepStatus[step.key] || {};
  const { checklist, document, signature } = myStatus;

  // Progress calculation
  const totalSteps = steps.length;
  let completed = 0, completedIdx = -1;
  steps.forEach((s, i) => {
    const { checklist, document, signature } = stepStatus[s.key] || {};
    if (s.signable && signature && (signature.status === "completed" || signature.status === "signed")) {
      completed++;
      completedIdx = i;
    } else if (!s.signable && checklist && checklist.fulfilled) {
      completed++;
      completedIdx = i;
    }
  });

  // Upload handler
  async function handleFileUpload(e) {
    e.preventDefault();
    if (!e.target.file.files[0]) return;
    setUploading(true);
    setUploadError("");
    setUploadSuccess("");
    const formData = new FormData();
    formData.append("file", e.target.file.files[0]);
    try {
      const res = await fetch(`/api/documents/${user.id}/${step.key}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Error al subir el archivo.");
      } else {
        setUploadSuccess("¡Archivo subido! Esperando validación.");
        // Optionally, could reload page or fetch status live here
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      setUploadError("Error de red al subir archivo.");
    }
    setUploading(false);
  }

  // Signature handler
  async function handleSign() {
    setSignatureLoading(true);
    setSignatureStatus("");
    try {
      const res = await fetch(`/api/documents/${user.id}/${step.key}/sign`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSignatureStatus(data.error || "No se pudo iniciar la firma.");
      } else {
        setSignatureStatus("Firma iniciada, esperando confirmación en Mifiel...");
        // Optionally: Live-polling or reload for update.
        setTimeout(() => window.location.reload(), 1800);
      }
    } catch {
      setSignatureStatus("No fue posible conectar con servidor de firma.");
    }
    setSignatureLoading(false);
  }

  function formatStatus(item, key, isSignable) {
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

  // Main
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6eafe] via-[#e4f7fb] to-[#eafff7] dark:from-[#181e2a] dark:via-[#192736] dark:to-[#225245] flex flex-col items-center pt-4 pb-8 px-0 sm:px-2">
      {/* Header with branding */}
      <header className="flex flex-col items-center mb-4 gap-1">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-3">
          <Image
            src="/IMAGOTIPO-IECS-IEDIS.png"
            alt="IECS-IEDIS"
            fill
            className="object-contain rounded-2xl bg-white/70"
            priority
          />
        </div>
        <h1 className="font-bold text-2xl xs:text-3xl text-center text-slate-900 dark:text-white" style={{ fontFamily: "var(--font-fredoka), var(--font-montserrat), sans-serif" }}>
          Expediente Laboral Digital
        </h1>
        <div className="text-sm text-slate-700 dark:text-slate-300 text-center w-full font-semibold pb-1">
          Hola <span className="font-extrabold">{user.name?.split(" ")[0]}</span>, completa tu expediente en IECS-IEDIS. Sube tus documentos y firma con seguridad.
        </div>
      </header>

      {/* Progress & Stepper Sticky Topbar */}
      <nav className="w-full max-w-lg mx-auto sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 rounded-2xl shadow-sm mb-5 p-2 flex flex-col gap-1">
        {/* Pebble stepper: always scrollable */}
        <ol className="flex overflow-x-auto gap-3 sm:gap-4 py-2 px-1">
          {steps.map((s, idx) => {
            const active = idx === currentStep;
            const state = s.signable
              ? (stepStatus[s.key]?.signature?.status || "pending")
              : (stepStatus[s.key]?.checklist?.fulfilled ? "fulfilled" : (stepStatus[s.key]?.checklist?.status || "pending"));
            const done = s.signable
              ? stepStatus[s.key]?.signature?.status === "completed" || stepStatus[s.key]?.signature?.status === "signed"
              : stepStatus[s.key]?.checklist?.fulfilled;
            return (
              <li
                key={s.key}
                ref={el => (stepRefs.current[idx] = el)}
                className={`flex flex-col items-center cursor-pointer group select-none transition ${active ? "scale-110 z-10" : "scale-95"} `}
                onClick={() => goStep(idx)}
              >
                <span
                  className={`rounded-full w-11 h-11 flex items-center justify-center font-bold text-base border-2 transition
                    ${done ? "bg-emerald-200 border-emerald-400 text-emerald-900" :
                        active ? "bg-purple-200 border-purple-500 text-purple-900" :
                        "bg-white/80 border-slate-300 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}
                    group-hover:scale-105`}
                  title={s.label}
                >
                  {statusIcon(done? "fulfilled" : state)}
                </span>
                <span className={`whitespace-nowrap text-xs mt-1 text-center font-bold px-2
                  ${active ? "text-purple-700 dark:text-fuchsia-200" : done ? "text-emerald-700" : "text-slate-600 dark:text-slate-300"}`}>
                  {s.label.split("(")[0]}
                </span>
              </li>
            );
          })}
        </ol>
        {/* Progress bar */}
        <div className="h-1.5 bg-gradient-to-r from-purple-300 via-cyan-200 to-emerald-300 rounded-full relative overflow-hidden mt-2">
          <div
            className="h-full bg-gradient-to-r from-fuchsia-400 to-cyan-400 transition-all rounded-full"
            style={{ width: `${((completed / totalSteps) * 100).toFixed(0)}%` }}
          ></div>
        </div>
        <div className="flex justify-end pt-2 pr-2 text-xs text-slate-500 dark:text-slate-300 font-bold">
          {completed}/{totalSteps} pasos completados
        </div>
      </nav>

      {/* Main: One Step at a Time */}
      <section className="w-full max-w-lg mx-auto flex-1 shadow-xl rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-100 dark:border-slate-800 flex flex-col px-2 sm:px-7 pt-7 pb-7 gap-4 min-h-[420px]">
        {/* Title + Step Description */}
        <div className="flex flex-col gap-3 items-center text-center">
          <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight" style={{ fontFamily: "var(--font-fredoka),sans-serif" }}>
            Paso {currentStep + 1} de {totalSteps}: {step.label}
          </div>
          <div className="text-base font-medium text-slate-700 dark:text-slate-300 max-w-lg">{step.description}</div>
        </div>

        {/* Status Feedback */}
        <div className="w-full flex justify-center py-3">
          <span className={`font-bold text-sm px-3 py-1 rounded-md
            ${formatStatus(step.signable ? signature : checklist, step.key, step.signable).color === "emerald"
                ? "bg-emerald-100 text-emerald-800"
                : formatStatus(step.signable ? signature : checklist, step.key, step.signable).color === "red"
                    ? "bg-red-100 text-red-700"
                    : formatStatus(step.signable ? signature : checklist, step.key, step.signable).color === "yellow"
                        ? "bg-yellow-50 text-yellow-900"
                        : "bg-slate-100 text-slate-700"}
            `}>
            {formatStatus(step.signable ? signature : checklist, step.key, step.signable).text}
          </span>
        </div>

        {/* STEP CONTENT: 1 - Doc Upload, 2 - Signature steps */}
        <div>
          {!step.signable ? (
            // REGULAR DOCUMENT UPLOAD STEP
            <>
              {/* Already uploaded */}
              {checklist && checklist.documentId && document ? (
                <div className="flex flex-col gap-2 items-center mt-3">
                  <a href={document.filePath} target="_blank" rel="noopener" className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold bg-cyan-100 text-cyan-900 border border-cyan-300 hover:bg-cyan-200 transition text-sm shadow">
                    <CloudArrowUpIcon className="w-5 h-5" />
                    Ver documento subido
                  </a>
                  <div className="text-xs mt-2 text-slate-600 dark:text-slate-400">
                    Subido el {new Date(document.uploadedAt).toLocaleDateString()}
                  </div>
                  {(checklist.status === "rejected" || !checklist.fulfilled) && (
                    <form className="flex flex-col items-center gap-2" onSubmit={handleFileUpload}>
                      <label className="text-xs font-semibold text-red-600 dark:text-red-300">
                        {checklist.status === "rejected" ? "Documento rechazado. Sube uno nuevo." : "¿Necesitas reemplazar el archivo?"}
                      </label>
                      <input
                        type="file"
                        name="file"
                        accept="application/pdf"
                        required
                        className="w-52 text-slate-700 bg-white border px-2 py-2 rounded shadow mt-1 text-xs"
                        disabled={uploading}
                      />
                      <button
                        className="mt-2 py-1 px-5 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold text-sm shadow-md hover:from-cyan-700 hover:to-teal-900 transition"
                        type="submit"
                        disabled={uploading}
                      >
                        {uploading ? "Subiendo..." : "Reemplazar"}
                      </button>
                      {uploadError && <div className="text-red-500 mt-1 text-xs font-bold">{uploadError}</div>}
                      {uploadSuccess && <div className="text-emerald-700 mt-1 text-xs font-bold">{uploadSuccess}</div>}
                    </form>
                  )}
                  {checklist.status === "rejected" && checklist.rejectionReason && (
                    <div className="mt-2 px-3 py-2 bg-red-100 text-red-800 rounded-md text-xs w-full font-bold text-left border border-red-300">
                      Motivo rechazo: {checklist.rejectionReason}
                    </div>
                  )}
                </div>
              ) : (
                // Not uploaded
                <form className="flex flex-col items-center gap-2 mt-4" onSubmit={handleFileUpload}>
                  <label className="font-bold text-xs mb-1 text-cyan-700">Selecciona archivo PDF para subir</label>
                  <input
                    type="file"
                    name="file"
                    accept="application/pdf"
                    required
                    className="w-64 text-slate-700 bg-white border px-2 py-2 rounded shadow"
                    disabled={uploading}
                  />
                  <button
                    className="mt-2 py-2 px-6 rounded-full bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-bold text-base shadow-md hover:from-emerald-700 hover:to-cyan-900 transition"
                    type="submit"
                    disabled={uploading}
                  >
                    {uploading ? "Subiendo..." : "Subir"}
                  </button>
                  {uploadError && <div className="text-red-500 mt-1 text-xs font-bold">{uploadError}</div>}
                  {uploadSuccess && <div className="text-emerald-700 mt-1 text-xs font-bold">{uploadSuccess}</div>}
                </form>
              )}
            </>
          ) : (
            // SIGNABLE DOCUMENT
            <>
              {/* Must have uploaded doc for signature */}
              {document ? (
                <div className="flex flex-col gap-4 items-center mt-2">
                  <a href={document.filePath} target="_blank" rel="noopener" className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold bg-purple-100 text-purple-800 border border-purple-300 hover:bg-purple-200 shadow">
                    <CloudArrowUpIcon className="w-5 h-5" />
                    Ver documento subido
                  </a>
                  {(signature?.status === "completed" || signature?.status === "signed") ? (
                    <div className="flex flex-col items-center mt-2">
                      <span className="text-emerald-700 font-bold text-lg">Documento firmado digitalmente</span>
                      <a href={signature.mifielMetadata?.file_signed ? `https://app.mifiel.com${signature.mifielMetadata.file_signed}` : "#"}
                         target="_blank"
                         rel="noopener"
                         className="text-cyan-700 underline font-semibold mt-1"
                         >
                        Descargar documento firmado
                      </a>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 items-center">
                      <button
                        onClick={handleSign}
                        disabled={signatureLoading}
                        className="inline-flex items-center gap-2 px-7 py-2 rounded-full font-bold text-white text-base bg-gradient-to-r from-fuchsia-700 to-cyan-600 hover:from-cyan-700 hover:to-fuchsia-800 shadow-lg transition"
                      >
                        <PencilIcon className="w-5 h-5" />
                        {signatureLoading
                          ? "Iniciando firma..."
                          : (signature?.status === "signing" || signature?.status === "pending"
                              ? "Firma en curso (esperando Mifiel)"
                              : "Firmar digitalmente ahora")}
                      </button>
                      {signatureStatus && (
                        <div className="text-xs mt-2 text-purple-700 font-bold">{signatureStatus}</div>
                      )}
                      {/* Show WidgetId hint */}
                      {signature?.mifielMetadata?.signers?.[0]?.widget_id && (
                        <div className="mt-2">
                          <div className="font-bold text-xs text-slate-700">
                            <span className="text-purple-600">Para firmar:</span>
                            <br />
                            <span className="break-all">Copia este Widget ID:</span>
                            <div className="p-2 mt-1 select-all bg-purple-50 border border-purple-200 rounded text-xs text-purple-800">{signature.mifielMetadata.signers[0].widget_id}</div>
                          </div>
                          <div className="mt-2 mb-2 bg-slate-100 border text-xs border-slate-200 rounded p-1">
                            Abre el widget de firma digital de Mifiel y pega el Widget ID anterior.
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                // No doc uploaded yet
                <form className="flex flex-col items-center gap-2 mt-4" onSubmit={handleFileUpload}>
                  <label className="font-bold text-xs mb-1 text-purple-700">Selecciona archivo PDF para subir y firmar</label>
                  <input
                    type="file"
                    name="file"
                    accept="application/pdf"
                    required
                    className="w-64 text-slate-700 bg-white border px-2 py-2 rounded shadow"
                    disabled={uploading}
                  />
                  <button
                    className="mt-2 py-2 px-6 rounded-full bg-gradient-to-r from-fuchsia-700 to-cyan-600 text-white font-bold text-base shadow-md hover:from-cyan-700 hover:to-fuchsia-800 transition"
                    type="submit"
                    disabled={uploading}
                  >
                    {uploading ? "Subiendo..." : "Subir y continuar"}
                  </button>
                  {uploadError && <div className="text-red-500 mt-1 text-xs font-bold">{uploadError}</div>}
                  {uploadSuccess && <div className="text-emerald-700 mt-1 text-xs font-bold">{uploadSuccess}</div>}
                </form>
              )}
            </>
          )}
        </div>

        {/* Step navigation */}
        <div className="flex w-full justify-between items-center pt-8">
          <button
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition 
              ${currentStep === 0 ? "opacity-70 pointer-events-none" : ""}`}
            onClick={() => goStep(currentStep - 1)}
            disabled={currentStep === 0}
          >
            <ArrowLeftCircleIcon className="w-5 h-5" />
            Atrás
          </button>
          <button
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition 
              ${currentStep === totalSteps - 1 ? "opacity-70 pointer-events-none" : ""}`}
            onClick={() => goStep(currentStep + 1)}
            disabled={currentStep === totalSteps - 1}
          >
            Siguiente
            <ArrowRightCircleIcon className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Congratulation/Final Callout */}
      {completed === totalSteps && (
        <div className="mt-5 text-2xl font-extrabold text-emerald-700 bg-emerald-50 rounded-xl px-6 py-4 border border-emerald-200 text-center shadow">
          ¡Tu expediente está completo!<br />¡Bienvenido(a) a IECS-IEDIS!
        </div>
      )}

      {/* Contact/Help */}
      <footer className="pt-10 w-full flex flex-col items-center">
        <div className="text-xs text-slate-500 dark:text-slate-400 pb-1 text-center">
          ¿Tienes problemas para avanzar? <a href="mailto:desarrollo.tecnologico@casitaiedis.edu.mx" className="underline text-purple-700 dark:text-fuchsia-300">Solicita ayuda</a>
        </div>
      </footer>
    </div>
  );
}
