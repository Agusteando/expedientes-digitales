
"use client";

import { useState } from "react";
import Image from "next/image";
import { UserPlusIcon, CheckCircleIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import PrivacyStep from "@/components/PrivacyStep";

// Password validation/check helper
function validatePassword(password) {
  return !!password && password.length >= 7;
}

// CURP regex (official+2024): 4 letters, 2 digits (YY), month MM, day DD, gender, state, 3 consonants, [A-Z0-9] year sign, check digit
function validCurp(curp) {
  const regex =
    /^[A-Z]{4}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$/i;
  return regex.test(curp ?? "");
}

// Registration Form Step
function RegisterFormStep({ disabled }) {
  const [form, setForm] = useState({
    apellidoPaterno: "",
    apellidoMaterno: "",
    nombres: "",
    email: "",
    password: "",
    password2: "",
    curp: "",
    rfc: "",
  });
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
      case "apellidoPaterno":
        if (!val) return "El apellido paterno es obligatorio.";
        if (val.trim().length < 2) return "Debe contener al menos 2 caracteres.";
        return "";
      case "nombres":
        if (!val) return "El(los) nombre(s) es obligatorio.";
        if (val.trim().length < 2) return "Debe contener al menos 2 caracteres.";
        return "";
      case "apellidoMaterno":
        if (!val) return "El apellido materno es obligatorio.";
        if (val.trim().length < 2) return "Debe contener al menos 2 caracteres.";
        return "";
      case "email":
        if (!val) return "El correo electrónico es obligatorio.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "El correo electrónico no es válido.";
        return "";
      case "curp":
        if (!val) return "El CURP es obligatorio.";
        if (val.length !== 18) return "El CURP debe tener exactamente 18 caracteres.";
        if (!validCurp(val || ""))
          return "El CURP no tiene un formato válido. Ejemplo: GOMC960912HDFRRL04, SASN040606MMCNNTA8, o AARA000311MMCLDNB0";
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

  const localFieldErrors = {
    apellidoPaterno: fieldError("apellidoPaterno"),
    apellidoMaterno: fieldError("apellidoMaterno"),
    nombres: fieldError("nombres"),
    email: fieldError("email"),
    curp: fieldError("curp"),
    rfc: fieldError("rfc"),
    password: fieldError("password"),
    password2: fieldError("password2"),
  };

  function displayFieldError(field) {
    if (fieldErrors && fieldErrors[field]) return fieldErrors[field];
    if (touched[field] && localFieldErrors[field]) return localFieldErrors[field];
    return "";
  }

  function formChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setServerTopError("");
    setFieldErrors(errors => ({ ...errors, [e.target.name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerTopError("");
    setSuccess("");
    setTouched({
      apellidoPaterno: true,
      apellidoMaterno: true,
      nombres: true,
      email: true,
      password: true,
      password2: true,
      curp: true,
      rfc: true,
    });
    const firstErrorField = Object.keys(localFieldErrors).find(
      (key) => localFieldErrors[key]
    );
    if (firstErrorField) {
      setFieldErrors({});
      setServerTopError(
        localFieldErrors[firstErrorField] || "Por favor corrige los errores."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apellidoPaterno: form.apellidoPaterno,
          apellidoMaterno: form.apellidoMaterno,
          nombres: form.nombres,
          email: form.email,
          password: form.password,
          curp: form.curp,
          rfc: form.rfc,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data && data.errors) {
          setFieldErrors(data.errors);
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

  const passwordReq =
    "La contraseña debe tener al menos 7 caracteres. Puede contener letras, números, signos o símbolos.";

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
      <form className="flex flex-col gap-3" onSubmit={handleSubmit} autoComplete="off" noValidate>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1" htmlFor="apellidoPaterno">
              Apellido paterno
            </label>
            <input
              className={`block w-full rounded-lg border px-3 py-3 text-sm focus:outline-none focus:ring-2 transition ${
                displayFieldError("apellidoPaterno")
                  ? "border-red-400 dark:border-red-500 ring-2 ring-red-200"
                  : "border-gray-200 dark:border-gray-700 focus:ring-cyan-500"
              } bg-white dark:bg-gray-800 placeholder-gray-400 dark:text-white`}
              id="apellidoPaterno"
              name="apellidoPaterno"
              autoComplete="family-name"
              required
              value={form.apellidoPaterno}
              onChange={formChange}
              onBlur={() => markTouched("apellidoPaterno")}
              placeholder="Ej. Ramírez"
              aria-invalid={!!displayFieldError("apellidoPaterno")}
            />
            {displayFieldError("apellidoPaterno") && (
              <div className="text-xs text-red-600 mt-1">
                {displayFieldError("apellidoPaterno")}
              </div>
            )}
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1" htmlFor="apellidoMaterno">
              Apellido materno
            </label>
            <input
              className={`block w-full rounded-lg border px-3 py-3 text-sm focus:outline-none focus:ring-2 transition ${
                displayFieldError("apellidoMaterno")
                  ? "border-red-400 dark:border-red-500 ring-2 ring-red-200"
                  : "border-gray-200 dark:border-gray-700 focus:ring-cyan-500"
              } bg-white dark:bg-gray-800 placeholder-gray-400 dark:text-white`}
              id="apellidoMaterno"
              name="apellidoMaterno"
              autoComplete="additional-name"
              required
              value={form.apellidoMaterno}
              onChange={formChange}
              onBlur={() => markTouched("apellidoMaterno")}
              placeholder="Ej. Cortés"
              aria-invalid={!!displayFieldError("apellidoMaterno")}
            />
            {displayFieldError("apellidoMaterno") && (
              <div className="text-xs text-red-600 mt-1">
                {displayFieldError("apellidoMaterno")}
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1" htmlFor="nombres">
            Nombre(s)
          </label>
          <input
            className={`block w-full rounded-lg border px-3 py-3 text-sm focus:outline-none focus:ring-2 transition ${
              displayFieldError("nombres")
                ? "border-red-400 dark:border-red-500 ring-2 ring-red-200"
                : "border-gray-200 dark:border-gray-700 focus:ring-cyan-500"
            } bg-white dark:bg-gray-800 placeholder-gray-400 dark:text-white`}
            id="nombres"
            name="nombres"
            autoComplete="given-name"
            required
            value={form.nombres}
            onChange={formChange}
            onBlur={() => markTouched("nombres")}
            placeholder="Ej. Ana Paula"
            aria-invalid={!!displayFieldError("nombres")}
          />
          {displayFieldError("nombres") && (
            <div className="text-xs text-red-600 mt-1">
              {displayFieldError("nombres")}
            </div>
          )}
        </div>
        <div>
          <label
            className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1"
            htmlFor="email"
          >
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
            <div className="text-xs text-red-600 mt-1">
              {displayFieldError("email")}
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label
              className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1"
              htmlFor="curp"
            >
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
              <div className="text-xs text-red-600 mt-1">
                {displayFieldError("curp")}
              </div>
            )}
          </div>
          <div className="flex-1">
            <label
              className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1"
              htmlFor="rfc"
            >
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
              <div className="text-xs text-red-600 mt-1">
                {displayFieldError("rfc")}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label
              className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1"
              htmlFor="password"
            >
              Contraseña
            </label>
            <div className="relative flex items-center">
              <input
                className={`block w-full rounded-lg border px-3 py-3 text-sm focus:outline-none focus:ring-2 transition pr-10 ${
                  displayFieldError("password")
                    ? "border-red-400 dark:border-red-500 ring-2 ring-red-200"
                    : validatePassword(form.password) && form.password
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
                    ? validatePassword(form.password)
                      ? "text-emerald-600 flex items-center gap-1"
                      : "text-red-600 font-medium"
                    : "text-gray-500"
                }`}
              >
                {validatePassword(form.password) ? (
                  <span className="flex items-center gap-1">
                    <CheckCircleIcon className="w-4 h-4" /> Requisito de contraseña cumplido
                  </span>
                ) : (
                  passwordReq
                )}
              </div>
            </div>
            {displayFieldError("password") && (
              <div className="text-xs text-red-600 mt-1">
                {displayFieldError("password")}
              </div>
            )}
          </div>
          <div className="flex-1">
            <label
              className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1"
              htmlFor="password2"
            >
              Repetir contraseña
            </label>
            <div className="relative flex items-center">
              <input
                className={`block w-full rounded-lg border px-3 py-3 text-sm focus:outline-none focus:ring-2 transition pr-10 ${
                  displayFieldError("password2")
                    ? "border-red-400 dark:border-red-500 ring-2 ring-red-200"
                    : !!form.password && !!form.password2 && form.password === form.password2
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
                form.password === form.password2 ? (
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
              <div className="text-xs text-red-600 mt-1">
                {displayFieldError("password2")}
              </div>
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
        <span className="text-gray-500 dark:text-gray-400 mb-1">
          ¿Ya tienes cuenta?
        </span>
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
