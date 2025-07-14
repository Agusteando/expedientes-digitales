
export const stepsExpediente = [
  {
    key: "plantel",
    isPlantelSelection: true,
    label: "Selecciona tu Plantel",
    description: "Selecciona tu plantel asignado. Esto es necesario para continuar el proceso.",
  },
  {
    key: "foto_digital",
    iconKey: "UserCircleIcon",
    label: "Fotografía (imagen)",
    description: "Sube una fotografía digital tipo credencial en formato JPG o PNG (máx. 5MB). Esta imagen se usará en tu perfil.",
    accept: "image/jpeg,image/png",
    isAvatar: true,
  },
  {
    key: "identificacion_oficial",
    iconKey: "IdentificationIcon",
    label: "Identificación Oficial",
    description: "Adjunta una imagen legible o PDF de tu INE, pasaporte o cédula profesional.",
  },
  {
    key: "curp",
    iconKey: "DocumentTextIcon",
    label: "CURP",
    description: "Adjunta tu CURP oficial digital, emitida por el gobierno.",
  },
  {
    key: "rfc",
    iconKey: "BriefcaseIcon",
    label: "RFC",
    description: "Súbenos tu constancia de RFC descargada del SAT.",
  },
  {
    key: "nss",
    iconKey: "ShieldCheckIcon",
    label: "NSS",
    description: "Adjunta tu comprobante vigente de número de seguridad social (IMSS).",
  },
  {
    key: "acta_nacimiento",
    iconKey: "DocumentTextIcon",
    label: "Acta de Nacimiento",
    description: "Sube el PDF de tu acta de nacimiento.",
  },
  {
    key: "comprobante_domicilio",
    iconKey: "ReceiptRefundIcon",
    label: "Comprobante de Domicilio",
    description: "Adjunta un recibo reciente (agua, luz o teléfono), no mayor a 3 meses.",
  },
  {
    key: "certificado_medico",
    iconKey: "UserCircleIcon",
    label: "Certificado Médico",
    description: "Adjunta tu certificado de aptitud médica laboral más reciente.",
  },
  {
    key: "titulo_profesional",
    iconKey: "AcademicCapIcon",
    label: "Título Profesional / Certificados",
    description: "Sube tu título profesional o certificados de estudios.",
  },
  {
    key: "carta_recomendacion",
    iconKey: "UserGroupIcon",
    label: "Cartas / Constancias Laborales",
    description: "Adjunta cartas de recomendación o constancias laborales recientes.",
  },
  {
    key: "curriculum_vitae",
    iconKey: "DocumentTextIcon",
    label: "Currículum Vitae",
    description: "Adjunta tu currículum vitae actualizado en PDF.",
    accept: "application/pdf",
  },
  {
    key: "carta_no_penales",
    iconKey: "CheckCircleIcon",
    label: "Carta de No Penales",
    description: "Sube tu carta de antecedentes no penales emitida por la autoridad.",
  },
  {
    key: "reglamento",
    iconKey: "BookOpenIcon",
    label: "Firma de Reglamento",
    description: "Una vez revisado el reglamento institucional, concluye tu proceso firmado de manera presencial.",
    adminUploadOnly: true
  },
  {
    key: "contrato",
    iconKey: "PencilSquareIcon",
    label: "Firma de Contrato Laboral",
    description: "Tu contrato laboral se firma presencialmente en tu Plantel.",
    adminUploadOnly: true
  },
];
