
import FormData from "form-data";
import fetch from "node-fetch";

const BASE_URL = "https://app.mifiel.com/api/v1";
const APP_ID = process.env.MIFIEL_APP_ID;
const APP_SECRET = process.env.MIFIEL_APP_SECRET;

function getBasicAuthHeader() {
  const creds = Buffer.from(`${APP_ID}:${APP_SECRET}`).toString("base64");
  return `Basic ${creds}`;
}

/**
 * Create a document for signing on Mifiel
 * 
 * @param {Buffer} fileBuffer - PDF file buffer
 * @param {String} fileName - Name of file (for API/presence)
 * @param {Object[]} signatories - [{ name, email, tax_id }]
 * @param {Object} options
 * @returns {Promise<Object>} - Mifiel document info (id, state, etc)
 */
export async function mifielCreateDocument(fileBuffer, fileName, signatories, options) {
  const form = new FormData();
  form.append("file", fileBuffer, fileName);
  signatories.forEach((sign, i) => {
    form.append(`signatories[${i}][name]`, sign.name);
    form.append(`signatories[${i}][email]`, sign.email);
    form.append(`signatories[${i}][tax_id]`, sign.tax_id || "");
  });
  form.append("days_to_expire", options.days_to_expire?.toString() || "7");
  form.append("external_id", options.external_id);
  form.append("massive", "false");
  form.append("message_for_signers", options.message_for_signers || "Favor de firmar su expediente digital.");
  form.append("payer", options.payer || signatories[0]?.email);
  form.append("remind_every", options.remind_every ? options.remind_every.toString() : "2");
  form.append("send_invites", "true");
  form.append("transfer_operation_document_id", "0");
  form.append("viewers", JSON.stringify(options.viewers || [])); // array of {"email": ...}

  const resp = await fetch(`${BASE_URL}/documents`, {
    method: "POST",
    headers: {
      "Authorization": getBasicAuthHeader(),
      ...form.getHeaders(),
    },
    body: form
  });

  const respBody = await resp.json();
  if (!resp.ok) {
    console.error("[Mifiel CreateDocument Error]", resp.status, respBody);
    throw new Error(respBody.error || `HTTP ${resp.status}`);
  }
  return respBody;
}

/**
 * Fetch info about Mifiel document by its id
 * @param {string} mifielId
 * @returns {Promise<Object>}
 */
export async function mifielGetDocument(mifielId) {
  const resp = await fetch(`${BASE_URL}/documents/${mifielId}`, {
    headers: {
      "Authorization": getBasicAuthHeader(),
    },
  });
  const data = await resp.json();
  if (!resp.ok) {
    console.error("[Mifiel GetDocument Error]", resp.status, data);
    throw new Error(data.error || `HTTP ${resp.status}`);
  }
  return data;
}

