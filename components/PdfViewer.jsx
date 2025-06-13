
"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, DocumentIcon } from "@heroicons/react/24/outline";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import "pdfjs-dist/web/pdf_viewer.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function PdfViewer({ url, height = 380, className = "" }) {
  const canvasRef = useRef(null);
  const [instance, setInstance] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [rendering, setRendering] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [error, setError] = useState("");

  // Load PDF doc
  useEffect(() => {
    if (!url) return;
    setError("");
    setInstance(null);
    setNumPages(0);
    setPage(1);
    setRendering(true);

    pdfjsLib.getDocument(url).promise
      .then(pdfDoc => {
        setInstance(pdfDoc);
        setNumPages(pdfDoc.numPages);
        setPage(1);
        setRendering(false);
      })
      .catch(e => {
        setError("No se pudo cargar el PDF.");
        setRendering(false);
      });
  }, [url]);

  // Render current page to canvas
  useEffect(() => {
    if (!instance || !canvasRef.current || collapsed) return;
    setRendering(true);
    instance.getPage(page).then(pdfPage => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const viewport = pdfPage.getViewport({ scale: 1.35 }); // Quality/resolution, adjust as needed
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      pdfPage.render({ canvasContext: ctx, viewport }).promise.then(() => {
        setRendering(false);
      });
    }).catch(e => {
      setRendering(false);
      setError("Error mostrando la página.");
    });
  }, [instance, page, collapsed]);

  if (!url) return null;
  if (error) {
    return (
      <div className={`rounded-xl border border-red-200 bg-red-50 w-full flex items-center justify-center min-h-[120px] ${className}`}>
        <span className="text-red-700 font-bold"><DocumentIcon className="w-7 h-7 mr-2 inline" />{error}</span>
      </div>
    );
  }

  return (
    <div className={`relative w-full rounded-xl border border-slate-200 bg-white shadow-sm transition-all ${className} ${collapsed ? "overflow-hidden" : ""}`}>
      <div className="w-full flex flex-row justify-between items-center px-2 py-2 bg-slate-50 rounded-t-xl border-b border-slate-100 select-none">
        <span className="font-bold text-slate-800 text-xs xs:text-sm flex items-center">
          <DocumentIcon className="w-5 h-5 mr-1 text-cyan-400" />
          {"Vista previa PDF"}
        </span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Mostrar PDF" : "Ocultar PDF"}
          className="hover:bg-slate-100 text-cyan-500 rounded px-1 py-1 transition"
          tabIndex={0}
          type="button"
        >
          {collapsed
            ? <ArrowsPointingOutIcon className="w-5 h-5" />
            : <ArrowsPointingInIcon className="w-5 h-5" />
          }
        </button>
      </div>
      {!collapsed && (
        <div className="w-full flex flex-col items-center justify-center px-2 pt-3 pb-2">
          <div className="relative w-full max-w-full flex items-center justify-center bg-white rounded-lg mb-2">
            <canvas
              ref={canvasRef}
              className={`w-auto max-w-full h-auto mx-auto rounded-[0.9rem] border border-slate-100 transition-shadow shadow ${rendering ? "opacity-40" : "opacity-100"}`}
              style={{ minHeight: `${height}px`, maxWidth: "96vw", outline: 0 }}
            />
            {rendering && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-cyan-400 text-xs font-bold animate-pulse">Cargando página...</span>
              </div>
            )}
          </div>
          {/* Controls */}
          <div className="w-full flex flex-row items-center justify-center gap-3 pb-2">
            <button
              disabled={page === 1 || rendering}
              className="px-2 py-1 rounded-full font-bold text-cyan-800 bg-cyan-50 border border-cyan-200 hover:bg-cyan-100 transition disabled:opacity-50 disabled:pointer-events-none"
              onClick={() => setPage(Math.max(page - 1, 1))}
              tabIndex={0}
              aria-label="Página anterior"
              type="button"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <div className="flex flex-row items-baseline gap-1 text-xs md:text-sm">
              <label className="sr-only" htmlFor="pdfviewer-page-navigate">Página</label>
              <input
                type="number"
                value={page}
                min={1} max={numPages}
                id="pdfviewer-page-navigate"
                onChange={e => {
                  let val = parseInt(e.target.value || "1", 10);
                  val = Math.max(1, Math.min(val, numPages));
                  setPage(val);
                }}
                className="w-10 px-1 rounded border border-cyan-200 text-center bg-white focus:outline-none focus:ring-2 ring-cyan-300 font-bold text-slate-700"
                style={{ fontSize: "1em" }}
                disabled={rendering}
              />&nbsp;
              <span className="text-slate-500 font-semibold">/ {numPages || 1}</span>
            </div>
            <button
              disabled={page === numPages || rendering}
              className="px-2 py-1 rounded-full font-bold text-cyan-800 bg-cyan-50 border border-cyan-200 hover:bg-cyan-100 transition disabled:opacity-50 disabled:pointer-events-none"
              onClick={() => setPage(Math.min(page + 1, numPages))}
              tabIndex={0}
              aria-label="Página siguiente"
              type="button"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
