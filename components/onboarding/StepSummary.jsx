
export default function StepSummary({ user }) {
  return (
    <div className="flex flex-col items-center justify-center py-14">
      <div className="w-full flex flex-col items-center">
        <div className="text-emerald-700 text-xl font-black mb-3">
          ¡Has completado tu expediente!
        </div>
        <div className="text-base font-semibold text-slate-700 text-center max-w-md">
          Muchas gracias y bienvenido(a) a IECS-IEDIS.<br />
          Nos pondremos en contacto para los siguientes pasos.
        </div>
      </div>
    </div>
  );
}
