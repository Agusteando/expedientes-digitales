
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { UserPlusIcon, CheckCircleIcon, DocumentTextIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";

// Privacy Notice Step Component
function PrivacyStep({ onAccept }) {
  const [isBottom, setIsBottom] = useState(false);
  const [checked, setChecked] = useState(false);
  const contentRef = useRef(null);

  // Handle scroll detection
  const handleScroll = () => {
    const el = contentRef.current;
    if (el) {
      const isScrolled =
        el.scrollHeight - el.scrollTop <= el.clientHeight + 1;
      setIsBottom(isScrolled);
    }
  };

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
      return () => el.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Callback to parent whenever acceptance state changes
  useEffect(() => {
    onAccept(isBottom && checked);
    // eslint-disable-next-line
  }, [isBottom, checked]);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full max-w-lg shadow-lg rounded-xl px-2 pt-2 pb-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 py-4 px-2 border-b border-gray-100 dark:border-gray-800 mb-2">
          <DocumentTextIcon className="w-7 h-7 text-cyan-500" />
          <span className="text-lg font-bold dark:text-white text-gray-900">
            Aviso de Privacidad
          </span>
        </div>
        <div
          ref={contentRef}
          className="overflow-y-auto max-h-[55vh] px-4 pr-6 py-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800 scroll-smooth text-sm text-gray-700 dark:text-gray-300 leading-relaxed text-justify"
          tabIndex={0}
        >
          {/* [omitted as in original] */}
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 dark:text-white mb-6">
            Aviso de Privacidad Integral
          </h1>
          <p className="mb-4">
            El <strong>Instituto Educativo Para el Desarrollo Integral del Saber S.C.</strong>, con
            domicilio fiscal en Avenida 5 número 532, Colonia San José La Pilita, Metepec, Estado de
            México, Código Postal 52149, y el <strong>Instituto Educativo La Casita del Saber
            S.C.</strong>, con domicilio fiscal en Calle España número 8, Colonia San Mateo
            Oxtotitlán, Toluca, Estado de México, Código Postal 50100, actúan de manera conjunta como
            responsables del tratamiento de los datos personales recabados a través de la plataforma
            digital para la integración de expedientes laborales de colaboradores y candidatos, en
            adelante, los Responsables. Este aviso se emite en cumplimiento de lo dispuesto por la
            <em>Ley Federal de Protección de Datos Personales en Posesión de los Particulares</em>,
            su Reglamento y los Lineamientos del Aviso de Privacidad.
          </p>
          <h2 className="text-xl font-semibold mt-5 mb-2 text-gray-900 dark:text-white">
            Finalidades del tratamiento de los datos personales
          </h2>
          <p className="mb-2">
            Los datos personales se tratarán para finalidades primarias vinculadas directamente con la
            relación jurídica entre el titular y los Responsables, tales como el registro, evaluación,
            alta y contratación de personal; la integración, actualización y conservación del
            expediente laboral; la gestión de procesos internos en materia de recursos humanos,
            nómina, prestaciones y cumplimiento normativo; la evaluación médica, psicológica y de
            competencias laborales, así como el cumplimiento de obligaciones legales en materia
            laboral, fiscal, de seguridad social y administrativa. Asimismo, y previa autorización del
            titular, los datos podrán ser utilizados para fines secundarios consistentes en la
            difusión de actividades institucionales, académicas, formativas y de bienestar laboral,
            sin que ello afecte la relación jurídica con los Responsables.
          </p>
          <h2 className="text-xl font-semibold mt-5 mb-2 text-gray-900 dark:text-white">
            Datos personales recabados
          </h2>
          <p className="mb-2">
            Los datos recabados comprenden información de identificación y contacto, como nombre
            completo, domicilio, CURP, RFC con homoclave, correo electrónico, número telefónico,
            firma, fotografía y credencial para votar; datos académicos y laborales, tales como
            currículum vitae, certificados, constancias, diplomas, contrato de trabajo, puesto,
            horario y salario. Asimismo, se recaban datos personales sensibles en términos de la ley,
            los cuales requieren consentimiento expreso para su tratamiento. Estos incluyen
            certificados médicos, antecedentes penales, número de seguridad social, datos
            biométricos, resultados de análisis clínicos y evaluaciones psicométricas o proyectivas.
          </p>
          <h2 className="text-xl font-semibold mt-5 mb-2 text-gray-900 dark:text-white">
            Fundamento legal del tratamiento
          </h2>
          <p className="mb-2">
            El tratamiento de los datos personales se realiza conforme a lo previsto por la
            <em>Ley Federal de Protección de Datos Personales en Posesión de los Particulares</em>,
            su Reglamento, la <em>Ley Federal del Trabajo</em>, el <em>Código Fiscal de la
            Federación</em>, así como las demás disposiciones fiscales, laborales, administrativas y
            de seguridad social que resulten aplicables.
          </p>
          <h2 className="text-xl font-semibold mt-5 mb-2 text-gray-900 dark:text-white">
            Transferencias de datos personales
          </h2>
          <p className="mb-2">
            Los datos personales podrán ser transferidos, sin necesidad de requerir el consentimiento
            del titular, en los casos legalmente previstos, particularmente a autoridades
            administrativas, fiscales, laborales o educativas que los soliciten en ejercicio de sus
            atribuciones legales. También podrán compartirse con terceros que presten servicios
            profesionales de evaluación médica o psicológica, bajo condiciones estrictas de
            confidencialidad y protección de datos.
          </p>
          <h2 className="text-xl font-semibold mt-5 mb-2 text-gray-900 dark:text-white">
            Medios para ejercer los derechos ARCO
          </h2>
          <p className="mb-2">
            El titular podrá ejercer en cualquier momento sus derechos de acceso, rectificación,
            cancelación y oposición (ARCO), así como revocar el consentimiento otorgado, mediante la
            entrega de escrito libre en cualquiera de los domicilios fiscales previamente señalados.
            La solicitud deberá contener nombre completo del titular, medio para recibir la respuesta,
            copia de una identificación oficial vigente, descripción clara del derecho que se desea
            ejercer y, en su caso, los documentos que acrediten la representación legal
            correspondiente. La respuesta será emitida dentro de los plazos establecidos por los
            artículos 32 al 36 de la <em>Ley Federal de Protección de Datos Personales en Posesión
            de los Particulares</em>.
          </p>
          <h2 className="text-xl font-semibold mt-5 mb-2 text-gray-900 dark:text-white">
            Conservación de los datos personales
          </h2>
          <p className="mb-2">
            Los datos personales serán conservados durante el tiempo que subsista la relación jurídica
            entre el titular y los Responsables, y posteriormente, por un periodo mínimo de cinco
            años, conforme a lo previsto por el artículo 804 de la <em>Ley Federal del
            Trabajo</em>, el <em>Código Fiscal de la Federación</em> y demás normatividad en materia
            de conservación documental. Una vez cumplido dicho plazo, y en ausencia de impedimento
            legal, los datos serán eliminados o anonimizados conforme a las políticas internas de los
            Responsables.
          </p>
          <h2 className="text-xl font-semibold mt-5 mb-2 text-gray-900 dark:text-white">
            Uso de tecnologías de rastreo en medios digitales
          </h2>
          <p className="mb-2">
            Los Responsables informan que la plataforma digital utilizada para la integración de
            expedientes laborales puede hacer uso de tecnologías de rastreo como cookies, web beacons
            u otras tecnologías similares, a través de las cuales se recaba información de manera
            automática y simultánea al uso de los servicios electrónicos. Estas tecnologías permiten
            identificar el comportamiento del usuario dentro del portal, optimizar la experiencia y
            generar estadísticas del uso del sistema. En caso de que dichas tecnologías llegasen a
            recabar datos personales identificables, los mismos serán tratados conforme a las
            finalidades y medidas de seguridad previstas en el presente aviso, sin que se realicen
            transferencias no autorizadas. El usuario puede, en todo momento, deshabilitar o ajustar
            el uso de cookies mediante la configuración de su navegador o sistema operativo. Para
            mayor información sobre estas tecnologías, así como para ejercer sus derechos de acceso,
            rectificación, cancelación u oposición, podrá consultar el presente aviso o dirigirse a
            los medios de contacto proporcionados.
          </p>
          <h2 className="text-xl font-semibold mt-5 mb-2 text-gray-900 dark:text-white">
            Medidas de seguridad implementadas
          </h2>
          <p className="mb-2">
            Los Responsables han implementado medidas de seguridad administrativas, técnicas y físicas
            suficientes para garantizar la integridad, confidencialidad y disponibilidad de los datos
            personales, conforme al principio de seguridad previsto por la ley, a fin de evitar su
            daño, pérdida, alteración, destrucción o acceso no autorizado.
          </p>
          <h2 className="text-xl font-semibold mt-5 mb-2 text-gray-900 dark:text-white">
            Modificaciones al aviso de privacidad
          </h2>
          <p className="mb-2">
            Este aviso podrá ser modificado en cualquier momento para dar cumplimiento a nuevas
            disposiciones legales o políticas internas. Cualquier modificación será comunicada
            mediante la misma plataforma digital utilizada por los Responsables o a través de medios
            institucionales electrónicos.
          </p>
          <h2 className="text-xl font-semibold mt-5 mb-2 text-gray-900 dark:text-white">
            Consentimiento expreso del titular para datos sensibles y finalidades secundarias
          </h2>
          <p className="mb-2">
            Otorgo mi consentimiento expreso para el tratamiento de los datos personales sensibles
            descritos en el presente aviso, así como para el uso de mis datos personales con fines
            informativos, institucionales o de bienestar laboral.
          </p>
        </div>
        <form
          className="flex flex-col items-center gap-2 mt-4 px-2"
          onSubmit={e => {
            e.preventDefault();
            if (isBottom && checked) onAccept(true);
          }}
        >
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 select-none">
            <input
              type="checkbox"
              disabled={!isBottom}
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              className="form-checkbox rounded text-cyan-600 border-gray-300 focus:ring-cyan-500"
              required
            />
            He leído hasta el final y ACEPTO el aviso de privacidad y tratamiento de datos.
          </label>
          <button
            type="submit"
            className={`mt-5 w-full px-6 py-3 rounded-lg font-bold bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed ${
              isBottom && checked
                ? "hover:from-cyan-700 hover:to-teal-600 focus:ring-4 focus:ring-cyan-200 dark:focus:ring-cyan-800"
                : ""
            }`}
            disabled={!(isBottom && checked)}
          >
            <span className="flex items-center gap-1 justify-center">
              <CheckCircleIcon className="w-5 h-5" /> Acepto y continuar
            </span>
          </button>
          <span
            className={`block w-full text-xs text-center ${
              isBottom
                ? "text-green-600 font-semibold"
                : "text-gray-500 mt-2"
            }`}
          >
            {isBottom
              ? "Ahora puedes aceptar y continuar."
              : "Desplázate hasta el final para activar el botón."}
          </span>
        </form>
      </div>
    </div>
  );
}

