
"use client";
import { useRef, useState } from "react";
import { ArrowUpTrayIcon, DocumentArrowUpIcon } from "@heroicons/react/24/solid";
import { dropzone, inputBase, mainButton } from "../lib/ui-classes";

export default function DocumentDropzone({ loading, error, onFile, accept }) {
  const inputRef = useRef();
  const [drag, setDrag] = useState(false);

  return (
    <label
      className={`${dropzone} ${drag ? "border-cyan-500 bg-cyan-100" : ""} ${loading ? "opacity-70 cursor-progress" : ""}`}
      onDragEnter={e => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={e => {
        e.preventDefault();
        setDrag(false);
      }}
      onDragOver={e => {
        e.preventDefault();
        setDrag(true);
      }}
      onDrop={e => {
        e.preventDefault();
        setDrag(false);
        if (e.dataTransfer.files?.[0]) {
          onFile?.(e.dataTransfer.files[0]);
        }
      }}
      tabIndex={0}
      aria-label="Sube tu archivo en PDF"
    >
      <input
        type="file"
        className="hidden"
        ref={inputRef}
        onChange={e => {
          if (e.target.files?.[0]) {
            onFile?.(e.target.files[0]);
          }
          setDrag(false);
        }}
        disabled={loading}
        accept={accept || "application/pdf"}
      />
      <DocumentArrowUpIcon className="w-8 h-8 text-cyan-400 mb-2" />
      <span className="block font-semibold text-cyan-800 text-sm mb-1">Sube tu archivo PDF aquí</span>
      <span className="block text-xs text-slate-400">Arrastra o haz clic para seleccionar</span>
      {error && <span className="block mt-2 text-xs text-red-500 font-bold">{error}</span>}
      <ArrowUpTrayIcon
        className="hidden"
        onClick={e => {
          e.preventDefault();
          if (inputRef.current) inputRef.current.click();
        }}
      />
    </label>
  );
}
