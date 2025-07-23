
export const stepsExpediente = [
  {
    key: "plantel",
    isPlantelSelection: true,
    label: "Selecciona tu Plantel",
    description: "Selecciona tu plantel asignado.",
  },
  {
    key: "foto_digital",
    iconKey: "UserCircleIcon",
    label: "Fotografía (imagen)",
    description: "Sube una fotografía tipo credencial.",
    accept: "image/jpeg,image/png",
    isAvatar: true,
  },
  {
    key: "identificacion_oficial",
    iconKey: "IdentificationIcon",
    label: "Identificación Oficial",
    description: "Adjunta imagen o PDF de tu INE/pasaporte/cédula.",
  },
  {
    key: "curp",
    iconKey: "DocumentTextIcon",
    label: "CURP",
    description: "Adjunta tu CURP digital.",
  },
  {
    key: "rfc",
    iconKey: "BriefcaseIcon",
    label: "RFC",
    description: "Adjunta constancia de RFC.",
  },
  {
    key: "nss",
    iconKey: "ShieldCheckIcon",
    label: "NSS",
    description: "Adjunta comprobante de IMSS.",
  },
  {
    key: "acta_nacimiento",
    iconKey: "DocumentTextIcon",
    label: "Acta de Nacimiento",
    description: "Adjunta tu acta de nacimiento.",
  },
  {
    key: "comprobante_domicilio",
    iconKey: "ReceiptRefundIcon",
    label: "Comprobante de Domicilio",
    description: "Adjunta recibo reciente.",
  },
  {
    key: "certificado_medico",
    iconKey: "UserCircleIcon",
    label: "Certificado Médico",
    description: "Adjunta certificado médico.",
  },
  {
    key: "titulo_profesional",
    iconKey: "AcademicCapIcon",
    label: "Título Profesional / Certificados",
    description: "Adjunta tu título profesional o certificados.",
  },
  {
    key: "carta_recomendacion",
    iconKey: "UserGroupIcon",
    label: "Cartas / Constancias Laborales",
    description: "Adjunta cartas de recomendación/constancias.",
  },
  {
    key: "curriculum_vitae",
    iconKey: "DocumentTextIcon",
    label: "Currículum Vitae",
    description: "Adjunta CV en PDF.",
    accept: "application/pdf",
  },
  {
    key: "carta_no_penales",
    iconKey: "CheckCircleIcon",
    label: "Carta de No Penales",
    description: "Adjunta carta de antecedentes no penales.",
  },
  // Admin-only
  {
    key: "proyectivos",
    iconKey: "DocumentTextIcon",
    label: "Entrega de Proyectivos",
    description: "Archivo de proyectivos entregado presencialmente (sólo admin)",
    adminUploadOnly: true,
  },
];
