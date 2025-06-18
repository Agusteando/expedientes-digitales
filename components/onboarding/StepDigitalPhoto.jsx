
"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import DocumentDropzone from "../DocumentDropzone";

export default function StepDigitalPhoto({
  picture,
  onUpload,
  uploading,
  uploadError,
  uploadSuccess,
}) {
  return (
    <div className="flex flex-col gap-3 items-center w-full">
      {picture && (
        <div className="flex flex-col items-center gap-2 mb-1">
          <Image
            src={picture}
            alt="Foto"
            width={140}
            height={140}
            className="rounded-full object-cover border-4 border-cyan-200 bg-white shadow w-[120px] h-[120px] xs:w-[140px] xs:h-[140px]"
          />
          <span className="text-sm text-slate-600 mt-1">Vista previa de tu fotografía</span>
        </div>
      )}
      <DocumentDropzone
        loading={uploading}
        error={uploadError}
        onFile={onUpload}
        accept="image/jpeg,image/png"
        labelText="Sube tu imagen JPG o PNG aquí"
      />
      {uploadSuccess && (
        <div className="flex items-center justify-center gap-2 px-5 py-2 mt-1 rounded-xl text-emerald-800 font-bold shadow bg-emerald-50 border-emerald-200 border animate-pop w-fit min-w-[210px]">
          <svg className="w-7 h-7 text-emerald-400 animate-sparkle" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="#34D399" strokeWidth="3" fill="#A7F3D0"/>
            <path d="M7 13l3 3 7-7" stroke="#059669" strokeWidth="2.3" fill="none" strokeLinecap="round"/>
          </svg>
          <span>{uploadSuccess}</span>
        </div>
      )}
    </div>
  );
}
