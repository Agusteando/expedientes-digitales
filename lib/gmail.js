
import { google } from "googleapis";
import fs from "fs";
import path from "path";

const SERVICE_ACCOUNT_SENDER = process.env.GSERVICE_EMAIL || "desarrollo.tecnologico@casitaiedis.edu.mx";
const CREDENTIALS_PATH = process.env.GSERVICE_CREDENTIALS_PATH || path.join(process.cwd(), "credentials.json");

export async function sendResetPasswordEmail({ to, name, link }) {
  let creds;
  try {
    const fileContent = fs.readFileSync(CREDENTIALS_PATH, "utf8");
    creds = JSON.parse(fileContent);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[GMAIL ERROR] Failed to read credentials.json", e, "CREDENTIALS_PATH:", CREDENTIALS_PATH);
    throw new Error("No se pudo cargar el archivo credentials.json o no existe.");
  }

  // Clean up private_key in case it's pipe-delimited
  if (creds.private_key && typeof creds.private_key === "string") {
    creds.private_key = creds.private_key.replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
  } else {
    // eslint-disable-next-line no-console
    console.error("[GMAIL ERROR] credentials.json missing client_email or private_key", creds);
    throw new Error("El archivo credentials.json no tiene client_email o private_key.");
  }

  // EXACT SAME pattern as your working script:
  const jwtClient = new google.auth.JWT(
    creds.client_email,
    null,
    creds.private_key,
    ["https://www.googleapis.com/auth/gmail.send"],
    SERVICE_ACCOUNT_SENDER
  );

  // Authorize JWT client (MUST resolve before using!)
  await jwtClient.authorize();

  const gmail = google.gmail({ version: "v1", auth: jwtClient });

  const subject = "Restablecer contraseña de tu cuenta IECS-IEDIS";
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;background-color:#f4fbfd;border-radius:16px;text-align:center">
      <img src="https://www.casitaiedis.edu.mx/wp-content/uploads/2023/08/IMAGOTIPO-IECS-IEDIS.png" alt="Logotipo IECS-IEDIS" style="max-width:64px;border-radius:12px;margin-bottom:12px" />
      <h2 style="color:#1f688c">¡Hola${name ? ` ${name}` : ""}!</h2>
      <p style="color:#23313f;font-size:16px">
        Has solicitado restablecer tu contraseña para tu expediente laboral en IECS-IEDIS.
      </p>
      <p>
        Haz clic en el botón para crear una nueva contraseña:
      </p>
      <a href="${link}" style="display:inline-block;margin:18px auto;padding:13px 24px;background:#1cc2ac;color:#fff;font-weight:bold;border-radius:50px;text-decoration:none;font-size:18px">Restablecer contraseña</a>
      <p style="font-size:13px;color:#1f262a">
        Si no solicitaste este cambio, simplemente ignora este correo.
      </p>
      <hr style="margin:18px 0;border:none;border-bottom:1px solid #d9eceb" />
      <div style="font-size:11px;color:#8dbbbc;">
        Expediente Laboral Digital IECS-IEDIS · www.casitaiedis.edu.mx
      </div>
    </div>
  `;

  const base64Subject = Buffer.from(subject).toString("base64");
  const base64From = Buffer.from("IECS-IEDIS").toString("base64");
  const raw = [
    "MIME-Version: 1.0",
    `From: =?UTF-8?B?${base64From}?= <${SERVICE_ACCOUNT_SENDER}>`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${base64Subject}?=`,
    "Content-Type: text/html; charset=UTF-8",
    "",
    html
  ].join("\n");

  const encodedMessage = Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  try {
    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encodedMessage }
    });
    return true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[GMAIL ERROR]", e.response?.data ?? e);
    throw new Error("No se pudo enviar el correo de restablecimiento.");
  }
}
