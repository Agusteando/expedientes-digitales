
"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CloudArrowDownIcon,
  DocumentCheckIcon,
  ClockIcon
} from "@heroicons/react/24/outline";

const ICONS = {
  accepted: CheckCircleIcon,
  fulfilled: CheckCircleIcon,
  signed: CheckCircleIcon,
  completed: CheckCircleIcon,
  pending: ClockIcon,
  rejected: XCircleIcon,
  error: ExclamationTriangleIcon,
};

function checklistIcon(status) {
  switch (status) {
    case true:
    case "accepted":
    case "fulfilled":
    case "signed":
    case "completed":
      return <CheckCircleIcon className="w-5 h-5 text-emerald-500" />;
    case "pending":
      return <ClockIcon className="w-5 h-5 text-slate-400" />;
    case "rejected":
      return <XCircleIcon className="w-5 h-5 text-red-500" />;
    default:
      return <ClockIcon className="w-5 h-5 text-slate-300" />;
  }
}

function checklistLabel(type) {
  // Optionally map doc type keys to human readable labels
  const map = {
    identificacion_oficial: "Identificación oficial",
    foto_digital: "Foto digital",
    curp: "CURP",
    rfc: "RFC",
    nss: "NSS",
    acta_nacimiento: "Acta nacimiento",
    comprobante_domicilio: "Comprobante domicilio",
    certificado_medico: "Certificado médico",
    titulo_profesional: "Título/Certificados",
    carta_recomendacion: "Cartas recomendación",
    curriculum_vitae: "Currículum",
    carta_no_penales: "Carta no penales",
    reglamento: "Reglamento",
    contrato: "Contrato",
  };
  return map[type] || type.replace(/_/g, " ");
}

/**
 * UserDocsDrawer: shows all uploaded docs, checklist, signature status, downloads, always mobile-friendly
 */
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
        <div className="px-5 py-2">
          {loading && <div className="text-center text-cyan-600 py-7 text-sm font-bold">Cargando documentos...</div>}
          {docs && (
            <>
              <div className="mb-2 font-bold text-black mt-1 text-base">Checklist del Expediente</div>
              {/* Modern SaaS style grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {docs.checklist.map((c, idx) => (
                  <div
                    key={c.id || `${c.type}-${idx}`}
                    className={`flex items-center p-3 rounded-xl border shadow-sm gap-3 transition
                      ${
                        c.fulfilled
                          ? "border-emerald-100 bg-emerald-50/50"
                          : "border-yellow-100 bg-yellow-50/40"
                      }`}
                  >
                    <div>
                      {checklistIcon(c.fulfilled)}
                    </div>
                    <div className="flex flex-col text-xs xs:text-sm">
                      <span className={"font-bold " + (c.fulfilled ? "text-emerald-800" : "text-yellow-800")}>
                        {checklistLabel(c.type)}
                      </span>
                      <span className="text-slate-400">
                        {c.fulfilled ? "Entregado" : "Falta entregar"}
                      </span>
                    </div>
                  </div>
                ))}
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
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
