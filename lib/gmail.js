
import { google } from "googleapis";
import fs from "fs";
import path from "path";

// Scope: send as delegated GMail user (using service+delegation!)
const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.send";
const CANDIDATE_REGISTRATION_RECIPIENTS = [
  "rh@casitaiedis.edu.mx",
  "psic.reclutamiento@casitaiedis.edu.mx",
  "auditoria.admon@casitaiedis.edu.mx",
  "auditoria.met@casitaiedis.edu.mx",
];

/**
 * Get a Google JWT client for sending email via Gmail API using domain delegation.
 * @returns {Promise<google.auth.JWT>}
 */
export async function getGmailJwtClient() {
  let creds;
  const credPath =
    process.env.GMAIL_SERVICE_ACCOUNT_JSON_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(process.cwd(), "credentials.json");
  if (fs.existsSync(credPath)) {
    creds = JSON.parse(fs.readFileSync(credPath, "utf-8"));
    console.log("[GMAIL] Loaded service account from", credPath);
  } else if (process.env.GMAIL_SERVICE_ACCOUNT_JSON) {
    creds = JSON.parse(process.env.GMAIL_SERVICE_ACCOUNT_JSON);
    console.log("[GMAIL] Loaded service account from env var");
  } else {
    throw new Error("No credentials found for Gmail service account");
  }

  // Debugging key structure
  console.log("[GMAIL] creds loaded, has keys:", Object.keys(creds), "private_key length:", creds.private_key?.length);

  // Ensure private_key is multi-line with newlines (some env setups require replacing '\\n' with '\n')
  if (typeof creds.private_key === "string" && !creds.private_key.includes("\n")) {
    creds.private_key = creds.private_key.replace(/\\n/g, "\n");
  }
  if (!creds.private_key || creds.private_key.length < 1000) {
    throw new Error("Malformed or missing private_key in Gmail service account");
  }
  console.log("[GMAIL] private_key successfully contains real newlines");

  const delegatedUser =
    process.env.GMAIL_DELEGATE_EMAIL ||
    process.env.GMAIL_FROM ||
    "desarrollo.tecnologico@casitaiedis.edu.mx";

  console.log("[GMAIL] Using DELEGATED sender mailbox:", delegatedUser);
  const jwtClient = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: [GMAIL_SCOPE],
    subject: delegatedUser,
  });

  // Confirm that JWT constructed with required fields
  if (!jwtClient.key) {
    console.error("[GMAIL] jwtClient.key missing!", jwtClient);
    throw new Error("Google JWT client missing key (private_key)");
  }
  console.log("[GMAIL] About to authorize JWT...");
  await jwtClient.authorize();
  console.log("[GMAIL] JWT authorized");

  return jwtClient;
}

/**
 * Sends a password reset email, encoding subject for UTF-8 as required by Gmail for non-ASCII.
 * @param {string} to Recipient email
 * @param {string} link Password reset link
 */
