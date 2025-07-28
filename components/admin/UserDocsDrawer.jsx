
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  CheckCircleIcon,
  ShieldExclamationIcon,
  ClockIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/solid";
import { stepsExpediente } from "../stepMetaExpediente";

// 11 user-upload keys:
const DOC_KEYS = stepsExpediente.filter(s => !s.isPlantelSelection && !s.adminUploadOnly).map(s => s.key);

// Static meta for admin-doc and system fields
const CHECKLIST_META = {
  proyectivos: {
    label: "Proyectivos entregados (admin)",
    hint: "SÓLO admin puede subir",
    icon: ShieldExclamationIcon,
    color: "bg-purple-100 border-purple-300 text-purple-900",
    chip: "bg-white border-purple-400 text-purple-900",
    admin: true,
  },
  evaId: {
    label: "Evaluatest",
    icon: DocumentTextIcon,
    color: "bg-blue-50 border-blue-200 text-blue-900",
    chip: "bg-blue-100 border-blue-200 text-blue-900",
    field: true,
  },
  pathId: {
    label: "PATH",
    icon: DocumentTextIcon,
    color: "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-900",
    chip: "bg-fuchsia-100 border-fuchsia-200 text-fuchsia-900",
    field: true,
  }
};

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

function checklistLabel(type) {
  if (CHECKLIST_META[type]?.label) return CHECKLIST_META[type].label;
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
  };
  return map[type] || type.replace(/_/g, " ");
}

