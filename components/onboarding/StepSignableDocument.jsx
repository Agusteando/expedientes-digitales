
"use client";
import { BookOpenIcon, PencilSquareIcon, CheckCircleIcon, ArrowDownTrayIcon } from "@heroicons/react/24/solid";

const TEXTS = {
  contrato: {
    Icon: PencilSquareIcon,
    label: "¡Ya casi terminas! Para concluir tu proceso, acude con tu administradora de Plantel para la firma presencial y entrega de tus documentos. Después de este paso, tu expediente se marcará como finalizado en el sistema.",
    visualHint: "Recuerda traer tu identificación y tu documentación requerida."
  },
  reglamento: {
    Icon: BookOpenIcon,
    label: "¡Bienvenido! El siguiente paso se realiza de manera presencial. Visita tu Plantel para la revisión y firma del reglamento institucional con tu administradora.",
    visualHint: "Te apoyaremos personalmente en tu incorporación."
  }
};

export default function StepSignableDocument({
  type,                // "contrato" or "reglamento"
  status,              // {checklist, document, signature}
  signature,           // unused, always null in this mode
  canSign,             // ignored
  handleSign,          // ignored
  signatureStatus,     // unused
  signatureLoading,    // unused
  onWidgetSuccess,     // unused
  user,
}) {
  // Fulfilled if admin uploaded signed doc, status.checklist.fulfilled or status.document.status==="accepted/signed"
  const fulfilled = !!(status?.checklist?.fulfilled || (status?.document && ["accepted", "fulfilled", "signed"].includes((status.document.status || "").toLowerCase())));
  const hasDoc = !!status.document;
  const DocIcon = TEXTS[type]?.Icon || CheckCircleIcon;
  return (
    <div className="flex flex-col gap-4 items-center justify-center w-full">
      <div className="flex flex-col items-center text-center mt-2">
        <DocIcon className="w-14 h-14 text-cyan-700 mb-2" />
        <div className="text-base xs:text-lg md:text-xl font-extrabold text-cyan-900 mb-1">
          {type === "contrato"
            ? "Firma presencial de contrato"
            : "Firma presencial del reglamento"}
        </div>
        <div className="text-slate-700 font-semibold mb-2 px-2">
          {TEXTS[type]?.label}
        </div>
        <div className="text-xs text-slate-500 mb-1">{TEXTS[type]?.visualHint}</div>
      </div>
      {fulfilled && hasDoc && (
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="flex flex-row gap-2 items-center text-emerald-700 font-bold">
            <CheckCircleIcon className="w-5 h-5" />
            Documento firmado y entregado presencialmente
          </div>
          <a
            href={status.document.filePath}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 border border-cyan-200 px-4 py-2 rounded-lg text-cyan-800 font-semibold bg-cyan-50 shadow-sm hover:bg-cyan-100 transition text-xs mt-1 mb-1"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />Ver documento entregado
          </a>
        </div>
      )}
      {!fulfilled && (
        <div className="w-full text-center mt-2 text-yellow-700 font-bold px-3 text-sm flex flex-col items-center">
          <span>Este paso debe ser concluido presencialmente en tu Plantel.</span>
        </div>
      )}
      <div className={`inline-flex items-center gap-2 font-bold text-xs md:text-sm px-3 py-1 rounded-full ${
        fulfilled
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-yellow-50 text-yellow-800 border border-yellow-100"
      }`}>
        <CheckCircleIcon className="w-5 h-5 mr-0.5" />
        {fulfilled ? "Completado por tu administradora" : "Pendiente de entrega en Plantel"}
      </div>
    </div>
  );
}