export async function sendResetPasswordEmail(to, link) {
  const jwtClient = await getGmailJwtClient();
  const gmail = google.gmail({ version: "v1", auth: jwtClient });

  const subject = "Restablecer tu contraseña - IECS-IEDIS";
  // Encode subject for UTF-8 (RFC 2047/U)
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`;

  const body = `Hola!<br><br>
Has solicitado restablecer tu contraseña en IECS-IEDIS.<br>
Haz clic en este enlace seguro para continuar:<br><br>
<a href="${link}" style="color:#036;">Restablecer contraseña</a><br><br>
Si no solicitaste el cambio, ignora este mensaje.<br><br>
--<br>IECS-IEDIS`;

  const rawMessage = [
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    "Content-Type: text/html; charset=utf-8",
    "",
    body,
  ].join("\n");

  try {
    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: Buffer.from(rawMessage).toString("base64").replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ""),
      },
    });
    console.log(`[GMAIL] Password reset sent to ${to}: status ${res.status}`);
  } catch (err) {
    console.error(`[FORGOT PASSWORD EMAIL ERROR]`, err);
    throw err;
  }
}

function formatMxTimestamp(date) {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "full",
      timeStyle: "long",
      timeZone: "America/Mexico_City",
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

/**
 * Sends internal notification when a candidate registers.
 * The recipient list is fixed by business policy.
 */
export async function sendCandidateRegistrationNotification({ candidate, plantelName }) {
  const jwtClient = await getGmailJwtClient();
  const gmail = google.gmail({ version: "v1", auth: jwtClient });

  const registrationDate = new Date();
  const formattedDate = formatMxTimestamp(registrationDate);
  const safePlantel = plantelName || "No especificado";
  const subject = `Nuevo registro de candidato | Plantel: ${safePlantel}`;
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`;

  const candidateName =
    candidate?.name ||
    [candidate?.apellidoPaterno, candidate?.apellidoMaterno, candidate?.nombres]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "Sin nombre";

  const detailRows = [
    ["Nombre completo", candidateName],
    ["Correo", candidate?.email || "No especificado"],
    ["CURP", candidate?.curp || "No especificado"],
    ["RFC", candidate?.rfc || "No especificado"],
    ["Plantel", safePlantel],
    ["Fecha y hora de registro", formattedDate],
    ["ID de candidato", String(candidate?.id ?? "N/A")],
  ];

  const rowsHtml = detailRows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 12px; border-bottom:1px solid #e5e7eb; background:#f8fafc; color:#334155; font-weight:600; width:220px;">${label}</td>
          <td style="padding:10px 12px; border-bottom:1px solid #e5e7eb; color:#0f172a;">${value}</td>
        </tr>`
    )
    .join("");

  const body = `
  <div style="margin:0; padding:24px; background:#f1f5f9; font-family:Arial,Helvetica,sans-serif; color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:760px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
      <tr>
        <td style="padding:20px 24px; background:linear-gradient(90deg,#0f766e,#0891b2); color:#ffffff;">
          <div style="font-size:20px; font-weight:700;">Nuevo registro de candidato</div>
          <div style="margin-top:6px; font-size:14px; opacity:.95;">Plantel seleccionado: <strong>${safePlantel}</strong></div>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 14px; color:#334155; line-height:1.55;">
            Se recibió un nuevo registro en la plataforma de expediente laboral digital. A continuación se muestra el resumen del candidato y del plantel seleccionado en el primer paso de registro.
          </p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
            ${rowsHtml}
          </table>
          <div style="margin-top:16px; padding:14px 16px; border-left:4px solid #0891b2; background:#ecfeff; color:#155e75; line-height:1.5;">
            <strong>Siguiente paso sugerido:</strong> validar la información del candidato en el panel administrativo y dar seguimiento al expediente según el flujo vigente.
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 24px; background:#f8fafc; border-top:1px solid #e2e8f0; color:#64748b; font-size:12px;">
          Notificación automática de IECS-IEDIS · ${formattedDate}
        </td>
      </tr>
    </table>
  </div>`;

  const plainText = [
    "Nuevo registro de candidato",
    `Plantel: ${safePlantel}`,
    "",
    `Nombre completo: ${candidateName}`,
    `Correo: ${candidate?.email || "No especificado"}`,
    `CURP: ${candidate?.curp || "No especificado"}`,
    `RFC: ${candidate?.rfc || "No especificado"}`,
    `Fecha y hora de registro: ${formattedDate}`,
    `ID de candidato: ${String(candidate?.id ?? "N/A")}`,
    "",
    "Siguiente paso sugerido: validar la información del candidato en el panel administrativo y dar seguimiento al expediente según el flujo vigente.",
  ].join("\n");

  const rawMessage = [
    `To: ${CANDIDATE_REGISTRATION_RECIPIENTS.join(", ")}`,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    'Content-Type: multipart/alternative; boundary="boundary_iecs_candidate_register"',
    "",
    "--boundary_iecs_candidate_register",
    "Content-Type: text/plain; charset=utf-8",
    "",
    plainText,
    "",
    "--boundary_iecs_candidate_register",
    "Content-Type: text/html; charset=utf-8",
    "",
    body,
    "",
    "--boundary_iecs_candidate_register--",
  ].join("\n");

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: Buffer.from(rawMessage)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, ""),
    },
  });
  console.log(
    `[GMAIL] Candidate registration notification sent (${res.status}) to ${CANDIDATE_REGISTRATION_RECIPIENTS.join(", ")}`
  );
}
