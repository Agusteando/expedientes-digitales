
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { ArrowLeftCircleIcon, ArrowRightCircleIcon } from "@heroicons/react/24/solid";
import { stepsExpediente } from "../stepMetaExpediente";
import { wizardCard, secondaryButton, mainButton } from "../../lib/ui-classes";
import OnboardingStepper from "./OnboardingStepper";
import StepPlantelSelection from "./StepPlantelSelection";
import StepDigitalPhoto from "./StepDigitalPhoto";
import StepDocumentUpload from "./StepDocumentUpload";
import StepSignableDocument from "./StepSignableDocument";
import StepSummary from "./StepSummary";
import WelcomeApproved from "./WelcomeApproved";
import { getStatusMeta } from "@/lib/expedienteStatus";

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
};

export default function EmployeeOnboardingWizard({ user: userProp, mode = "expediente" }) {
  const [user, setUser] = useState(userProp);
  const [currentStep, setCurrentStep] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [stepStatus, setStepStatus] = useState({});
  const [stepHistory, setStepHistory] = useState({});
  const [planteles, setPlanteles] = useState([]);
  const steps = stepsExpediente;
  const totalSteps = steps.length;
  const requiredUploadSteps = useMemo(
    () => steps.filter(s => !s.adminUploadOnly && !s.signable && !s.isPlantelSelection && !s.isAvatar).map(s => s.key),
    [steps]
  );
  const requiredAdminSteps = steps.filter(s => s.adminUploadOnly).map(s => s.key);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [uploadProgress, setUploadProgress] = useState(null);
  const [signatureStatus, setSignatureStatus] = useState(null);
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [savingPlantel, setSavingPlantel] = useState(false);
  const successTimeout = useRef();

  useEffect(() => {
    async function fetchPlanteles() {
      try {
        const res = await fetch("/api/planteles/list");
        const p = res.ok ? await res.json() : [];
        setPlanteles(Array.isArray(p) ? p : []);
      } catch {}
    }
    fetchPlanteles();
  }, []);

  async function fetchExpedienteSteps() {
    setLoadingData(true);
    setFetchError("");
    try {
      const res = await fetch(`/api/expediente/steps/${user.id}`);
      if (!res.ok) throw new Error("No se pudo leer los datos del expediente.");
      const { stepHistory: history, stepStatus: status } = await res.json();
      setStepHistory(history && typeof history === "object" ? history : {});
      setStepStatus(status && typeof status === "object" ? status : {});
    } catch (err) {
      setFetchError(err.message || "Error de conexión.");
      setStepHistory({});
      setStepStatus({});
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    fetchExpedienteSteps();
  }, [user.id]);

  async function savePlantelCurpRfcEmail({
    plantelId, curp, rfc, email, onSuccess, onError
  }) {
    setSavingPlantel(true);
    setFetchError("");
    try {
      // PATCH plantelId
      let userPatchOk = true;
      if (user.plantelId !== parseInt(plantelId)) {
        const pRes = await fetch("/api/me/plantel", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plantelId }),
        });
        userPatchOk = pRes.ok;
        if (!userPatchOk) {
          const pdata = await pRes.json();
          setFetchError(pdata?.error || "No se pudo seleccionar plantel.");
          setSavingPlantel(false);
          if (onError) onError(pdata?.error);
          return;
        }
      }
      // PATCH rfc, curp if changed
      if (
        String((user.rfc || "")).trim().toUpperCase() !== (rfc || "").trim().toUpperCase() ||
        String((user.curp || "")).trim().toUpperCase() !== (curp || "").trim().toUpperCase()
      ) {
        const cRes = await fetch("/api/me/curp-rfc", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ curp, rfc }),
        });
        if (!cRes.ok) {
          const data = await cRes.json();
          setFetchError(data?.error || "No se pudo actualizar RFC/CURP.");
          setSavingPlantel(false);
          if (onError) onError(data?.error);
          return;
        }
      }
      // PATCH email if changed
      if ((user.email || "").trim() !== (email || "").trim()) {
        const eRes = await fetch("/api/me/email", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!eRes.ok) {
          const edata = await eRes.json();
          setFetchError(edata?.error || "No se pudo actualizar correo electrónico.");
          setSavingPlantel(false);
          if (onError) onError(edata?.error);
          return;
        }
      }
      // After all save cycles, update user object
      setUser(u => ({
        ...u,
        plantelId: parseInt(plantelId, 10),
        rfc: rfc.trim().toUpperCase(),
        curp: curp.trim().toUpperCase(),
        email: email.trim()
      }));
      setSavingPlantel(false);
      await fetchExpedienteSteps();
      if (onSuccess) onSuccess();
    } catch {
      setFetchError("No se pudo conectar.");
      setSavingPlantel(false);
      if (onError) onError("No se pudo conectar.");
    }
  }

  async function handlePhotoUpload(file) {
    setUploading(true); setUploadError(""); setUploadSuccess(""); setUploadProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/documents/${user.id}/foto_digital/upload`, true);
    xhr.onload = function () {
      setUploading(false); setUploadProgress(null);
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status !== 200) {
          setUploadError(data.error || "Error al subir la imagen.");
        } else {
          setUploadSuccess("¡Fotografía cargada! Ya puedes avanzar.");
          if (data.avatarUrl) setUser(u => ({ ...u, picture: data.avatarUrl }));
          clearTimeout(successTimeout.current);
          successTimeout.current = setTimeout(() => setUploadSuccess(""), 4000);
          fetchExpedienteSteps();
        }
      } catch {
        setUploadError("Error al subir.");
      }
    };
    xhr.onerror = function () {
      setUploading(false); setUploadProgress(null); setUploadError("No se pudo subir.");
    };
    xhr.upload.onprogress = function (e) {
      if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
    };
    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  }

  async function handleFileUpload(file, key) {
    setUploading(true); setUploadError(""); setUploadSuccess(""); setUploadProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/documents/${user.id}/${key}/upload`, true);
    xhr.onload = function () {
      setUploading(false); setUploadProgress(null);
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status !== 200) {
          setUploadError(data.error || "Error al subir el archivo.");
        } else {
          setUploadSuccess("¡Archivo subido! Puedes avanzar al siguiente paso.");
          clearTimeout(successTimeout.current);
          successTimeout.current = setTimeout(() => setUploadSuccess(""), 4000);
          fetchExpedienteSteps();
        }
      } catch {
        setUploadError("Error al subir.");
      }
    };
    xhr.onerror = function () {
      setUploading(false); setUploadProgress(null); setUploadError("No se pudo subir.");
    };
    xhr.upload.onprogress = function (e) {
      if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
    };
    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  }

  async function handleSign(key) {
    setSignatureLoading(true); setSignatureStatus("");
    try {
      const res = await fetch(`/api/documents/${user.id}/${key}/sign`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSignatureStatus(data.error || "No se pudo iniciar la firma.");
      } else {
        setSignatureStatus("Abre el widget y firma tu documento digital.");
        fetchExpedienteSteps();
      }
    } catch {
      setSignatureStatus("Error en la conexión para firmar.");
    }
    setSignatureLoading(false);
  }

  let numUploadedDocs = 0;
  for (const key of requiredUploadSteps) {
    const status = (stepStatus && stepStatus[key]) ? stepStatus[key] : {};
    if (status && status.checklist && status.checklist.fulfilled) numUploadedDocs++;
  }
  const adminDocsComplete = requiredAdminSteps.every(
    key => {
      const status = (stepStatus && stepStatus[key]) ? stepStatus[key] : {};
      return !!(status.checklist?.fulfilled || status.document);
    }
  );
  const digitalPhotoDone = !!(stepStatus && stepStatus.foto_digital && stepStatus.foto_digital.checklist && stepStatus.foto_digital.checklist.fulfilled);
  const plantelFulfilled = !!user.plantelId;

  const step = steps[currentStep];
  const status = stepStatus && typeof stepStatus === "object" && stepStatus[step.key] ? stepStatus[step.key] : {};
  const historyDocs = (stepHistory && typeof stepHistory === "object" && Array.isArray(stepHistory?.[step.key])) ? stepHistory[step.key] : [];
  const latestDoc = historyDocs.length ? historyDocs[0] : null;
  const { checklist, document, signature } = status;

  const canGoNextPlantel = planteles.length > 0 && !!user.plantelId && user.rfc && user.curp && user.email;
  const canGoNextPhoto = step.key !== "foto_digital" || digitalPhotoDone;
  const isCurrentStepFulfilled = step.adminUploadOnly
    ? ((status && status.checklist && status.checklist.fulfilled) || (status && status.document))
    : step.signable
      ? (signature && (signature.status === "signed" || signature.status === "completed"))
      : (checklist && checklist.fulfilled);

  const canGoNext =
    step.key === "plantel"
      ? canGoNextPlantel
      : step.key === "foto_digital"
        ? canGoNextPhoto
        : (currentStep < totalSteps - 1 && isCurrentStepFulfilled && !uploading && !signatureLoading);

  const canGoPrev = currentStep > 0 && !uploading && !signatureLoading;

  const nextButtonBase = mainButton + " min-w-[128px] flex items-center gap-2 justify-center transition relative overflow-visible";
  const nextButtonDisabled = "opacity-40 grayscale pointer-events-none";
  const prevButtonDisabled = "opacity-40 grayscale pointer-events-none";
  const stickyTop = "top-16";

  const wizardComplete =
    numUploadedDocs === requiredUploadSteps.length &&
    requiredAdminSteps.every(
      key => {
        const status = stepStatus && stepStatus[key] ? stepStatus[key] : {};
        return !!(status.checklist?.fulfilled || status.document);
      }
    ) &&
    digitalPhotoDone &&
    plantelFulfilled;

  if (user && user.role === "employee") {
    return <WelcomeApproved user={user} />;
  }

  if (loadingData)
    return (
      <div className="w-full flex flex-col items-center justify-center py-12">
        <span className="text-slate-500 text-lg font-bold">Cargando expediente...</span>
      </div>
    );

  if (fetchError)
    return (
      <div className="w-full flex flex-col items-center justify-center py-8">
        <span className="text-red-500 font-bold">{fetchError}</span>
      </div>
    );

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[620px] relative">
      <div className={`w-full z-30 sticky ${stickyTop} px-0 xs:px-1 sm:px-0 bg-white/85 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100/70 dark:border-slate-900/70`}>
        <OnboardingStepper
          steps={steps}
          activeStep={currentStep}
          onStepChange={(idx) => setCurrentStep(idx)}
          stepStatus={stepStatus || {}}
          allowFreeJump={true}
          className="py-1"
        />
      </div>
      <section className={wizardCard + " relative mt-0"}>
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
        {wizardComplete && (
          <StepSummary user={user} />
        )}
        {!wizardComplete && (
          <>
            {step.key === "plantel" ? (
              <StepPlantelSelection
                plantelId={user.plantelId}
                rfc={user.rfc}
                curp={user.curp}
                email={user.email}
                planteles={planteles}
                loading={loadingData}
                error={fetchError}
                onSave={savePlantelCurpRfcEmail}
                saving={savingPlantel}
              />
            ) : step.key === "foto_digital" ? (
              <StepDigitalPhoto
                picture={user.picture}
                onUpload={handlePhotoUpload}
                uploading={uploading}
                uploadError={uploadError}
                uploadSuccess={uploadSuccess}
              />
            ) : step.adminUploadOnly ? (
              <StepSignableDocument
                type={step.key}
                status={status || {}}
                user={user}
              />
            ) : !step.signable ? (
              <StepDocumentUpload
                latestDoc={latestDoc}
                documentHistory={historyDocs}
                uploading={uploading}
                uploadError={uploadError}
                uploadSuccess={uploadSuccess}
                uploadProgress={uploadProgress}
                onUpload={(file) => handleFileUpload(file, step.key)}
                accept={step.accept || "application/pdf"}
              />
            ) : (
              <StepSignableDocument
                type={step.key}
                status={status || {}}
                signature={signature}
                canSign={numUploadedDocs === requiredUploadSteps.length && digitalPhotoDone && plantelFulfilled}
                handleSign={() => handleSign(step.key)}
                signatureStatus={signatureStatus}
                signatureLoading={signatureLoading}
                onWidgetSuccess={fetchExpedienteSteps}
                user={user}
              />
            )}
          </>
        )}
        <div className="flex w-full justify-between items-center pt-10 sm:pt-12 pb-[68px] md:pb-6 gap-3 sticky bottom-0 bg-transparent z-10">
          <button
            className={secondaryButton + " min-w-[120px]" + (!canGoPrev ? " " + prevButtonDisabled : "")}
            style={{ fontWeight: 900, fontSize: "1.08em" }}
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={!canGoPrev}
            tabIndex={0}
          >
            <ArrowLeftCircleIcon className="w-6 h-6" />
            Atrás
          </button>
          <button
            className={
              nextButtonBase +
              (!canGoNext ? " " + nextButtonDisabled : "")
            }
            style={{
              fontWeight: 900,
              fontSize: "1.11em",
            }}
            disabled={!canGoNext}
            onClick={() => {
              if (canGoNext) setCurrentStep(currentStep + 1);
            }}
            tabIndex={0}
            aria-disabled={!canGoNext}
          >
            <span>Siguiente</span>
            <ArrowRightCircleIcon className="w-6 h-6" />
          </button>
        </div>
      </section>
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
