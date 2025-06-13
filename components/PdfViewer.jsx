
"use client";
import { useEffect, useRef, useState } from "react";

// Lightweight zero-dependency native embed for SaaS; can swap for react-pdf-viewer if needed
export default function PdfViewer({ url, height = 390, className = "" }) {
  // Use <embed> in modern browsers for SaaS quickview: will fallback to download link otherwise
  if (!url) return null;
  return (
    <div className={`w-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden ${className}`}>
      <embed src={url + "#toolbar=0&navpanes=0"} type="application/pdf" className="w-full" style={{minHeight: height, borderRadius: "0.75rem"}} />
      <div className="w-full bg-slate-100 text-slate-700 text-xs text-center px-3 py-1 rounded-b-xl border-t border-slate-200">
        Vista previa del PDF
      </div>
    </div>
  );
}
