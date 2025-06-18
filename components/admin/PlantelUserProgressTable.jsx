
"use client";
import { useState } from "react";
import { CheckCircleIcon, XCircleIcon, ClockIcon, DocumentMagnifyingGlassIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import UserDocsDrawer from "./UserDocsDrawer";
import UserFichaTecnicaDrawer from "./UserFichaTecnicaDrawer";
import { stepsExpediente } from "../stepMetaExpediente";

function fichaProgress(user) {
  // Returns {filled: n, total: n}
  const fields = [
    user.rfc, user.curp, user.domicilioFiscal, user.fechaIngreso, user.puesto, user.sueldo, user.horarioLaboral, user.plantelId
  ];
  return {
    filled: fields.filter(f => !!f && f !== "").length,
    total: fields.length
  };
}
function checklistProgress(user) {
  const required = stepsExpediente.filter(s => !s.signable && !s.isPlantelSelection).map(s => s.key);
  const completed = user.checklistItems?.filter(item => item.fulfilled && required.includes(item.type)).length || 0;
  return { completed, total: required.length };
}
function signatureStatus(employee, type) {
  const sig = (employee.signatures || []).find(s => s.type === type);
  if (!sig) return "pending";
  if (["completed", "signed"].includes(sig.status)) return "signed";
  if (sig.status === "rejected") return "rejected";
  return "pending";
}
function SignatureChip({ status, label }) {
  if (status === "signed")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs"><CheckCircleIcon className="w-4 h-4" />{label}</span>;
  if (status === "pending")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs"><ClockIcon className="w-4 h-4" />{label}</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 text-xs"><XCircleIcon className="w-4 h-4" />{label}</span>;
}

// Overlay/inline
export default function PlantelUserProgressTable({ users, plantelName, onClose }) {
  const [docsUser, setDocsUser] = useState(null);
  const [fichaUser, setFichaUser] = useState(null);

  return (
    <div className="absolute left-0 top-0 w-full h-full min-h-[340px] md:min-h-[420px] bg-white/98 border-t-2 border-cyan-200 pt-8 px-2 sm:px-6 flex flex-col shadow-2xl animate-fade-in z-40">
      <div className="flex items-center justify-between mb-5">
        <span className="font-bold text-lg text-cyan-700">Resumen de: {plantelName}</span>
        <button className="text-xs font-bold px-4 py-2 rounded-full border border-cyan-300 shadow bg-white hover:bg-cyan-50"
          onClick={onClose}>Cerrar</button>
      </div>
      <div className="overflow-x-auto border rounded-xl mb-2 bg-slate-50">
        <table className="min-w-[700px] w-full table-auto text-xs md:text-sm">
          <thead>
            <tr className="bg-cyan-100">
              <th className="px-2 py-2">Foto</th>
              <th className="px-2 py-2">Nombre</th>
              <th className="px-2 py-2">Rol</th>
              <th className="px-2 py-2">Ficha técnica</th>
              <th className="px-2 py-2">Checklist docs</th>
              <th className="px-2 py-2">Reglamento</th>
              <th className="px-2 py-2">Contrato</th>
              <th className="px-2 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const fichaP = fichaProgress(u);
              const checklistP = checklistProgress(u);
              const reglamentoS = signatureStatus(u, "reglamento");
              const contratoS = signatureStatus(u, "contrato");
              return (
                <tr key={u.id} className="bg-white border-b border-cyan-50">
                  <td className="px-2 py-2">
                    <Image src={u.picture || "/IMAGOTIPO-IECS-IEDIS.png"} width={34} height={34} alt="" className="rounded-full border bg-slate-100" />
                  </td>
                  <td className="px-2 py-2 font-bold text-cyan-900">{u.name}<div className="text-xs text-slate-400">{u.email}</div></td>
                  <td className="px-2 py-2">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${u.role === "employee" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-cyan-100 text-cyan-800 border border-cyan-200"}`}>
                      {u.role === "employee" ? "Empleado" : "Candidato"}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex flex-col gap-0.5 items-start">
                      <span className="font-mono text-xs">{fichaP.filled}/{fichaP.total}</span>
                      <div className="flex w-20 h-2 rounded-full bg-cyan-100 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${fichaP.filled===fichaP.total?"bg-emerald-400":"bg-cyan-400"}`} style={{width: `${Math.round((fichaP.filled/fichaP.total)*100)}%`}} />
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex flex-col gap-0.5 items-start">
                      <span className="font-mono text-xs">{checklistP.completed}/{checklistP.total}</span>
                      <div className="flex w-20 h-2 rounded-full bg-cyan-100 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${checklistP.completed===checklistP.total?"bg-emerald-400":"bg-cyan-400"}`} style={{width: `${Math.round((checklistP.completed/checklistP.total)*100)}%`}} />
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <SignatureChip status={reglamentoS} label="Regl." />
                  </td>
                  <td className="px-2 py-2">
                    <SignatureChip status={contratoS} label="Cont." />
                  </td>
                  <td className="px-2 py-2 flex flex-row gap-2">
                    <button className="p-1.5 rounded-full bg-cyan-50 hover:bg-cyan-200 transition"
                      onClick={() => setDocsUser(u)}
                      title="Expediente / checklist"
                    ><DocumentMagnifyingGlassIcon className="w-5 h-5 text-cyan-700" /></button>
                    <button className="p-1.5 rounded-full bg-fuchsia-50 hover:bg-fuchsia-200 transition"
                      onClick={() => setFichaUser(u)}
                      title="Ficha técnica"
                    ><ClipboardDocumentListIcon className="w-5 h-5 text-fuchsia-700" /></button>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 &&
              <tr><td colSpan={8} className="py-6 text-center text-slate-400">No hay usuarios asignados.</td></tr>}
          </tbody>
        </table>
      </div>
      <UserDocsDrawer open={!!docsUser} user={docsUser} onClose={() => setDocsUser(null)} />
      <UserFichaTecnicaDrawer open={!!fichaUser} user={fichaUser} onClose={() => setFichaUser(null)} />
    </div>
  );
}
