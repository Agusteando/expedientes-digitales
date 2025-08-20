
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
  ChevronDownIcon,
  ChevronRightIcon,
  EyeIcon,
  DocumentDuplicateIcon
} from "@heroicons/react/24/solid";
import { stepsExpediente } from "../stepMetaExpediente";

const DOC_KEYS = stepsExpediente.filter(s => !s.isPlantelSelection && !s.adminUploadOnly).map(s => s.key);

const CHECKLIST_META = {
  proyectivos: {
    label: "Proyectivos entregados (admin)",
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
      hour: "2-digit",
      minute: "2-digit"
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

// File preview: only for .jpg, .jpeg, .png, .gif, .svg
function canPreviewFile(filePath) {
  if (!filePath) return false;
  return /\.(jpe?g|png|gif|svg)$/i.test(filePath);
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
  const [activeSection, setActiveSection] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

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

  // --- Normalize documents by version for each type ---
  // We'll use all versions for every document type.
  const userDocsArr = Array.isArray(docs?.documents) ? docs.documents.slice() : [];
  const versionsByType = {};
  for (const doc of userDocsArr) {
    if (!versionsByType[doc.type]) versionsByType[doc.type] = [];
    versionsByType[doc.type].push(doc);
  }
  // Sort versions per type (descending: latest first)
  for (const k in versionsByType) {
    versionsByType[k] = versionsByType[k].slice().sort((a, b) => {
      // Descending by version, tiebreaker uploadedAt
      if ((b.version || 1) !== (a.version || 1))
        return (b.version || 1) - (a.version || 1);
      if (b.uploadedAt && a.uploadedAt) {
        return new Date(b.uploadedAt) - new Date(a.uploadedAt);
      }
      return 0;
    });
  }

  // Checklist/fields logic
  const userChecklistArr = docs?.checklist || [];
  const checklistByType = Object.fromEntries(userChecklistArr.map((c) => [c.type, c]));

  // Prepare dictamen download fields
  const ecoDictamenUrl = dictamens.ecoUrl || null;
  const mmpiDictamenUrl = dictamens.mmpiUrl || null;

  // Compose checklist for completion/progress
  const checklistData = [
    ...DOC_KEYS.map(key => ({
      key,
      type: "doc",
      fulfilled: checklistByType[key]?.fulfilled || false,
      doc: (versionsByType[key] && versionsByType[key][0]) || null,
      docVersions: versionsByType[key] || [],
    })),
    {
      key: "proyectivos",
      type: "admin-doc",
      fulfilled: !!(versionsByType.proyectivos && versionsByType.proyectivos[0]),
      doc: (versionsByType.proyectivos && versionsByType.proyectivos[0]) || null,
      docVersions: versionsByType.proyectivos || [],
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

  // Accordions
  function toggleSection(type) {
    setActiveSection(s => s === type ? null : type);
  }

  // UX for image preview modal
  function PreviewModal({ url, onClose }) {
    return (
      <div className="fixed inset-0 z-[99] bg-black/70 flex items-center justify-center">
        <div className="relative bg-white max-w-xs xs:max-w-sm sm:max-w-md rounded-lg p-2 shadow-2xl">
          <button className="absolute right-2 top-2 bg-white rounded-full text-cyan-900 shadow px-2 py-1 z-10" onClick={onClose}>
            <XMarkIcon className="w-5 h-5" />
          </button>
          {/* Force image to fit */}
          <img src={url} alt="Previsualización" className="max-w-xs max-h-[70vh] rounded-xl shadow border border-cyan-200 bg-white" />
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
            {versionsByType.proyectivos && versionsByType.proyectivos.length > 0 && !showProyDropzone && (
              <div className="flex flex-col gap-0.5 mb-1">
                <div className="flex items-center gap-3">
                  <a href={versionsByType.proyectivos[0].filePath} target="_blank" rel="noopener"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-700 border border-cyan-200"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" /> Descargar
                  </a>
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 text-xs border border-emerald-200 font-bold rounded-full">
                    <CheckCircleIcon className="w-4 h-4" />¡Completado!
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Subido el {formatDateDisplay(versionsByType.proyectivos[0].uploadedAt)}
                </div>
              </div>
            )}
            {versionsByType.proyectivos && versionsByType.proyectivos.length > 0 && !showProyDropzone && (
              <button
                className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 bg-purple-700 hover:bg-purple-900 text-white rounded-full font-bold text-xs"
                onClick={() => setShowProyDropzone(true)}
                type="button"
              >
                <ArrowUpTrayIcon className="w-4 h-4" />
                Volver a subir proyectivos
              </button>
            )}
            {(!versionsByType.proyectivos || versionsByType.proyectivos.length === 0 || showProyDropzone) && (
              <>
                <UploadDropzone
                  onFile={file => { setPending(f=>({...f, ["proyectivos"]:file})); setUploadError(e=>({...e,["proyectivos"]:""})); setUploadSuccess(s=>({...s,["proyectivos"]:""})); }}
                  accept="application/pdf,image/*"
                  disabled={uploading["proyectivos"]}
                />
                {(versionsByType.proyectivos && versionsByType.proyectivos.length > 0 && showProyDropzone) && (
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
            <span className="text-xs font-bold text-cyan-800">Progreso: {done} / {total}</span>
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
          <div className="mb-6">
            {/* Elegant accordion for each doc section */}
            <div className="space-y-2">
              {checklistData.map(item => {
                // Only docs, skip dictamens (keep admin-docs)
                if (item.type !== "doc" && item.type !== "admin-doc") return null;
                const docVersions = item.docVersions || [];
                const expanded = activeSection === item.key;
                const isCompleted = !!(docVersions.length && item.fulfilled);
                const latestDoc = docVersions.length > 0 ? docVersions[0] : null;
                const label = checklistLabel(item.key);

                return (
                  <div key={item.key} className={`border rounded-2xl shadow-sm ${isCompleted ? "border-emerald-200 bg-emerald-50/40" : "border-cyan-100 bg-white"}`}>
                    <button
                      className="w-full flex flex-row items-center justify-between gap-2 px-3 py-3 sm:px-5 sm:py-4 rounded-2xl focus:outline-cyan-700"
                      type="button"
                      onClick={() => toggleSection(item.key)}
                      aria-expanded={expanded}
                      aria-controls={`doc-versions-${item.key}`}
                      tabIndex={0}
                    >
                      <div className="flex flex-row items-center gap-3">
                        {checklistIcon(item.key, isCompleted)}
                        <span className={`font-bold text-base text-cyan-900`}>{label}</span>
                        {isCompleted && <CheckCircleIcon className="w-4 h-4 text-emerald-600 ml-1" />}
                      </div>
                      <span>
                        {expanded
                          ? <ChevronDownIcon className="w-6 h-6 text-cyan-500" />
                          : <ChevronRightIcon className="w-6 h-6 text-cyan-400" />
                        }
                      </span>
                    </button>
                    {expanded && (
                      <div id={`doc-versions-${item.key}`} className="pb-0 px-3 sm:px-5 pt-0">
                        {docVersions.length === 0 ? (
                          <div className="text-xs text-slate-500 py-4 text-center">Sin archivos subidos.</div>
                        ) : (
                          <ul className="divide-y">
                            {docVersions.map((d, idx) => (
                              <li key={d.id} className={`flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between py-3 ${idx === 0 ? "bg-cyan-50 rounded-lg" : ""}`}>
                                <div className="flex flex-row items-center min-w-0 gap-2 flex-wrap">
                                  {idx === 0 && <span className="inline-block px-2 py-0.5 text-xs font-bold bg-cyan-600 text-white rounded-full mr-2">Última versión</span>}
                                  <span className="font-bold text-slate-700 mr-2">Versión {d.version} </span>
                                  <span className="text-xs text-slate-500">{formatDateDisplay(d.uploadedAt)}</span>
                                </div>
                                <div className="flex flex-row gap-2 items-center flex-wrap">
                                  <a
                                    href={d.filePath}
                                    target="_blank"
                                    rel="noopener"
                                    className="flex items-center px-3 py-1 rounded shadow-sm text-cyan-800 font-semibold border border-cyan-200 bg-cyan-50 hover:bg-cyan-100 transition text-xs"
                                    title="Descargar documento"
                                  >
                                    <ArrowDownTrayIcon className="w-4 h-4 mr-1" /> Descargar
                                  </a>
                                  {canPreviewFile(d.filePath) && (
                                    <button
                                      type="button"
                                      className="flex items-center px-2.5 py-1 rounded border bg-white hover:bg-cyan-50 text-cyan-600 border-cyan-200 shadow-sm text-xs font-semibold"
                                      onClick={() => setPreviewImage(d.filePath)}
                                      title="Ver imagen"
                                    >
                                      <EyeIcon className="w-4 h-4 mr-0.5" /> Ver
                                    </button>
                                  )}
                                  <a
                                    href={d.filePath}
                                    target="_blank"
                                    rel="noopener"
                                    className="flex items-center px-2.5 py-1 rounded border bg-white hover:bg-cyan-50 text-cyan-500 border-cyan-200 shadow-sm text-xs font-semibold"
                                    title="Abrir en nueva pestaña"
                                    style={{ minWidth: 34 }}
                                  >
                                    <DocumentDuplicateIcon className="w-4 h-4 mr-0.5" /> Abrir
                                  </a>
                                  {idx === 0 && (
                                    <span className="inline-block rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-xs text-emerald-800 font-bold ml-2">
                                      Activo
                                    </span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Dictamen accordion (minimal: always one "descargar" button) */}
          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`border rounded-2xl shadow bg-blue-50/60 border-blue-100`}>
              <div className="px-5 py-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold">
                  <DocumentTextIcon className="w-5 h-5 text-blue-600" /> Dictamen EVA (Evaluatest)
                </div>
                {!user.evaId?
                  <div className="text-xs text-slate-500 py-2">Sin dictamen disponible.</div>
                :(
                  <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-1.5 bg-blue-700 hover:bg-blue-900 text-white rounded-full font-bold text-xs"
                    disabled={evaDownloading}
                    onClick={handleEvaDictamenDownload}
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    {evaDownloading ? "Descargando..." : "Descargar dictamen"}
                  </button>
                )}
                {evaDownloadError && (
                  <span className="text-xs text-red-700 font-semibold">{evaDownloadError}</span>
                )}
              </div>
            </div>
            <div className={`border rounded-2xl shadow bg-violet-50/60 border-violet-100`}>
              <div className="px-5 py-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold">
                  <DocumentTextIcon className="w-5 h-5 text-violet-600" /> Dictamen MMPI/ECO
                </div>
                {!ecoDictamenUrl && !mmpiDictamenUrl ?
                  <div className="text-xs text-slate-500 py-2">Sin dictámenes disponibles.</div>
                :(
                  <div className="flex flex-row flex-wrap gap-2">
                    {!!ecoDictamenUrl && (
                      <a
                        href={ecoDictamenUrl}
                        target="_blank"
                        rel="noopener"
                        className="flex items-center px-3 py-1 border border-fuchsia-300 rounded-lg text-fuchsia-900 font-semibold bg-fuchsia-50 shadow-sm hover:bg-fuchsia-100 transition text-xs"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                        Desc. ECO
                      </a>
                    )}
                    {!!mmpiDictamenUrl && (
                      <a
                        href={mmpiDictamenUrl}
                        target="_blank"
                        rel="noopener"
                        className="flex items-center px-3 py-1 border border-violet-300 rounded-lg text-violet-900 font-semibold bg-violet-50 shadow-sm hover:bg-violet-100 transition text-xs"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                        Desc. MMPI
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {previewImage && (
          <PreviewModal url={previewImage} onClose={() => setPreviewImage(null)} />
        )}
      </div>
    </div>
  );
}
