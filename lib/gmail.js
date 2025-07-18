
import { google } from "googleapis";
import fs from "fs";
import path from "path";

// Scope: send as delegated GMail user (using service+delegation!)
const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.send";

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
 * Send a password reset email via GMail API. Call this in API routes.
 * @param {string} to Recipient email
 * @param {string} link Link for resetting password
 * @returns {Promise<void>}
 */
export async function sendResetPasswordEmail(to, link) {
  const jwtClient = await getGmailJwtClient();
  const gmail = google.gmail({ version: "v1", auth: jwtClient });

  const subject = "Restablecer tu contraseña - IECS-IEDIS";
  const body = `Hola!<br><br>
Has solicitado restablecer tu contraseña en IECS-IEDIS.<br>
Haz clic en este enlace seguro para continuar:<br><br>
<a href="${link}" style="color:#036;">Restablecer contraseña</a><br><br>
Si no solicitaste el cambio, ignora este mensaje.<br><br>
--<br>IECS-IEDIS`;

  const rawMessage = [
    `To: ${to}`,
    `Subject: ${subject}`,
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