// Password validation/check helper
function validatePassword(password) {
  return !!password && password.length >= 7;
}

// Registration Form Step
function RegisterFormStep({ disabled }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password2: "",
    curp: "",
    rfc: ""
  });
  // Separate error states for: local-validation errors, API-field errors, top-level error
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverTopError, setServerTopError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const router = useRouter();

  const [touched, setTouched] = useState({});
  const markTouched = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

  // LOCAL FIELD VALIDATION
  function fieldError(field, value = undefined) {
    const val = value !== undefined ? value : form[field];
    switch (field) {
      case "name":
        if (!val) return "El nombre es obligatorio.";
        if (val.trim().length < 2) return "Tu nombre debe contener al menos 2 caracteres.";
        return "";
      case "email":
        if (!val) return "El correo electrónico es obligatorio.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "El correo electrónico no es válido.";
        return "";
      case "curp":
        if (!val) return "El CURP es obligatorio.";
        if (val.length !== 18) return "El CURP debe tener exactamente 18 caracteres.";
        if (!/^[A-Z]{4}\d{6}[A-Z]{6}\d{2}$/.test((val || "").toUpperCase()))
          return "El CURP no tiene un formato válido.";
        return "";
      case "rfc":
        if (!val) return "El RFC es obligatorio.";
        if (val.length < 12 || val.length > 13)
          return "El RFC debe tener entre 12 y 13 caracteres.";
        if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test((val || "").toUpperCase()))
          return "El RFC no tiene un formato válido.";
        return "";
      case "password":
        if (!val) return "La contraseña es obligatoria.";
        if (val.length < 7) return "La contraseña debe tener al menos 7 caracteres.";
        return "";
      case "password2":
        if (!val) return "Repite la contraseña.";
        if (val !== form.password) return "Las contraseñas no coinciden.";
        return "";
      default:
        return "";
    }
  }

  // Build errors object for client side
  const localFieldErrors = {
    name: fieldError("name"),
    email: fieldError("email"),
    curp: fieldError("curp"),
    rfc: fieldError("rfc"),
    password: fieldError("password"),
    password2: fieldError("password2"),
  };

  // Compose display error for field: API error > client validation
  function displayFieldError(field) {
    // If server returned this error, show it (most important), otherwise show local validation error if touched
    if (fieldErrors && fieldErrors[field]) return fieldErrors[field];
    if (touched[field] && localFieldErrors[field]) return localFieldErrors[field];
    return "";
  }

  function formChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setServerTopError("");
    // Remove API error for this field as user edits (to force revalidation/fresh state)
    setFieldErrors(errors => ({ ...errors, [e.target.name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerTopError("");
    setSuccess("");
    setTouched({
      name: true,
      email: true,
      password: true,
      password2: true,
      curp: true,
      rfc: true,
    });
    // Find first error
    const firstErrorField = Object.keys(localFieldErrors).find((key) => localFieldErrors[key]);
    if (firstErrorField) {
      // Show immediate error visually under field, remove stale API errors
      setFieldErrors({});
      setServerTopError(localFieldErrors[firstErrorField] || "Por favor corrige los errores.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          curp: form.curp,
          rfc: form.rfc,
        })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data && data.errors) {
          // Set each field error (show at field level)
          setFieldErrors(data.errors);
          // If any general or multiple errors, show a summary at top with priority: either first field error, or a count
          const errorSummary =
            Object.values(data.errors).length === 1
              ? Object.values(data.errors)[0]
              : "Corrige los datos marcados y vuelve a intentarlo.";
          setServerTopError(errorSummary);
        } else if (data && data.error) {
          setServerTopError(data.error);
        } else {
          setServerTopError("Error en el servidor. Intenta de nuevo.");
        }
        setLoading(false);
        return;
      }
      setSuccess("Registro exitoso, puedes iniciar sesión.");
      setFieldErrors({});
      setServerTopError("");
      setTimeout(() => router.push("/login"), 1400);
    } catch (e) {
      setServerTopError("No se pudo conectar con el servidor. Intenta de nuevo.");
      setLoading(false);
    }
  }

  // Password requirement UI
  const passwordReq =
    "La contraseña debe tener al menos 7 caracteres. Puede contener letras, números, signos o símbolos.";

  const passwordValid = validatePassword(form.password);
  const passwordsMatch = !!form.password && !!form.password2 && form.password === form.password2;

  return (
    <div
      className={`w-full max-w-md mx-auto bg-white/90 dark:bg-gray-900 shadow-xl rounded-xl md:rounded-2xl px-5 py-8 md:px-10 md:py-12 border border-gray-100 dark:border-gray-800 transition ${
        disabled ? "pointer-events-none opacity-70 select-none blur-sm" : ""
      }`}
    >
      <div className="w-full flex flex-col items-center mb-6">
        <div className="relative h-14 w-14 rounded-lg bg-white shadow-lg mb-4">
          <Image
            src="/IMAGOTIPO-IECS-IEDIS.png"
            alt="IECS-IEDIS"
            fill
            className="object-contain rounded-lg"
            priority
          />
        </div>
        <UserPlusIcon className="w-8 h-8 text-cyan-600 mb-2" />
        <h1
          className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight"
          style={{ fontFamily: "var(--font-fredoka), sans-serif" }}
        >
          Crear tu cuenta
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Regístrate para acceder a IECS-IEDIS
        </p>
      </div>
      {serverTopError && (
        <div className="w-full mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 font-semibold text-center">
          {serverTopError}
        </div>
      )}
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} autoComplete="off" noValidate>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1" htmlFor="name">
            Nombre completo
          </label>
          <input
            className={`block w-full rounded-lg border px-3 py-3 text-sm focus:outline-none focus:ring-2 transition ${
              displayFieldError("name")
                ? "border-red-400 dark:border-red-500 ring-2 ring-red-200"
                : "border-gray-200 dark:border-gray-700 focus:ring-cyan-500"
            } bg-white dark:bg-gray-800 placeholder-gray-400 dark:text-white`}
            id="name"
            name="name"
            autoComplete="name"
            required
            value={form.name}
            onChange={formChange}
            onBlur={() => markTouched("name")}
            placeholder="Ingresa tu nombre"
            aria-invalid={!!displayFieldError("name")}
          />
          {displayFieldError("name") && (
            <div className="text-xs text-red-600 mt-1">{displayFieldError("name")}</div>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1" htmlFor="email">
            Correo electrónico
          </label>
          <input
            className={`block w-full rounded-lg border px-3 py-3 text-sm focus:outline-none focus:ring-2 transition ${
              displayFieldError("email")
                ? "border-red-400 dark:border-red-500 ring-2 ring-red-200"
                : "border-gray-200 dark:border-gray-700 focus:ring-cyan-500"
            } bg-white dark:bg-gray-800 placeholder-gray-400 dark:text-white`}
            id="email"
            name="email"
            autoComplete="email"
            type="email"
            required
            value={form.email}
            onChange={formChange}
            onBlur={() => markTouched("email")}
            placeholder="ejemplo@dominio.com"
            aria-invalid={!!displayFieldError("email")}
          />
          {displayFieldError("email") && (
            <div className="text-xs text-red-600 mt-1">{displayFieldError("email")}</div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1" htmlFor="curp">
              CURP
            </label>
            <input
              className={`block w-full rounded-lg border px-3 py-3 text-sm uppercase tracking-wide focus:outline-none focus:ring-2 transition ${
                displayFieldError("curp")
                  ? "border-red-400 dark:border-red-500 ring-2 ring-red-200"
                  : "border-gray-200 dark:border-gray-700 focus:ring-cyan-500"
              } bg-white dark:bg-gray-800 placeholder-gray-400 dark:text-white`}
              id="curp"
              name="curp"
              autoComplete="off"
              required
              minLength={18}
              maxLength={18}
              value={form.curp}
              onChange={formChange}
              onBlur={() => markTouched("curp")}
              placeholder="GOMC960912HDFRRL04"
              aria-invalid={!!displayFieldError("curp")}
            />
            {displayFieldError("curp") && (
              <div className="text-xs text-red-600 mt-1">{displayFieldError("curp")}</div>
            )}
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1" htmlFor="rfc">
              RFC
            </label>
            <input
              className={`block w-full rounded-lg border px-3 py-3 text-sm uppercase tracking-wide focus:outline-none focus:ring-2 transition ${
                displayFieldError("rfc")
                  ? "border-red-400 dark:border-red-500 ring-2 ring-red-200"
                  : "border-gray-200 dark:border-gray-700 focus:ring-cyan-500"
              } bg-white dark:bg-gray-800 placeholder-gray-400 dark:text-white`}
              id="rfc"
              name="rfc"
              autoComplete="off"
              required
              minLength={12}
              maxLength={13}
              value={form.rfc}
              onChange={formChange}
              onBlur={() => markTouched("rfc")}
              placeholder="GOMC960912QX2"
              aria-invalid={!!displayFieldError("rfc")}
            />
            {displayFieldError("rfc") && (
              <div className="text-xs text-red-600 mt-1">{displayFieldError("rfc")}</div>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1" htmlFor="password">
              Contraseña
            </label>
            <div className="relative flex items-center">
              <input
                className={`block w-full rounded-lg border px-3 py-3 text-sm focus:outline-none focus:ring-2 transition pr-10 ${
                  displayFieldError("password")
                    ? "border-red-400 dark:border-red-500 ring-2 ring-red-200"
                    : passwordValid && form.password
                    ? "border-emerald-400 dark:border-emerald-400 focus:ring-emerald-400"
                    : "border-gray-200 dark:border-gray-700 focus:ring-cyan-500"
                } bg-white dark:bg-gray-800 placeholder-gray-400 dark:text-white`}
                id="password"
                name="password"
                autoComplete="new-password"
                type={showPassword ? "text" : "password"}
                required
                value={form.password}
                onChange={formChange}
                onBlur={() => markTouched("password")}
                placeholder="••••••••"
                aria-invalid={!!displayFieldError("password")}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={showPassword ? "Ocultar" : "Mostrar"}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-2.5 text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-300 z-10 focus:outline-none"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            <div className="mt-1 flex flex-row items-center gap-2">
              <div
                className={`text-xs ${
                  form.password
                    ? passwordValid
                      ? "text-emerald-600 flex items-center gap-1"
                      : "text-red-600 font-medium"
                    : "text-gray-500"
                }`}
              >
                {passwordValid ? (
                  <span className="flex items-center gap-1">
                    <CheckCircleIcon className="w-4 h-4" /> Requisito de contraseña cumplido
                  </span>
                ) : (
                  passwordReq
                )}
              </div>
            </div>
            {displayFieldError("password") && (
              <div className="text-xs text-red-600 mt-1">{displayFieldError("password")}</div>
            )}
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1" htmlFor="password2">
              Repetir contraseña
            </label>
            <div className="relative flex items-center">
              <input
                className={`block w-full rounded-lg border px-3 py-3 text-sm focus:outline-none focus:ring-2 transition pr-10 ${
                  displayFieldError("password2")
                    ? "border-red-400 dark:border-red-500 ring-2 ring-red-200"
                    : passwordsMatch && form.password2
                    ? "border-emerald-400 dark:border-emerald-400 focus:ring-emerald-400"
                    : "border-gray-200 dark:border-gray-700 focus:ring-cyan-500"
                } bg-white dark:bg-gray-800 placeholder-gray-400 dark:text-white`}
                id="password2"
                name="password2"
                autoComplete="new-password"
                type={showPassword2 ? "text" : "password"}
                required
                value={form.password2}
                onChange={formChange}
                onBlur={() => markTouched("password2")}
                placeholder="••••••••"
                aria-invalid={!!displayFieldError("password2")}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={showPassword2 ? "Ocultar" : "Mostrar"}
                onClick={() => setShowPassword2((v) => !v)}
                className="absolute right-2 top-2.5 text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-300 z-10 focus:outline-none"
              >
                {showPassword2 ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs">
              {form.password && form.password2 ? (
                passwordsMatch ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircleIcon className="w-4 h-4" />
                    Las contraseñas coinciden
                  </span>
                ) : (
                  <span className="text-red-600 font-medium">
                    Las contraseñas no coinciden.
                  </span>
                )
              ) : (
                <span className="text-gray-500">
                  Vuelve a ingresar tu contraseña.
                </span>
              )}
            </div>
            {displayFieldError("password2") && (
              <div className="text-xs text-red-600 mt-1">{displayFieldError("password2")}</div>
            )}
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 mt-2 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-700 hover:to-teal-600 focus:outline-none focus:ring-4 focus:ring-cyan-200 dark:focus:ring-cyan-800 text-white font-bold text-base shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? "Registrando..." : "Registrarme"}
        </button>
        {success && (
          <div className="w-full mt-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-sm text-teal-800 font-semibold text-center">
            {success}
          </div>
        )}
      </form>
      <div className="w-full flex flex-col items-center mt-7 text-sm">
        <span className="text-gray-500 dark:text-gray-400 mb-1">¿Ya tienes cuenta?</span>
        <a
          href="/empleado"
          className="text-cyan-700 dark:text-cyan-300 font-semibold hover:underline transition"
        >
          Iniciar sesión
        </a>
      </div>
    </div>
  );
}

// Main Stepper Component
export default function RegisterStepper() {
  const [step, setStep] = useState(0); // 0 = privacy, 1 = register

  // Stepper Controls UI
  function StepHeader() {
    return (
      <div className="flex justify-center gap-6 items-center mb-8">
        <div className="flex gap-6">
          <div
            className={`rounded-full w-8 h-8 flex items-center justify-center font-bold border-2 text-lg transition ${
              step === 0
                ? "border-cyan-600 text-cyan-600 bg-cyan-50"
                : "border-gray-200 bg-gray-50 text-gray-400 dark:bg-gray-800"
            }`}
          >
            1
          </div>
          <div
            className={`rounded-full w-8 h-8 flex items-center justify-center font-bold border-2 text-lg transition ${
              step === 1
                ? "border-cyan-600 text-cyan-600 bg-cyan-50"
                : "border-gray-200 bg-gray-50 text-gray-400 dark:bg-gray-800"
            }`}
          >
            2
          </div>
        </div>
        <div className="hidden sm:flex flex-col justify-center pl-10 leading-tight text-sm font-medium text-gray-500 dark:text-gray-400">
          <span>
            {step === 0 ? "Aviso de privacidad" : "Registro de cuenta"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col gap-0 justify-center items-center px-2 py-8 bg-gradient-to-tr from-[#fef6f0] via-[#d7f7fc] to-[#d9ffe5] dark:from-[#151a22] dark:via-[#203146] dark:to-[#23403c]">
      <StepHeader />
      <div className="w-full flex flex-col lg:flex-row items-center gap-12 justify-center">
        {step === 0 && (
          <PrivacyStep
            onAccept={ok => {
              if (ok) setStep(1);
            }}
          />
        )}
        {step === 1 && <RegisterFormStep disabled={false} />}
      </div>
    </div>
  );
}
