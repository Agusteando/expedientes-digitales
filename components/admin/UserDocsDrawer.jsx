
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  CheckCircleIcon,
  CloudArrowDownIcon,
  DocumentCheckIcon,
  ClockIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  BookOpenIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/solid";
import { stepsExpediente } from "../stepMetaExpediente";

// Helpers
function formatDateDisplay(date) {
  if (!date) return "";
  try {
    return new Date(date).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return String(date);
  }
}

const ADMIN_UPLOAD_TYPES = {
  reglamento: {
    label: "Documento de Reglamento firmado presencialmente",
    icon: BookOpenIcon,
    color: "fuchsia",
    accent: "bg-fuchsia-50 border-fuchsia-300",
    chip: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200"
  },
  contrato: {
    label: "Contrato laboral firmado presencialmente",
    icon: PencilSquareIcon,
    color: "purple",
    accent: "bg-purple-50 border-purple-300",
    chip: "bg-purple-100 text-purple-700 border-purple-200"
  },
};

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
    reglamento: "Reglamento (firmado)",
    contrato: "Contrato (firmado)",
  };
  return map[type] || type.replace(/_/g, " ");
}
function checklistIcon(status) {
  if (
    status === true ||
    status === "accepted" ||
    status === "fulfilled" ||
    status === "signed" ||
    status === "completed"
  )
    return <CheckCircleIcon className="w-5 h-5 text-emerald-500" />;
  if (status === "pending") return <ClockIcon className="w-5 h-5 text-slate-400" />;
  return <ClockIcon className="w-5 h-5 text-slate-200" />;
}

