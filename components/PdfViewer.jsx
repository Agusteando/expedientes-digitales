
"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, DocumentIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

function ErrorBox({ message, className = "" }) {
  return (
    <div className={`rounded-xl border border-red-200 bg-red-50 w-full flex items-center justify-center min-h-[120px] p-4 ${className}`}>
      <ExclamationTriangleIcon className="w-7 h-7 mr-2 text-red-500" />
      <span className="text-red-700 font-bold">{message}</span>
    </div>
  );
}

/**
 * PdfViewer component, robust against broken/missing/corrupt PDF, null url,
 * and PDF.js parse/load/render errors. Never throws/crashes on unhandled case.
 * Mobile-first and responsive.
 *
 * Props:
 *   url: string - URL or path to PDF file (relative or absolute).
 *   height?: number - Suggested min height for preview area.
 *   className?: string - Extra class names.
 */
export default function PdfViewer({ url, height = 380, className = "" }) {
  const canvasRef = useRef(null);
  const [pdfjs, setPdfjs] = useState(null); // pdfjs library reference (after import)
  const [instance, setInstance] = useState(null); // PDF document
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [rendering, setRendering] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [error, setError] = useState("");
  const [loadTried, setLoadTried] = useState(false);

  // Import pdfjs only on client-side
  useEffect(() => {
    let cancelled = false;
    setPdfjs(null); // Reset on re-mount
    import("pdfjs-dist/build/pdf")
      .then(pdfjsLib => {
        // Setup worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
        if (!cancelled) setPdfjs(pdfjsLib);
      })
      .catch(() => {
        setError("No se pudieron cargar los módulos de PDF.");
      });
    return () => { cancelled = true; };
  }, []);

  // Load document, clear old state if url/pdfjs changes
  useEffect(() => {
    if (!url) {
      setInstance(null);
      setNumPages(0);
      setPage(1);
      setRendering(false);
      setError("");
      setLoadTried(true);
      return;
    }
    if (!pdfjs) return;
    setError(""); setLoadTried(false);
    setInstance(null); setNumPages(0); setPage(1);
    setRendering(true);
    // Defensive loading: tests basic fetch first so we can catch 404s before pdfjs tries to parse HTML
    (async () => {
      try {
        const headRes = await fetch(url, { method: "HEAD" });
        // Safari (iOS/Mac) sometimes blocks HEAD, so also check after error
        if (!headRes.ok) {
          setError("No se pudo obtener el documento PDF.");
          setInstance(null); setRendering(false); setLoadTried(true);
          return;
        }
      } catch (e) {
        // proceed: may be CORS/HEAD-forbidden, try to load anyway
      }
      pdfjs.getDocument(url).promise
        .then(pdfDoc => {
          if (!pdfDoc || !pdfDoc.numPages) {
            setError("PDF inválido o sin páginas.");
            setInstance(null); setNumPages(0); setPage(1); setRendering(false); setLoadTried(true);
            return;
          }
          setInstance(pdfDoc);
          setNumPages(pdfDoc.numPages);
          setPage(1);
          setRendering(false);
          setLoadTried(true);
        })
        .catch(e => {
          let msg = "No se pudo cargar el PDF.";
          if (e && typeof e.message === "string") {
            if (/password/i.test(e.message)) msg = "Este PDF está protegido por contraseña.";
            if (/corrupt|parsing/i.test(e.message)) msg = "El archivo PDF parece estar dañado o es ilegible.";
            if (/fetch/i.test(e.message)) msg = "No se pudo descargar el PDF.";
          }
          setError(msg);
          setRendering(false);
          setLoadTried(true);
        });
    })();
    // eslint-disable-next-line
  }, [url, pdfjs]);

  // Render current page to canvas
  useEffect(() => {
    if (!instance || !canvasRef.current || collapsed) return;
    setRendering(true);
    let cancelled = false;
    instance.getPage(page).then(pdfPage => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return setRendering(false);
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      // Responsive scale: ensure never too wide for screen; use devicePixelRatio for sharpness
      const maxWidth = Math.min(880, window.innerWidth * 0.95);
      const scale = Math.min(1.13, Math.max(0.6, maxWidth / pdfPage.view[2]));
      const dpr = window.devicePixelRatio || 1;
      const viewport = pdfPage.getViewport({ scale: scale * dpr });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / dpr}px`;
      canvas.style.height = `${viewport.height / dpr}px`;
      // White bg under all docs for cropped/transparent PDF scan pages
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, viewport.width, viewport.height);
      ctx.restore();
      pdfPage.render({ canvasContext: ctx, viewport }).promise.then(
        () => {
          setRendering(false);
        },
        err => {
          setError("Error mostrando la página del PDF.");
          setRendering(false);
        }
      );
    }).catch(e => {
      setRendering(false);
      setError("Error mostrando la página PDF.");
    });
    return () => { cancelled = true; };
  }, [instance, page, collapsed]);

  // Defensive: if url is missing/empty string/null/undefined
  if (!url) {
    return <ErrorBox message="No hay PDF disponible para mostrar." className={className} />;
  }
  if (error) {
    return <ErrorBox message={error} className={className} />;
  }
  // Show nothing until load tried (avoids flash on first mount)
  if (!loadTried || (rendering && !instance)) {
    return (
      <div className={`rounded-xl border border-cyan-200 bg-slate-50 w-full min-h-[120px] flex items-center justify-center animate-pulse ${className}`}>
        <DocumentIcon className="w-7 h-7 mr-2 text-cyan-400" />
        <span className="text-cyan-700 font-bold">Cargando PDF&hellip;</span>
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
          type="button"
        >
          {collapsed
            ? <ArrowsPointingOutIcon className="w-5 h-5" />
            : <ArrowsPointingInIcon className="w-5 h-5" />
          }
        </button>
      </div>
      {!collapsed && instance && numPages > 0 && (
        <div className="w-full flex flex-col items-center justify-center px-2 pt-3 pb-2">
          <div className="relative w-full max-w-full flex items-center justify-center bg-white rounded-lg mb-2">
            <canvas
              ref={canvasRef}
              className={`w-auto max-w-full h-auto mx-auto rounded-[0.9rem] border border-slate-100 transition-shadow shadow ${rendering ? "opacity-40" : "opacity-100"}`}
              style={{ minHeight: `${height}px`, maxWidth: "96vw", outline: 0, background: "white" }}
              tabIndex={0}
              aria-label="Página PDF"
            />
            {rendering && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-cyan-400 text-xs font-bold animate-pulse pointer-events-none">Cargando página...</span>
              </div>
            )}
          </div>
          {/* Pagination Controls */}
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
              <input
                type="number"
                value={page}
                min={1}
                max={numPages}
                onChange={e => {
                  let val = parseInt(e.target.value || "1", 10);
                  val = Math.max(1, Math.min(val, numPages));
                  setPage(val);
                }}
                className="w-10 px-1 rounded border border-cyan-200 text-center bg-white focus:outline-none focus:ring-2 ring-cyan-300 font-bold text-slate-700"
                style={{ fontSize: "1em" }}
                disabled={rendering || numPages < 2}
                aria-label="Ir a la página"
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
      <style jsx>{`
        @media (max-width: 600px) {
          canvas { max-width: 95vw !important; }
        }
      `}</style>
    </div>
  );
}
