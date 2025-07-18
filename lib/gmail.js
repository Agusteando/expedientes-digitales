
import { google } from "googleapis";
import fs from "fs/promises";

/**
 * Sends a password reset or notification email.
 * Always uses:
 *   - Delegated sender: desarrollo.tecnologico@casitaiedis.edu.mx
 *   - Alias: Expediente Signia
 *   - Subject: Expediente Signia
 *
 * @param {string} toEmail - The user\'s email (recipient).
 * @param {string} html - Email HTML content.
 */
export async function sendResetPasswordEmail(toEmail, html) {
  const credsFile = "credentials.json";
  const fileContent = await fs.readFile(credsFile, "utf-8");
  const creds = JSON.parse(fileContent);

  const from = "desarrollo.tecnologico@casitaiedis.edu.mx";
  const aliasName = "Expediente Signia";
  const subject = "Expediente Signia";

  // Logging context
  console.log("[GMAIL] Loaded service account from", credsFile);
  console.log("[GMAIL] creds loaded, has keys:", Object.keys(creds), "private_key length:", creds.private_key?.length || 0);
  if (creds.private_key && creds.private_key.includes("\n")) {
    console.log("[GMAIL] private_key successfully contains real newlines");
  } else {
    console.warn("[GMAIL] private_key does NOT contain newlines; may fail JWT!");
  }
  console.log("[GMAIL] Using DELEGATED sender mailbox:", from);

  // Google JWT for service account with delegation
  const jwtClient = new google.auth.JWT(
    creds.client_email,
    null,
    creds.private_key,
    ["https://www.googleapis.com/auth/gmail.send"],
    from,
  );

  console.log("[GMAIL] About to authorize JWT...");
  await jwtClient.authorize();
  console.log("[GMAIL] JWT authorized");

  const gmail = google.gmail({ version: "v1", auth: jwtClient });
  console.log("[GMAIL] Gmail API client initialized");

  // RFC822 with alias and fixed subject
  let rawEmail = [
    "MIME-Version: 1.0",
    `From: =?UTF-8?B?${Buffer.from(aliasName).toString("base64")}?= <${from}>`,
    `To: ${toEmail}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
    "Content-Type: text/html; charset=UTF-8",
    "",
    `<html><body>${html}</body></html>`,
  ].join("\r\n");

  const base64Email = Buffer.from(rawEmail)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  console.log(`[GMAIL] About to send mail to ${toEmail} via Gmail API...`);
  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: base64Email,
    }
  });

  console.log(`[GMAIL] Sent reset password to ${toEmail} from ${aliasName} <${from}>.`);
}