// Dropzone
function UploadDropzone({ onFile, accept = "application/pdf,image/*", disabled = false }) {
  const [drag, setDrag] = useState(false);
  return (
    <label
      className={`flex flex-col items-center justify-center w-full min-h-[68px]
        border-2 border-dashed rounded-xl cursor-pointer px-1 py-5 bg-white transition
        ${disabled ? "opacity-70 cursor-not-allowed" : drag ? "bg-cyan-100 border-cyan-500" : "border-cyan-300 bg-cyan-50 hover:bg-cyan-100"}
      `}
      onDragEnter={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={e => { e.preventDefault(); setDrag(false); }}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDrop={e => {
        e.preventDefault(); setDrag(false);
        if (!disabled && e.dataTransfer?.files?.[0]) onFile(e.dataTransfer.files[0]);
      }}
    >
      <ArrowUpTrayIcon className="w-6 h-6 text-cyan-400 mb-1" />
      <span className="font-medium text-cyan-800 text-xs">
        Arrastra aquí o haz clic para seleccionar archivo PDF o imagen
      </span>
      <input
        type="file"
        accept={accept}
        hidden
        disabled={disabled}
        onChange={e => {
          if (!disabled && e.target.files?.[0]) onFile(e.target.files[0]);
        }}
      />
    </label>
  );
}

export default function UserDocsDrawer({ open, user, onClose }) {
  const [docs, setDocs] = useState(null);
  const [loading, setLoading] = useState(false);

  const [pending, setPending] = useState({}); // pending.reglamento or contrato File | undefined
  const [uploading, setUploading] = useState({});
  const [uploadSuccess, setUploadSuccess] = useState({});
  const [uploadError, setUploadError] = useState({});

  useEffect(() => {
    async function loadDocs() {
      if (!open || !user) return;
      setLoading(true); setDocs(null);
      const r = await fetch(`/api/admin/user/${user.id}/docs`);
      const d = await r.json();
      setDocs(d); setLoading(false); setPending({});
    }
    loadDocs();
  }, [open, user]);

  async function handleUpload(type) {
    const file = pending[type];
    if (!file) return;
    setUploading(u => ({ ...u, [type]: true }));
    setUploadSuccess(s => ({ ...s, [type]: "" }));
    setUploadError(e => ({ ...e, [type]: "" }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/admin/document/${user.id}/${type}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(e => ({ ...e, [type]: data?.error || "Error al subir archivo" }));
      } else {
        setUploadSuccess(s => ({ ...s, [type]: "¡Subido correctamente!" }));
        setTimeout(() => setUploadSuccess(s => ({ ...s, [type]: "" })), 1200);
        setPending(f => ({ ...f, [type]: undefined }));
        setLoading(true);
        const fresh = await fetch(`/api/admin/user/${user.id}/docs`).then(r => r.json());
        setDocs(fresh); setLoading(false);
      }
    } catch (err) {
      setUploadError(e => ({ ...e, [type]: String(err.message || err) }));
    }
    setUploading(u => ({ ...u, [type]: false }));
  }

  if (!open || !user) return null;

  const userDocs = docs?.documents || [];
  const docsByType = Object.fromEntries(userDocs.map((doc) => [doc.type, doc]));
  const userChecklist = docs?.checklist || [];
  const checklistByType = Object.fromEntries(userChecklist.map((c) => [c.type, c]));

  // Progress bar
  const stepsAll = stepsExpediente.filter(s => !s.isPlantelSelection);
  const checklistRequired = stepsAll.filter(s => !s.signable && !s.adminUploadOnly).map(s => s.key);
  const adminUploadKeys = Object.keys(ADMIN_UPLOAD_TYPES);
  const fulfilledCount =
    checklistRequired.reduce((s, k) => (checklistByType[k]?.fulfilled ? s+1 : s), 0) +
    adminUploadKeys.reduce((s,k)=> docsByType[k]?s+1:s,0);
  const totalRequired = checklistRequired.length + adminUploadKeys.length;
  const progressPct = totalRequired ? Math.round(fulfilledCount/totalRequired*100) : 0;

  // --- UI ---
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex justify-end">
      <div className="w-full max-w-lg h-full bg-white shadow-2xl overflow-y-scroll border-l border-cyan-200 px-0 pt-0 relative">
        <button
          className="absolute right-3 top-3 text-cyan-800 font-bold rounded-full bg-cyan-50 p-2"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
        {/* Header */}
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

        {/* Upload/replace cards! */}
        <div className="px-5 pt-6 pb-2 flex flex-col gap-4">
          {Object.entries(ADMIN_UPLOAD_TYPES).map(([key, meta]) => {
            const doc = docsByType[key];
            return (
              <div
                key={key}
                className={`border-2 ${meta.accent} rounded-xl p-4 w-full flex flex-col gap-2`}
              >
                <div className="flex items-center gap-2 font-bold text-base mb-1">
                  <meta.icon className="w-7 h-7" /> {meta.label}
                </div>
                {/* --- file info (if exists) --- */}
                {doc && (
                  <div className="flex flex-col gap-0.5 mb-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-xs">{doc.filePath.split("/").pop()}</span>
                      <a href={doc.filePath} target="_blank" rel="noopener"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-700 border border-cyan-200"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" /> Descargar
                      </a>
                    </div>
                    <div className="text-xs text-slate-500">
                      Subido el {formatDateDisplay(doc.uploadedAt)}
                    </div>
                  </div>
                )}
                {/* --- dropzone and button always visible --- */}
                <UploadDropzone
                  onFile={file => { setPending(f=>({...f, [key]:file})); setUploadError(e=>({...e,[key]:""})); setUploadSuccess(s=>({...s,[key]:""})); }}
                  accept="application/pdf,image/*"
                  disabled={uploading[key]}
                />
                {pending[key] && (
                  <div className="flex flex-row items-center gap-2 mt-2">
                    <span className="text-xs text-slate-700">Archivo listo: <b>{pending[key].name}</b></span>
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-1.5 bg-cyan-700 hover:bg-cyan-900 text-white rounded-full font-bold gap-2 text-xs transition disabled:opacity-70"
                      onClick={() => handleUpload(key)}
                      disabled={uploading[key]}
                    >
                      <ArrowUpTrayIcon className="w-5 h-5" />
                      {doc ? "Volver a subir" : "Subir ahora"}
                    </button>
                  </div>
                )}
                {uploadError[key] && (
                  <div className="text-xs text-red-600 font-semibold mt-1">{uploadError[key]}</div>
                )}
                {uploadSuccess[key] && (
                  <div className="text-xs text-green-700 font-bold mt-1">{uploadSuccess[key]}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar and checklist */}
        <div className="px-5 pt-5 pb-5">
          {/* Progress summary */}
          <div className="mb-2 font-bold text-black mt-1 text-base">Resumen del expediente</div>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs font-bold text-cyan-800">
              Progreso: {fulfilledCount} / {totalRequired}
            </span>
            <div className="flex-1">
              <div className="w-full h-2 rounded-full bg-cyan-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    progressPct > 90
                      ? "bg-emerald-400"
                      : progressPct > 50
                      ? "bg-cyan-400"
                      : "bg-yellow-400"
                  }`}
                  style={{ width: `${progressPct}%` }}
                ></div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">{progressPct}%</span>
          </div>

          {/* Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {stepsAll.map(st => {
              if (adminUploadKeys.includes(st.key) && !docsByType[st.key]) return null;
              if (adminUploadKeys.includes(st.key) && docsByType[st.key]) {
                // Prominent card for uploaded reg/contract
                const meta = ADMIN_UPLOAD_TYPES[st.key];
                const doc = docsByType[st.key];
                return (
                  <div key={st.key}
                    className={`flex flex-col p-4 rounded-2xl border shadow-lg gap-2 border-2 ${meta.accent}`}
                  >
                    <div className="flex flex-row gap-2 items-center mb-1">
                      <meta.icon className="w-6 h-6" />
                      <span className="font-bold">
                        {checklistLabel(st.key)}
                      </span>
                    </div>
                    <a
                      href={doc.filePath}
                      target="_blank"
                      rel="noopener"
                      className="flex items-center gap-2 border border-cyan-200 px-3 py-1 rounded-lg text-cyan-800 font-semibold bg-cyan-100 shadow-sm hover:bg-cyan-200 transition text-xs w-fit"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      Descargar documento firmado
                    </a>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold mt-1 px-2 py-0.5 rounded-full border ${meta.chip}`}>
                      <CheckCircleIcon className="w-4 h-4" /> Firmado y entregado
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      Subido el {formatDateDisplay(doc.uploadedAt)}
                    </span>
                  </div>
                );
              }
              // Other checklist items
              const item = checklistByType[st.key];
              const fulfilled = !!item?.fulfilled;
              const Icon = checklistIcon(fulfilled);
              return (
                <div
                  key={st.key}
                  className={`flex flex-col p-4 rounded-2xl border shadow-sm gap-2 ${
                    fulfilled ? "border-emerald-100 bg-white" : "border-yellow-100 bg-yellow-50/30"
                  }`}
                >
                  <div className="flex flex-row gap-2 items-center mb-1">
                    {Icon}
                    <span className="font-bold text-cyan-900">{checklistLabel(st.key)}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {fulfilled ? "Entregado / válido" : "No entregado"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Uploaded files list */}
          <div className="mb-2 font-bold text-black mt-3 text-base flex items-center gap-2">
            <CloudArrowDownIcon className="w-6 h-6 text-cyan-600 inline" />
            Archivos subidos
          </div>
          <ul className="mb-3 grid grid-cols-1 gap-2">
            {userDocs.map(doc => (
              <li
                key={doc.id}
                className="flex flex-row items-center gap-2 text-xs border border-slate-100 bg-slate-50 rounded px-2 py-1"
              >
                <DocumentCheckIcon className="w-5 h-5 text-cyan-500" />
                <a
                  href={doc.filePath}
                  target="_blank"
                  className="text-cyan-700 underline font-bold"
                >
                  {checklistLabel(doc.type)} v{doc.version}
                </a>
                <span className="text-xs text-slate-400 ml-2">
                  {formatDateDisplay(doc.uploadedAt)}
                </span>
              </li>
            ))}
            {userDocs.length === 0 && (
              <li className="text-xs text-slate-400 px-2 py-1">
                — Sin archivos aún —
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
