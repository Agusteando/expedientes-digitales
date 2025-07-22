
"use client";
import { CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { stepsExpediente } from "../stepMetaExpediente";

/**
 * Shows expediente completion status for empleado/candidato (not admin).
 * Lists missing items if any, else marks complete!
 */
export default function StepExpedienteSummary({ checklist, fichaFields, plantelSelected }) {
  // Checklist is array of {type, fulfilled}, fichaFields is object with relevant keys
  const stepsUser = stepsExpediente.filter(s => !s.adminUploadOnly && !s.isPlantelSelection);
  const requiredTypes = stepsUser.map(s => s.key);

  const fichaKeys = [
    "rfc", "curp", "domicilioFiscal", "fechaIngreso", "puesto", "sueldo", "horarioLaboral", "plantelId"
  ];
  const fichaMissing = fichaKeys.filter(key => !fichaFields[key] || String(fichaFields[key]).trim().length === 0);

  const missingChecklist = requiredTypes.filter(
    t => !checklist.find(item => item.type === t && item.fulfilled)
  );

  const allComplete = fichaMissing.length === 0 && missingChecklist.length === 0 && plantelSelected;

  // Human-friendly label for keys
  function labelFor(k) {
    const map = {
      rfc: "RFC",
      curp: "CURP",
      domicilioFiscal: "Domicilio fiscal",
      fechaIngreso: "Fecha de ingreso",
      puesto: "Puesto",
      sueldo: "Sueldo",
      horarioLaboral: "Horario laboral",
      plantelId: "Plantel asignado"
    };
    return map[k] || k.replace(/_/g, " ");
  }

  return (
    <div className="flex flex-col gap-5 items-center justify-center w-full min-h-[320px] py-6 px-3 sm:px-6">
      {allComplete ? (
        <div className="flex flex-col items-center gap-3">
          <CheckCircleIcon className="w-16 h-16 text-emerald-500 mb-2" />
          <h2 className="text-2xl font-bold text-emerald-900 mb-1 text-center">¡Expediente completo!</h2>
          <p className="text-cyan-700 text-base text-center">
            Felicidades, has concluido exitosamente tu expediente digital.<br />
            Nuestro equipo revisará tus documentos y validará tu información. Puedes descargar tus archivos o regresar y actualizar algún dato cuando lo requieras.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <ExclamationTriangleIcon className="w-12 h-12 text-yellow-400 mb-2" />
          <h2 className="text-lg font-bold text-yellow-800 mb-1 text-center">Tu expediente aún no está completo</h2>
          <p className="text-slate-700 text-base text-center">
            Para finalizar tu expediente digital, asegúrate de completar los siguientes pasos:
          </p>
          <ul className="font-medium text-red-600 text-base mt-3 flex flex-col gap-2">
            {fichaMissing.map((k) => (
              <li key={k}>— Falta: <span className="font-bold">{labelFor(k)}</span></li>
            ))}
            {missingChecklist.map((type) => {
              const step = stepsUser.find(s => s.key === type);
              return (
                <li key={type}>— Falta: <span className="font-bold">{step?.label || type.replace(/_/g," ")}</span></li>
              );
            })}
            {!plantelSelected && (
              <li key="plantel">— Falta: <span className="font-bold">Seleccionar Plantel</span></li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
