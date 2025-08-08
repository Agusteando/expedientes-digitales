
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

const DOC_KEYS = stepsExpediente.filter(s => !s.isPlantelSelection && !s.adminUploadOnly).map(s => s.key);

const CHECKLIST_META = {
  proyectivos: {
    label: "Proyectivos entregados (admin)",
    hint: "SÓLO admin puede subir",
    icon: ShieldExclamationIcon,
    color: "bg-purple-100 border-purple-300 text-purple-900",
    chip: "bg-white border-purple-400 text-purple-900",
    admin: true,
  },
  evaDictamen: {
    label: "Dictamen EVA (Evaluatest)",
    icon: DocumentTextIcon,
    color: "bg-blue-50 border-blue-200 text-blue-900",
    chip: "bg-blue-100 border-blue-200 text-blue-900",
    dictamen: true,
  },
  ecoDictamen: {
    label: "ECO Dictamen",
    icon: DocumentTextIcon,
    color: "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-900",
    chip: "bg-fuchsia-100 border-fuchsia-200 text-fuchsia-900",
    dictamen: true,
  },
  mmpiDictamen: {
    label: "MMPI-2 RF Dictamen",
    icon: DocumentTextIcon,
    color: "bg-violet-50 border-violet-200 text-violet-900",
    chip: "bg-violet-100 border-violet-200 text-violet-900",
    dictamen: true,
  },
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
  if (CHECKLIST_META[type]?.dictamen) {
    return status
      ? <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
      : <ClockIcon className="w-5 h-5 text-yellow-500" />;
  }
  return status
    ? <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
    : <ClockIcon className="w-5 h-5 text-yellow-500" />;
}

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

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "archivo.pdf";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
    a.remove();
  }, 900);
}

