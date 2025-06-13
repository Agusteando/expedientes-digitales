
import axios from "axios";
import FormData from "form-data";

const BASE_URL = "https://app.mifiel.com/api/v1";
const APP_ID = process.env.MIFIEL_APP_ID;
const SECRET = process.env.MIFIEL_SECRET;

// Axios instance with authentication
const mifielClient = axios.create({
  baseURL: BASE_URL,
  auth: {
    username: APP_ID,
    password: SECRET,
  },
});

/**
 * Create a document to be signed at MiFiel.
 * @param {Object} opts - { file, signers, name }
 *        opts.file: Buffer (for PDF bytes)
 *        opts.signers: array of { name, email }
 *        opts.name: document display name
 * @returns {Promise<Object>} - MiFiel document JSON
 */
export async function mifielCreateDocument({ file, signers, name }) {
  if (!file || !Buffer.isBuffer(file)) throw new Error("File buffer is required (PDF)");
  if (!signers?.length) throw new Error("At least one signer is required");

  const form = new FormData();
  form.append("file", file, {
    filename: name?.replace(/[^\w\d\-_\.]+/g, "_") || "document.pdf",
    contentType: "application/pdf"
  });
  form.append("signers", JSON.stringify(signers));
  if (name) form.append("name", name);

  const headers = {
    ...form.getHeaders(),
    // Axios will pass authentication from the instance
  };

  const { data } = await mifielClient.post("/documents", form, { headers });
  return data;
}

/**
 * Get Mifiel document info.
 * @param {string} docId
 * @returns {Promise<Object>}
 */
export async function mifielGetDocument(docId) {
  if (!docId) throw new Error("docId required");
  const { data } = await mifielClient.get(`/documents/${docId}`);
  return data;
}

/**
 * Create a widget for a document signer.
 * @param {string} docId - MiFiel doc id
 * @param {Object} opts - { email, name }
 * @returns {Promise<Object>} - Widget info including widget_id
 */
export async function mifielCreateWidget(docId, { email, name }) {
  if (!docId) throw new Error("docId required");
  if (!email) throw new Error("email is required for widget");

  const form = new FormData();
  form.append("signer_email", email);
  if (name) form.append("signer_name", name);

  const headers = {
    ...form.getHeaders(),
  };

  const { data } = await mifielClient.post(`/documents/${docId}/create_widget`, form, { headers });
  return data;
}

/**
 * Download a signed file
 * @param {string} docId - MiFiel doc id
 * @returns {Promise<Buffer>} - Signed PDF as buffer
 */
export async function mifielDownloadSignedFile(docId) {
  if (!docId) throw new Error("docId required");
  const res = await mifielClient.get(`/documents/${docId}/file_signed`, {
    responseType: "arraybuffer"
  });
  return res.data; // Buffer
}
