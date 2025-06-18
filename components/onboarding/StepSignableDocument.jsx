
"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { getStatusMeta } from "@/lib/expedienteStatus";
import { StubReglamento, StubContrato } from "../ReglamentoContratoStub";
const MifielWidgetClient = dynamic(() => import("../MifielWidgetClient"), { ssr: false });

export default function StepSignableDocument({
  type, // "contrato" or "reglamento"
  status,
  signature,
  canSign,
  handleSign,
  signatureStatus,
  signatureLoading,
  onWidgetSuccess,
  user,
}) {
  const [widgetId, setWidgetId] = useState("");
  useEffect(() => {
    setWidgetId(
      signature?.mifielMetadata?.signers?.[0]?.widget_id || ""
    );
  }, [signature]);
  const stat = getStatusMeta(signature?.status);

  return (
    <div className="flex flex-col gap-3 items-center w-full">
      {type === "reglamento" && <StubReglamento />}
      {type === "contrato" && <StubContrato />}
      {canSign ? (
        <>
          {signature &&
            signature.status !== "signed" &&
            signature.status !== "completed" &&
            (widgetId) && (
              <div className="w-full mx-auto mb-2">
                <MifielWidgetClient
                  widgetId={widgetId}
                  env="production"
                  onSuccess={onWidgetSuccess}
                  onError={(err) => { /* Surface error if desired */ }}
                />
              </div>
            )}
          {signature &&
            (signature.status === "signed" || signature.status === "completed") && (
              <div className="w-full flex flex-col items-center gap-2 mt-2">
                <div className="text-base xs:text-lg text-emerald-700 font-bold">
                  ¡Documento firmado digitalmente!
                </div>
                {signature?.mifielMetadata?.file_signed && (
                  <a
                    href={`https://app.mifiel.com${signature.mifielMetadata.file_signed}`}
                    target="_blank"
                    rel="noopener"
                    className="text-cyan-700 underline font-bold text-xs"
                  >
                    Descargar documento firmado
                  </a>
                )}
              </div>
            )}
          {(!signature || (signature?.status !== "signed" && signature?.status !== "completed")) && !widgetId && (
            <button
              onClick={handleSign}
              disabled={signatureLoading}
              className="mt-4 py-2 rounded-full w-full max-w-xs bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold shadow-lg text-base hover:from-teal-700 hover:to-cyan-800"
            >
              Firmar digitalmente ahora
            </button>
          )}
          {signatureStatus && (
            <div className="w-full text-center text-xs mt-2 text-purple-700 font-bold">
              {signatureStatus}
            </div>
          )}
        </>
      ) : (
        <div className="w-full text-center text-sm text-yellow-700 mt-2 font-semibold px-3">
          Antes de firmar este documento, completa primero todos los archivos requeridos, selecciona plantel y sube fotografía.
        </div>
      )}
      <div className={`inline-flex items-center gap-2 font-bold text-xs md:text-sm px-3 py-1 rounded-full ${
        stat.color === "emerald"
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : stat.color === "red"
            ? "bg-red-50 text-red-600 border border-red-200"
            : stat.color === "yellow"
              ? "bg-yellow-50 text-yellow-800 border border-yellow-100"
              : "bg-slate-100 text-slate-500 border border-slate-100"
      }`}>
        {stat.icon && <stat.icon className="w-5 h-5 mr-0.5" />}
        {stat.display}
      </div>
    </div>
  );
}
