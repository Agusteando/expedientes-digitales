
"use client";
import { CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { stepsExpediente } from "../stepMetaExpediente";

export default function StepExpedienteSummary({ stepStatus, user }) {
  // List only user steps (not admin-only)
  const stepsUser = stepsExpediente.filter(s => !s.adminUploadOnly && !s.isPlantelSelection && !s.isAvatar);
  const missing = stepsUser.filter(step => {
    const ss = stepStatus?.[step.key];
    // checklist may be missing/null for step, if so it's missing
    return !(ss && ss.checklist && ss.checklist.fulfilled);
  });

  const expedienteCompleto = missing.length === 0;
  return (
    <div className="flex flex-col items-center justify-center py-10 min-h-[280px]">
      {expedienteCompleto ? (
        <>
          <CheckCircleIcon className="w-16 h-16 text-emerald-500 mb-3" />
          <div className="text-emerald-800 text-2xl font-black mb-2">¡Expediente digital completo!</div>
          <div className="text-base font-semibold text-slate-700 text-center max-w-md">
            ¡Felicidades {user?.name?.split(" ")[0] || ""}!<br />
            Has concluido exitosamente tu expediente digital. Nuestro equipo revisará tus documentos y se pondrá en contacto contigo si hay observaciones.<br />
            Puedes descargar y actualizar tus archivos cuando lo requieras.
          </div>
        </>
      ) : (
        <>
          <ExclamationTriangleIcon className="w-14 h-14 text-yellow-400 mb-3" />
          <div className="text-yellow-700 text-xl font-bold mb-1 text-center">Expediente incompleto</div>
          <div className="text-base text-slate-600 font-semibold text-center">
            Para completar tu expediente digital, entrega los siguientes requisitos:
          </div>
          <ul className="text-base text-red-700 font-bold mt-3 flex flex-col gap-2">
            {missing.map(step =>
              <li key={step.key}>— {step.label}</li>
            )}
          </ul>
        </>
      )}
    </div>
  );
}
