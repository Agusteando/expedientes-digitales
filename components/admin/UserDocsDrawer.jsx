
"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

/**
 * UserDocsDrawer: shows all uploaded docs, checklist, signature status, downloads, always mobile-friendly
 */
export default function UserDocsDrawer({ open, user, onClose }) {
  const [docs, setDocs] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      setLoading(true);
      setDocs(null);
      fetch(`/api/admin/user/${user.id}/docs`).then(async r => {
        const d = await r.json();
        setDocs(d);
        setLoading(false);
      });
    }
  }, [open, user]);

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex justify-end">
      <div className="w-full max-w-lg h-full bg-white shadow-2xl overflow-y-scroll border-l border-cyan-200 px-0 pt-0 relative">
        <button
          className="absolute right-3 top-3 text-cyan-800 font-bold rounded-full bg-cyan-50 p-2"
          onClick={onClose}
          aria-label="Cerrar"
        >✕</button>
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
        <div className="px-5 py-2">
          {loading && <div className="text-center text-cyan-600 py-7 text-sm font-bold">Cargando documentos...</div>}
          {docs && (
            <>
              <div className="mb-2 font-bold text-black mt-1 text-base">Checklist</div>
              <ul className="mb-3">
                {docs.checklist.map(c =>
                  <li key={c.type} className={`pl-2 my-0.5 ${c.fulfilled ? "text-emerald-700" : "text-yellow-600"} text-sm font-bold`}>
                    {c.fulfilled ? "✔️" : "⏺"} {c.type.replace(/_/g, " ")}
                  </li>
                )}
              </ul>
              <div className="mb-2 font-bold text-black mt-3 text-base">Archivos</div>
              <ul>
                {docs.documents.map(doc =>
                  <li key={doc.id} className="pl-2 text-xs mb-1">
                    <a href={doc.filePath} target="_blank" className="text-cyan-700 underline font-bold">
                      {doc.type.replace(/_/g," ")} v{doc.version}
                    </a> ({new Date(doc.uploadedAt).toLocaleDateString()})
                  </li>
                )}
              </ul>
              <div className="mt-4">
                <div className="font-bold mb-1">Firmas digitales</div>
                <ul>
                  {docs.signatures.map(sig =>
                    <li key={sig.id} className="mb-1 text-xs">
                      {sig.type}: {sig.status}
                      {sig.mifielId && (
                        <a href={`https://app.mifiel.com/documents/${sig.mifielId}`} target="_blank" className="ml-2 underline text-cyan-700">MiFiel</a>
                      )}
                    </li>
                  )}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
