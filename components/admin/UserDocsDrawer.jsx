
"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CloudArrowDownIcon,
  DocumentCheckIcon,
  ClockIcon,
  PencilSquareIcon,
  BookOpenIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";
import { stepsExpediente } from "../stepMetaExpediente";

function checklistIcon(status) {
  if (status === true || status === "accepted" || status === "fulfilled" || status === "signed" || status === "completed")
    return <CheckCircleIcon className="w-5 h-5 text-emerald-500" />;
  if (status === "pending") return <ClockIcon className="w-5 h-5 text-slate-400" />;
  if (status === "rejected") return <XCircleIcon className="w-5 h-5 text-red-500" />;
  return <ClockIcon className="w-5 h-5 text-slate-200" />;
}
function checklistLabel(type) {
  const map = {
    identificacion_oficial: "Identificación oficial",
    foto_digital: "Foto digital",
    curp: "CURP",
    rfc: "RFC",
    nss: "NSS",
    acta_nacimiento: "Acta nacimiento",
    comprobante_domicilio: "Comprobante domicilio",
    certificado_medico: "Certificado médico",
    titulo_profesional: "Título/Certificaciones",
    carta_recomendacion: "Cartas recomendación",
    curriculum_vitae: "Currículum",
    carta_no_penales: "Carta no penales",
    reglamento: "Reglamento (firma digital)",
    contrato: "Contrato (firma digital)",
  };
  return map[type] || type.replace(/_/g, " ");
}
function checklistIconForStep(key) {
  if (key === "reglamento") return <BookOpenIcon className="w-6 h-6 text-fuchsia-700" />;
  if (key === "contrato") return <PencilSquareIcon className="w-6 h-6 text-purple-900" />;
  if (key === "foto_digital") return <BoltIcon className="w-6 h-6 text-cyan-700" />;
  return <DocumentCheckIcon className="w-5 h-5 text-cyan-600" />;
}
function signatureStatusBadge(status) {
  if (status === "completed" || status === "signed") {
    return (
      <span className="inline-flex items-center text-xs font-bold rounded bg-emerald-50 border border-emerald-100 px-2 py-1 text-emerald-700">
        <CheckCircleIcon className="w-4 h-4 mr-1" /> Firmado
      </span>
    );
  }
  if (status === "rejected" || status === "error") {
    return (
      <span className="inline-flex items-center rounded text-xs font-bold bg-red-50 border border-red-200 px-2 py-1 text-red-700">
        <XCircleIcon className="w-4 h-4 mr-1" /> Rechazado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded text-xs font-bold bg-yellow-50 border border-yellow-200 px-2 py-1 text-yellow-800">
      <ClockIcon className="w-4 h-4 mr-1" /> Falta firmar
    </span>
  );
}

export default function UserDocsDrawer({ open, user, onClose }) {
  const [docs, setDocs] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      setLoading(true);
      setDocs(null);
      fetch(`/api/admin/user/${user.id}/docs`).then(async r => {
        const d = await r.json();
        setDocs(d);
        setLoading(false);
      });
    }
  }, [open, user]);

  if (!open || !user) return null;

  // Merge full onboarding checklist: always ensure all canonical steps are present
  const canonicalSteps = stepsExpediente.filter(s => !s.isPlantelSelection); // skip plantel
  let checklistRequired = canonicalSteps
    .filter(s => !s.signable)
    .map(s => s.key);

  let signaturesRequired = canonicalSteps.filter(s => s.signable).map(s => s.key);

  // Merge user checklist into canonical step order for progress
  let userChecklist = (docs?.checklist || []);
  let checklistByType = Object.fromEntries(
    userChecklist.map(c => [c.type, c])
  );
  // For signatures, find signature objects by type:
  let userSignatures = (docs?.signatures || []);
  let signaturesByType = Object.fromEntries(
    userSignatures.map(s => [s.type, s])
  );

  const fulfilledCount =
    checklistRequired.reduce((sum, key) =>
      (checklistByType[key]?.fulfilled ? sum + 1 : sum), 0
    ) +
    signaturesRequired.reduce((sum, key) =>
      (["signed", "completed"].includes(signaturesByType[key]?.status) ? sum + 1 : sum), 0
    );

  const totalRequired = checklistRequired.length + signaturesRequired.length;
  const progressPct = totalRequired === 0 ? 0 : Math.round((fulfilledCount / totalRequired) * 100);

  // Prepare signature cards (reglamento & contrato) first
  function renderSignatureCard(key, label, idx) {
    const sig = signaturesByType[key];
    const status = sig ? sig.status : "pending";
    let Icon = checklistIconForStep(key);
    return (
      <div
        key={"signature-"+key}
        className={`flex flex-col p-4 rounded-2xl border shadow-lg gap-2
          ${
            status === "completed" || status === "signed"
              ? "border-emerald-100 bg-emerald-50/40"
              : "border-fuchsia-100 bg-fuchsia-50/30"
          }`}
      >
        <div className="flex flex-row gap-2 items-center mb-1">
          {Icon}
          <span className="font-bold text-fuchsia-800">{label}</span>
        </div>
        <div>
          {signatureStatusBadge(status)}
        </div>
        {sig?.mifielId && (
          <a href={`https://app.mifiel.com/documents/${sig.mifielId}`} target="_blank" className="text-xs text-cyan-700 underline mt-1 font-bold">
            Ver detalle MiFiel
          </a>
        )}
      </div>
    );
  }

  function renderChecklistCard(key, label, idx) {
    const item = checklistByType[key];
    const fulfilled = !!item?.fulfilled;
    let Icon = checklistIcon(fulfilled);
    return (
      <div
        key={"check-"+key}
        className={`flex flex-col p-4 rounded-2xl border shadow-sm gap-2
          ${fulfilled
            ? "border-emerald-100 bg-white"
            : "border-yellow-100 bg-yellow-50/30"
          }`}
      >
        <div className="flex flex-row gap-2 items-center mb-1">
          {Icon}
          <span className="font-bold text-cyan-900">{label}</span>
        </div>
        <div className="text-xs text-slate-500">
          {fulfilled ? "Entregado / válido" : "No entregado"}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex justify-end">
      <div className="w-full max-w-lg h-full bg-white shadow-2xl overflow-y-scroll border-l border-cyan-200 px-0 pt-0 relative">
        <button
          className="absolute right-3 top-3 text-cyan-800 font-bold rounded-full bg-cyan-50 p-2"
          onClick={onClose}
          aria-label="Cerrar"
        >✕</button>
        <div className="p-6 pb-2 flex items-center gap-3 border-b border-cyan-100">
          <Image
            src={user.picture || "/IMAGOTIPO-IECS-IEDIS.png"}
            width={48}
            height={48}
            alt=""
            className="rounded-full bg-white border border-cyan-100"
          />
          <div>
            <div className="font-bold text-cyan-900">{user.name}</div>
            <div className="text-xs text-slate-400">{user.email}</div>
            <div className="text-[10px]">{user.role === "employee" ? "Empleado" : "Candidato"}</div>
          </div>
        </div>
        <div className="px-5 py-4">
          {loading && <div className="text-center text-cyan-600 py-7 text-sm font-bold">Cargando documentos...</div>}
          {docs && (
            <>
              <div className="mb-2 font-bold text-black mt-1 text-base">Resumen del expediente</div>
              {/* Progress bar */}
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xs font-bold text-cyan-800">
                  Progreso: {fulfilledCount} / {totalRequired}
                </span>
                <div className="flex-1">
                  <div className="w-full h-2 rounded-full bg-cyan-100">
                    <div
                      className={`h-full rounded-full transition-all ${progressPct > 90
                        ? 'bg-emerald-400'
                        : progressPct > 50
                          ? 'bg-cyan-400'
                          : 'bg-yellow-400'}`
                      }
                      style={{width: `${progressPct}%`}}
                    />
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500">{progressPct}%</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {/* Signature cards always first, with unique look */}
                {renderSignatureCard("reglamento", "Firma digital: Reglamento", 0)}
                {renderSignatureCard("contrato", "Firma digital: Contrato", 1)}
                {/* Then rest as document checklist */}
                {checklistRequired.map((key, idx) =>
                  renderChecklistCard(key, checklistLabel(key), idx)
                )}
              </div>

              <div className="mb-2 font-bold text-black mt-3 text-base flex items-center gap-2">
                <CloudArrowDownIcon className="w-6 h-6 text-cyan-600 inline" /> Archivos subidos
              </div>
              <ul className="mb-3 grid grid-cols-1 gap-2">
                {docs.documents.map(doc =>
                  <li key={doc.id} className="flex flex-row items-center gap-2 text-xs border border-slate-100 bg-slate-50 rounded px-2 py-1">
                    <DocumentCheckIcon className="w-5 h-5 text-cyan-500" />
                    <a href={doc.filePath} target="_blank" className="text-cyan-700 underline font-bold">
                      {checklistLabel(doc.type)} v{doc.version}
                    </a>
                    <span className="text-xs text-slate-400 ml-2">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </span>
                  </li>
                )}
                {docs.documents.length === 0 && (
                  <li className="text-xs text-slate-400 px-2 py-1">— Sin archivos aún —</li>
                )}
              </ul>
              <div className="mt-4">
                <div className="font-bold mb-1 flex items-center gap-2">
                  <CheckCircleIcon className="w-6 h-6 text-purple-400" />
                  Firmas digitales
                </div>
                <ul className="grid grid-cols-1 gap-2 mt-2">
                  {docs.signatures.map(sig =>
                    <li key={sig.id} className="mb-1 text-xs flex flex-row items-center gap-3 border rounded px-2 py-2 bg-purple-50 border-purple-100">
                      <span className="font-bold">{checklistLabel(sig.type)}</span>
                      <span className={
                        sig.status === "completed" || sig.status === "signed"
                          ? "text-emerald-800 font-bold"
                          : "text-yellow-800 font-semibold"
                      }>
                        {sig.status === "completed" || sig.status === "signed"
                          ? <CheckCircleIcon className="w-5 h-5 text-emerald-500 inline mr-1" />
                          : <ClockIcon className="w-5 h-5 text-yellow-500 inline mr-1" />
                        }
                        {sig.status}
                      </span>
                      {sig.mifielId && (
                        <a href={`https://app.mifiel.com/documents/${sig.mifielId}`} target="_blank" className="ml-2 underline text-cyan-700">MiFiel</a>
                      )}
                    </li>
                  )}
                  {docs.signatures.length === 0 && (
                    <li className="text-xs text-slate-400 px-2 py-1">— No hay firmas aún —</li>
                  )}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
