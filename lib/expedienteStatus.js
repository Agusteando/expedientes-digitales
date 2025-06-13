
/**
 * Centralized status translation and icon/color map for expediente steps, docs, checklist, signatures.
 * Use these to display all status info—never expose English directly to UI.
 */

import {
  CheckCircleIcon as CheckCircleSolid,
  ArrowPathIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from "@heroicons/react/24/solid";

// Status constants
export const EXPEDIENTE_STATUSES = {
  fulfilled:   { display: "Entregado",    color: "emerald", icon: CheckCircleSolid },
  accepted:    { display: "Entregado",    color: "emerald", icon: CheckCircleSolid },
  signed:      { display: "Firmado",      color: "emerald", icon: CheckCircleSolid },

  completed:   { display: "Firmado",      color: "emerald", icon: CheckCircleSolid },
  pending:     { display: "Pendiente",    color: "gray",    icon: ClockIcon },
  signing:     { display: "Firma en proceso", color: "yellow", icon: ArrowPathIcon },
  uploading:   { display: "Subiendo...",  color: "sky",     icon: ArrowPathIcon },
  rejected:    { display: "Rechazado",    color: "red",     icon: XCircleIcon },
  error:       { display: "Error",        color: "red",     icon: ExclamationTriangleIcon }
};

// Utility: normalize backend status string (may be English/DB/legacy) to info
export function getStatusMeta(status) {
  if (!status) return EXPEDIENTE_STATUSES.pending;
  const normalized = typeof status === "string" ? status.toLowerCase() : "";
  return (
    EXPEDIENTE_STATUSES[normalized] ||
    { display: normalized.charAt(0).toUpperCase() + normalized.slice(1), color: "gray", icon: ClockIcon }
  );
}
