
"use client";
import { useState } from "react";
import DocumentDropzone from "../DocumentDropzone";
import PdfViewer from "../PdfViewer";
import { ChatBubbleLeftEllipsisIcon, DocumentDuplicateIcon } from "@heroicons/react/24/solid";
import { getStatusMeta } from "@/lib/expedienteStatus";

function formatDateDisplay(date) {
  if (!date) return "";
  try {
    return new Date(date).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return String(date);
  }
}

export default function StepDocumentUpload({
  latestDoc,
  documentHistory = [],
  uploading,
  uploadError,
  uploadSuccess,
  uploadProgress,
  onUpload,
  accept,
}) {
  return (
    <div className="flex flex-col items-center w-full">
      {latestDoc ? (
        <>
          <PdfViewer url={latestDoc.filePath} height={380} className="mb-2" />
          <div className="flex flex-row gap-3 w-full mb-1 items-center justify-center">
            <a
              href={latestDoc.filePath}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-2 border border-cyan-200 px-4 py-2 rounded-lg text-cyan-800 font-semibold bg-cyan-50 shadow-sm hover:bg-cyan-100 transition text-xs mt-1 mb-1"
            >
              Descargar PDF
            </a>
            <span className="inline-flex items-center px-2 py-1 rounded bg-cyan-50 text-xs text-slate-400 font-mono">
              {latestDoc.uploadedAt ? `Subido ${formatDateDisplay(latestDoc.uploadedAt)}` : null}
              {latestDoc.version ? <> &nbsp;| v{latestDoc.version}</> : null}
            </span>
          </div>
          {latestDoc.reviewComment && (
            <div className="flex flex-row items-center gap-2 bg-fuchsia-50 border border-fuchsia-200 rounded px-3 py-2 text-xs text-fuchsia-900 mt-1 mb-1 shadow-sm max-w-xl w-full">
              <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-fuchsia-400" />
              <span className="break-words">{latestDoc.reviewComment}</span>
            </div>
          )}
          {documentHistory.length > 1 && (
            <div className="w-full mt-3 px-1">
              <div className="font-bold text-cyan-900 dark:text-cyan-100 mb-1 text-xs flex items-center gap-2">
                <DocumentDuplicateIcon className="w-5 h-5 text-cyan-400" />
                Versiones anteriores
              </div>
              <div className="flex flex-col gap-1 max-h-40 overflow-auto">
                {documentHistory.slice(1).map((doc, idx) => {
                  const stat = getStatusMeta(doc.status);
                  const Icon = stat.icon;
                  return (
                    <div key={doc.id} className="flex flex-col gap-0.5 border border-cyan-50 dark:border-slate-800 py-1 px-2 rounded bg-cyan-50/50 dark:bg-slate-800/30 text-[12px]">
                      <div className="flex flex-row gap-2 items-center">
                        <a href={doc.filePath} target="_blank" className="underline text-cyan-800 dark:text-cyan-200 font-bold break-all">{`Versión v${doc.version}`}</a>
                        <span className="ml-2 text-slate-500">{formatDateDisplay(doc.uploadedAt)}</span>
                        <span className={`inline-flex items-center gap-1 ml-2 font-bold text-xs ${stat.color === "emerald" ? "text-emerald-700" : stat.color === "red" ? "text-red-700" : "text-slate-400"}`}>
                          {Icon && <Icon className="w-4 h-4" />}
                          {stat.display}
                        </span>
                      </div>
                      {doc.reviewComment && (
                        <div className="flex flex-row items-center gap-2 bg-fuchsia-50 border border-fuchsia-100 rounded px-2 py-1 text-xs text-fuchsia-900 mt-1 shadow-sm max-w-xl w-full">
                          <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-fuchsia-400" />
                          <span className="break-words">{doc.reviewComment}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : null}
      <div className="w-full flex flex-col justify-center items-center mt-3">
        <DocumentDropzone
          loading={uploading}
          error={uploadError}
          onFile={onUpload}
          accept={accept || "application/pdf"}
        />
        {uploadProgress !== null &&
          <div className="w-full pt-2">
            <div className="relative w-full h-3 rounded-full overflow-hidden bg-slate-100">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div className="text-center text-sm mt-1 font-bold text-cyan-700">{uploadProgress}%</div>
          </div>
        }
        {uploadSuccess && (
          <div className="flex items-center justify-center gap-2 px-5 py-2 mt-2 rounded-xl text-emerald-800 font-bold shadow bg-emerald-50 border-emerald-200 border animate-pop w-fit min-w-[210px]">
            <svg className="w-7 h-7 text-emerald-400 animate-sparkle" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="#34D399" strokeWidth="3" fill="#A7F3D0"/>
              <path d="M7 13l3 3 7-7" stroke="#059669" strokeWidth="2.3" fill="none" strokeLinecap="round"/>
            </svg>
            <span>{uploadSuccess}</span>
          </div>
        )}
      </div>
    </div>
  );
}