function checklistIcon(type, status) {
  if (type === "proyectivos") {
    return <ShieldExclamationIcon className="w-5 h-5 text-purple-600" />;
  }
  if (CHECKLIST_META[type]?.field) {
    return status ? <CheckCircleIcon className="w-5 h-5 text-emerald-500" /> : <ClockIcon className="w-5 h-5 text-yellow-500" />;
  }
  // default docs
  return status ? <CheckCircleIcon className="w-5 h-5 text-emerald-500" /> : <ClockIcon className="w-5 h-5 text-yellow-500" />;
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

  const [pending, setPending] = useState({});
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

  // Docs normalized for this user (get last version for each)
  const userDocsArr = docs?.documents || [];
  const docsByType = {};
  for (const doc of userDocsArr.sort((a, b) => (b.version || 1) - (a.version || 1))) {
    if (!docsByType[doc.type]) docsByType[doc.type] = doc;
  }
  const userChecklistArr = docs?.checklist || [];
  const checklistByType = Object.fromEntries(userChecklistArr.map((c) => [c.type, c]));

  // Always 14: 11 user+ proy + evaId + pathId
  const checklistData = [
    ...DOC_KEYS.map(key => ({
      key,
      type: "doc",
      fulfilled: checklistByType[key]?.fulfilled || false,
      doc: docsByType[key],
    })),
    {
      key: "proyectivos",
      type: "admin-doc",
      fulfilled: !!docsByType.proyectivos,
      doc: docsByType.proyectivos,
    },
    {
      key: "evaId",
      type: "field",
      fulfilled: !!user.evaId,
      value: user.evaId,
    },
    {
      key: "pathId",
      type: "field",
      fulfilled: !!user.pathId,
      value: user.pathId,
    },
  ];

  const done = checklistData.filter(i => i.fulfilled).length;
  const total = checklistData.length;
  const pct = total ? Math.round((done/total)*100) : 0;

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
        {/* -- Upload proyectivos block (always shown, must be admin) -- */}
        <div className="px-5 pt-6 pb-2 flex flex-col gap-4">
          <div className="border-2 bg-purple-50 border-purple-300 rounded-xl p-4 w-full flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold text-base mb-1 text-purple-900">
              <ShieldExclamationIcon className="w-7 h-7 text-purple-500" /> Proyectivos (admin)
            </div>
            {docsByType.proyectivos && (
              <div className="flex flex-col gap-0.5 mb-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold text-xs">{docsByType.proyectivos.filePath.split("/").pop()}</span>
                  <a href={docsByType.proyectivos.filePath} target="_blank" rel="noopener"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-700 border border-cyan-200"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" /> Descargar
                  </a>
                </div>
                <div className="text-xs text-slate-500">
                  Subido el {formatDateDisplay(docsByType.proyectivos.uploadedAt)}
                </div>
              </div>
            )}
            <div className="text-xs text-purple-700 font-semibold mb-1">Sólo administrador puede subir este archivo.</div>
            <UploadDropzone
              onFile={file => { setPending(f=>({...f, ["proyectivos"]:file})); setUploadError(e=>({...e,["proyectivos"]:""})); setUploadSuccess(s=>({...s,["proyectivos"]:""})); }}
              accept="application/pdf,image/*"
              disabled={uploading["proyectivos"]}
            />
            {pending["proyectivos"] && (
              <div className="flex flex-row items-center gap-2 mt-2">
                <span className="text-xs text-slate-700">Archivo listo: <b>{pending["proyectivos"].name}</b></span>
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-1.5 bg-purple-800 hover:bg-purple-900 text-white rounded-full font-bold gap-2 text-xs transition disabled:opacity-70"
                  onClick={() => handleUpload("proyectivos")}
                  disabled={uploading["proyectivos"]}
                >
                  <ArrowUpTrayIcon className="w-5 h-5" />
                  {docsByType.proyectivos ? "Volver a subir" : "Subir"}
                </button>
              </div>
            )}
            {uploadError["proyectivos"] && (
              <div className="text-xs text-red-600 font-semibold mt-1">{uploadError["proyectivos"]}</div>
            )}
            {uploadSuccess["proyectivos"] && (
              <div className="text-xs text-green-700 font-bold mt-1">{uploadSuccess["proyectivos"]}</div>
            )}
          </div>
        </div>
        {/* Checklist and progress */}
        <div className="px-5 pt-5 pb-5">
          <div className="mb-2 font-bold text-black mt-1 text-base">Resumen del expediente</div>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs font-bold text-cyan-800">
              Progreso: {done} / {total}
            </span>
            <div className="flex-1">
              <div className="w-full h-2 rounded-full bg-cyan-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    pct >= 100
                      ? "bg-emerald-400"
                      : pct > 50
                      ? "bg-cyan-400"
                      : "bg-yellow-400"
                  }`}
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">{pct}%</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {checklistData.map(item => {
              const meta = CHECKLIST_META[item.key];
              let color = "";
              let chip = "";
              if (meta) {
                color = meta.color;
                chip = meta.chip;
              } else {
                color = item.fulfilled ? "border-emerald-100 bg-white" : "border-yellow-100 bg-yellow-50/30";
                chip = item.fulfilled
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                  : "bg-yellow-100 text-yellow-700 border-yellow-200";
              }
              return (
                <div
                  key={item.key}
                  className={`flex flex-col p-4 rounded-2xl border shadow-sm gap-2 ${color ? color : ""}`}
                >
                  <div className="flex flex-row gap-2 items-center mb-1">
                    <span className="flex-shrink-0 flex items-center justify-center">
                      {checklistIcon(item.key, item.fulfilled)}
                    </span>
                    <span className="font-bold">{checklistLabel(item.key)}</span>
                  </div>
                  {(item.key === "proyectivos") && item.doc && (
                    <div className="flex flex-col mt-1 gap-1">
                      <a
                        href={item.doc.filePath}
                        target="_blank"
                        rel="noopener"
                        className="flex items-center gap-2 border border-cyan-200 px-3 py-1 rounded-lg text-cyan-800 font-semibold bg-cyan-100 shadow-sm hover:bg-cyan-200 transition text-xs w-fit"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Descargar archivo
                      </a>
                      <span className="text-xs text-slate-400">
                        Subido el {formatDateDisplay(item.doc.uploadedAt)}
                      </span>
                    </div>
                  )}
                  {/* meta.admin => explicit admin-uploaded (if not fulfilled, show only label) */}
                  {meta?.admin && !item.doc && (
                    <span className="text-xs font-medium bg-purple-200 text-purple-900 py-1 rounded-full px-3 inline-block mt-1 border border-purple-400 shadow">
                      <ShieldExclamationIcon className="w-4 h-4 inline -mt-1 mr-1 text-purple-600" />
                      Sólo administrador puede subir
                    </span>
                  )}
                  {/* meta.field => system field */}
                  {meta?.field && (
                    <div className="text-xs text-blue-800 flex items-center gap-2 mb-1">
                      {item.fulfilled
                        ? <span>Registrado:&nbsp;<b>{item.value}</b></span>
                        : <span className="text-yellow-700 italic">No registrado</span>
                      }
                    </div>
                  )}
                  <span className={`inline-flex items-center gap-1 text-xs font-bold mt-2 px-2 py-0.5 rounded-full border ${chip}`}>
                    {item.fulfilled
                      ? <CheckCircleIcon className="w-4 h-4" />
                      : <ClockIcon className="w-4 h-4" />}
                    {item.fulfilled ? "Entregado/completo" : "Falta"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