export default function UserDocsDrawer({ open, user, onClose }) {
  const [docs, setDocs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState({});
  const [uploading, setUploading] = useState({});
  const [uploadSuccess, setUploadSuccess] = useState({});
  const [uploadError, setUploadError] = useState({});
  const [showProyDropzone, setShowProyDropzone] = useState(false);

  // Dictamens (eco/mmpi) URLs
  const [dictamens, setDictamens] = useState({ ecoUrl: null, mmpiUrl: null });

  // EVA download
  const [evaDownloading, setEvaDownloading] = useState(false);
  const [evaDownloadError, setEvaDownloadError] = useState("");

  useEffect(() => {
    async function loadDocs() {
      if (!open || !user) return;
      setLoading(true); setDocs(null);
      const r = await fetch(`/api/admin/user/${user.id}/docs`);
      const d = await r.json();
      setDocs(d); setLoading(false); setPending({});
      setShowProyDropzone(false);
    }
    loadDocs();
  }, [open, user]);

  useEffect(() => {
    async function fetchDictamens() {
      if (!open || !user?.id || !user.pathId) {
        setDictamens({ ecoUrl: null, mmpiUrl: null });
        return;
      }
      try {
        const res = await fetch(`/api/users/${user.id}/dictamens`, { cache: "no-store" });
        if (!res.ok) return setDictamens({ ecoUrl: null, mmpiUrl: null });
        const data = await res.json();
        setDictamens({ ecoUrl: data.ecoUrl, mmpiUrl: data.mmpiUrl });
      } catch {
        setDictamens({ ecoUrl: null, mmpiUrl: null });
      }
    }
    fetchDictamens();
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
        setShowProyDropzone(false);
        setLoading(true);
        const fresh = await fetch(`/api/admin/user/${user.id}/docs`).then(r => r.json());
        setDocs(fresh); setLoading(false);
      }
    } catch (err) {
      setUploadError(e => ({ ...e, [type]: String(err.message || err) }));
    }
    setUploading(u => ({ ...u, [type]: false }));
  }

  // EVA Dictamen download button handler
  async function handleEvaDictamenDownload() {
    setEvaDownloading(true); setEvaDownloadError("");
    try {
      const res = await fetch(`/api/users/${user.id}/eva-dictamen`);
      if (!res.ok) {
        setEvaDownloadError("No se encontró el dictamen EVA.");
        setEvaDownloading(false);
        return;
      }
      const blob = await res.blob();
      downloadBlob(blob, `eva_dictamen_${user.evaId || user.name || user.id}.pdf`);
    } catch(e) {
      setEvaDownloadError("Hubo un error al descargar el dictamen EVA.");
    }
    setEvaDownloading(false);
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

  // Prepare dictamen download fields
  const ecoDictamenUrl = dictamens.ecoUrl || null;
  const mmpiDictamenUrl = dictamens.mmpiUrl || null;

  // Compose checklist rows, now with dictamens (remove PATH ID!)
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
      key: "evaDictamen",
      type: "dictamen",
      fulfilled: !!user.evaId,
    },
    {
      key: "ecoDictamen",
      type: "dictamen",
      fulfilled: !!ecoDictamenUrl,
      dictamenUrl: ecoDictamenUrl,
    },
    {
      key: "mmpiDictamen",
      type: "dictamen",
      fulfilled: !!mmpiDictamenUrl,
      dictamenUrl: mmpiDictamenUrl,
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
        {/* -- Upload proyectivos block -- */}
        <div className="px-5 pt-6 pb-2 flex flex-col gap-4">
          <div className="border-2 bg-purple-50 border-purple-300 rounded-xl p-4 w-full flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold text-base mb-1 text-purple-900">
              <ShieldExclamationIcon className="w-7 h-7 text-purple-500" /> Proyectivos (admin)
            </div>
            {docsByType.proyectivos && !showProyDropzone && (
              <div className="flex flex-col gap-0.5 mb-1">
                <div className="flex items-center gap-3">
                  <a href={docsByType.proyectivos.filePath} target="_blank" rel="noopener"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-700 border border-cyan-200"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" /> Descargar
                  </a>
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 text-xs border border-emerald-200 font-bold rounded-full">
                    <CheckCircleIcon className="w-4 h-4" />¡Completado!
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Subido el {formatDateDisplay(docsByType.proyectivos.uploadedAt)}
                </div>
              </div>
            )}
            {docsByType.proyectivos && !showProyDropzone && (
              <button
                className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 bg-purple-700 hover:bg-purple-900 text-white rounded-full font-bold text-xs"
                onClick={() => setShowProyDropzone(true)}
                type="button"
              >
                <ArrowUpTrayIcon className="w-4 h-4" />
                Volver a subir proyectivos
              </button>
            )}
            {(!docsByType.proyectivos || showProyDropzone) && (
              <>
                <UploadDropzone
                  onFile={file => { setPending(f=>({...f, ["proyectivos"]:file})); setUploadError(e=>({...e,["proyectivos"]:""})); setUploadSuccess(s=>({...s,["proyectivos"]:""})); }}
                  accept="application/pdf,image/*"
                  disabled={uploading["proyectivos"]}
                />
                {(docsByType.proyectivos && showProyDropzone) && (
                  <button
                    type="button"
                    onClick={() => { setShowProyDropzone(false); setPending(f=>({...f,["proyectivos"]:undefined})); }}
                    className="text-xs font-bold text-slate-600 hover:text-purple-800 mt-2"
                  >Cancelar</button>
                )}
              </>
            )}
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
                  Subir
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
              // Download logic for dictamens
              if (item.key === "evaDictamen" && user.evaId) {
                return (
                  <div
                    key={item.key}
                    className={`flex flex-col p-4 rounded-2xl border shadow-sm gap-2 ${color}`}
                  >
                    <div className="flex flex-row gap-2 items-center mb-1">
                      <span className="flex-shrink-0 flex items-center justify-center">
                        {checklistIcon(item.key, !!user.evaId)}
                      </span>
                      <span className="font-bold">{checklistLabel(item.key)}</span>
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      <button
                        type="button"
                        className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg border border-blue-300 bg-blue-100 text-blue-900 hover:bg-blue-200 transition disabled:opacity-70 select-none`}
                        disabled={evaDownloading}
                        onClick={handleEvaDictamenDownload}
                      >
                        {evaDownloading ? (
                          <svg className="animate-spin w-4 h-4 text-blue-700" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        ) : (
                          <ArrowDownTrayIcon className="w-4 h-4" />
                        )}
                        Descargar dictamen EVA
                      </button>
                      {evaDownloadError && (
                        <span className="text-xs font-bold text-red-600">
                          {evaDownloadError}
                        </span>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold mt-2 px-2 py-0.5 rounded-full border ${chip}`}>
                      {item.fulfilled
                        ? <CheckCircleIcon className="w-4 h-4" />
                        : <ClockIcon className="w-4 h-4" />}
                      {item.fulfilled ? "¡Dictamen disponible!" : "Falta"}
                    </span>
                  </div>
                );
              }
              if (meta?.dictamen && item.dictamenUrl) {
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
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <a
                        href={item.dictamenUrl}
                        target="_blank"
                        rel="noopener"
                        className="flex items-center px-3 py-1 border border-cyan-200 rounded-lg text-cyan-800 font-semibold bg-cyan-100 shadow-sm hover:bg-cyan-200 transition text-xs"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                        Descargar dictamen
                      </a>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold mt-2 px-2 py-0.5 rounded-full border ${chip}`}>
                      {item.fulfilled
                        ? <CheckCircleIcon className="w-4 h-4" />
                        : <ClockIcon className="w-4 h-4" />}
                      {item.fulfilled ? "¡Dictamen disponible!" : "Falta"}
                    </span>
                  </div>
                );
              }
              if (meta?.admin && !item.doc) {
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
                    <span className="text-xs font-medium bg-purple-200 text-purple-900 py-1 rounded-full px-3 inline-block mt-1 border border-purple-400 shadow">
                      <ShieldExclamationIcon className="w-4 h-4 inline -mt-1 mr-1 text-purple-600" />
                      Sólo administrador puede subir
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold mt-2 px-2 py-0.5 rounded-full border ${chip}`}>
                      {item.fulfilled
                        ? <CheckCircleIcon className="w-4 h-4" />
                        : <ClockIcon className="w-4 h-4" />}
                      {item.fulfilled
                        ? (item.key === "proyectivos" ? "¡Completado!" : "Entregado/completo")
                        : "Falta"}
                    </span>
                  </div>
                );
              }
              // Regular doc upload entries
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
                  {item.doc && (
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      <a
                        href={item.doc.filePath}
                        target="_blank"
                        rel="noopener"
                        className="flex items-center px-3 py-1 border border-cyan-200 rounded-lg text-cyan-800 font-semibold bg-cyan-100 shadow-sm hover:bg-cyan-200 transition text-xs"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                        Descargar archivo
                      </a>
                      <span className="text-xs text-slate-500">
                        Subido el {formatDateDisplay(item.doc.uploadedAt)}
                      </span>
                    </div>
                  )}
                  <span className={`inline-flex items-center gap-1 text-xs font-bold mt-2 px-2 py-0.5 rounded-full border ${chip}`}>
                    {item.fulfilled
                      ? <CheckCircleIcon className="w-4 h-4" />
                      : <ClockIcon className="w-4 h-4" />}
                    {item.fulfilled
                      ? (item.key === "proyectivos" ? "¡Completado!" : "Entregado/completo")
                      : "Falta"}
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
