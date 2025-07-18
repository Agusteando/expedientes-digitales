
"use client";

import { useState, useRef, useEffect } from "react";
import { DocumentTextIcon, CheckCircleIcon } from "@heroicons/react/24/solid";

export default function PrivacyStep({ onAccept }) {
  const [isBottom, setIsBottom] = useState(false);
  const [checked, setChecked] = useState(false);
  const contentRef = useRef(null);

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
