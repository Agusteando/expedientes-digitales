
import axios from "axios";
import FormData from "form-data";

// Use either MIFIEL_ENV or NODE_ENV, default to production for safety
const MIFIEL_ENV = process.env.MIFIEL_ENV || process.env.NODE_ENV || "production";
const BASE_URL =
  MIFIEL_ENV === "sandbox" || MIFIEL_ENV === "development"
    ? "https://app-sandbox.mifiel.com/api/v1"
    : "https://app.mifiel.com/api/v1";

const APP_ID = process.env.MIFIEL_APP_ID;
const SECRET = process.env.MIFIEL_SECRET;

const mifielClient = axios.create({
  baseURL: BASE_URL,
  auth: {
    username: APP_ID,
    password: SECRET,
  },
});

/**
 * Create a document to be signed at MiFiel.
 * @param {Object} file Buffer(pdf)
 * @param {String} name
 * @param {Array} signers [{ name, email, tax_id }]
 * @param {Object} options (other mifiel params)
 */
export async function mifielCreateDocument({ file, signers, name, ...options }) {
  if (!file || !Buffer.isBuffer(file)) throw new Error("File buffer is required (PDF)");
  if (!Array.isArray(signers) || !signers.length) throw new Error("At least one signer required");

  const form = new FormData();
  form.append("file", file, {
    filename: name?.replace(/[^\w\d\-_\.]+/g, "_") || "document.pdf",
    contentType: "application/pdf"
  });
  form.append("signers", JSON.stringify(signers));
  if (name) form.append("name", name);

  // Append all extra fields (e.g., external_id, message_for_signers, etc)
  if (options) {
    for (const [k, v] of Object.entries(options)) {
      if (v != null) form.append(k, typeof v === "object" ? JSON.stringify(v) : v);
    }
  }

  const headers = { ...form.getHeaders() };

  const { data } = await mifielClient.post("/documents", form, { headers });
  return data;
}

export async function mifielGetDocument(docId) {
  if (!docId) throw new Error("docId required");
  const { data } = await mifielClient.get(`/documents/${docId}`);
  return data;
}

export async function mifielCreateWidget(docId, { email, name }) {
  if (!docId) throw new Error("docId required");
  if (!email) throw new Error("email required");

  const form = new FormData();
  form.append("signer_email", email);
  if (name) form.append("signer_name", name);

  const headers = { ...form.getHeaders() };

  const { data } = await mifielClient.post(`/documents/${docId}/create_widget`, form, { headers });
  return data;
}

export async function mifielDownloadSignedFile(docId) {
  if (!docId) throw new Error("docId required");
  const res = await mifielClient.get(`/documents/${docId}/file_signed`, {
    responseType: "arraybuffer"
  });
  return res.data;
}
