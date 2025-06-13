
import axios from "axios";
import FormData from "form-data";

const isSandboxEnv = () => {
  if (process.env.MIFIEL_ENV) return /sandbox|dev/i.test(process.env.MIFIEL_ENV);
  if (process.env.MIFIEL_APP_ID?.includes("sandbox")) return true;
  if (process.env.NODE_ENV === "development") return true;
  return false;
};

const BASE_URL = isSandboxEnv()
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
 * Helper to append arrays of objects as indexed fields (eg: signatories[0][name])
 * Coerces all primitives to string, for Node.js form-data.
 */
function setIndexedFields(form, fieldBase, array, debugFields) {
  (array || []).forEach((obj, idx) => {
    if (!obj || typeof obj !== "object") return;
    for (const [key, value] of Object.entries(obj)) {
      if (Buffer.isBuffer(value)) {
        form.append(`${fieldBase}[${idx}][${key}]`, value);
        debugFields.push([`${fieldBase}[${idx}][${key}]`, `<Buffer length ${value.length}>`]);
      } else if (typeof value === "object" && value !== null) {
        form.append(`${fieldBase}[${idx}][${key}]`, JSON.stringify(value));
        debugFields.push([`${fieldBase}[${idx}][${key}]`, JSON.stringify(value)]);
      } else {
        form.append(`${fieldBase}[${idx}][${key}]`, String(value));
        debugFields.push([`${fieldBase}[${idx}][${key}]`, String(value)]);
      }
    }
  });
}

function toBool(val) {
  if (val === true) return true;
  if (val === false) return false;
  if (typeof val === "string") return /^(true|1)$/i.test(val);
  return Boolean(val);
}

/**
 * Append a form-data field, coercing values to string unless Buffer (for compatibility).
 */
function safeAppend(form, key, value, debugFields) {
  if (Buffer.isBuffer(value)) {
    form.append(key, value);
    debugFields.push([key, `<Buffer length ${value.length}>`]);
  } else if (typeof value === "object" && value !== null) {
    form.append(key, JSON.stringify(value));
    debugFields.push([key, JSON.stringify(value)]);
  } else {
    form.append(key, String(value));
    debugFields.push([key, String(value)]);
  }
}

export async function mifielCreateDocument({
  file,
  signers,
  signatories,
  name,
  days_to_expire = 7,
  external_id,
  massive = false,
  message_for_signers = "Por favor firma tu documento con IECS-IEDIS.",
  payer, // Overridden below
  remind_every = 2,
  send_invites = true,
  transfer_operation_document_id = 0,
  viewers = [],
  ...options
}) {
  console.log("[mifielCreateDocument] BEGIN call");
  console.log("[mifielCreateDocument] BASE_URL:", BASE_URL);
  console.log("[mifielCreateDocument] File typeof:", typeof file, "size:", file?.length, "name:", name);

  const realSigners = signatories || signers;
  if (!file || !Buffer.isBuffer(file))
    throw new Error("File buffer is required (PDF)");
  if (!Array.isArray(realSigners) || !realSigners.length)
    throw new Error("At least one signatory required (see MiFiel docs)");

  const form = new FormData();
  const debugFields = [];

  form.append("file", file, {
    filename: name?.replace(/[^\w\d\-_\.]+/g, "_") || "documento.pdf",
    contentType: "application/pdf"
  });
  debugFields.push(["file", `<Buffer of length ${file.length}>`]);

  setIndexedFields(form, "signatories", realSigners, debugFields);

  safeAppend(form, "days_to_expire", days_to_expire, debugFields);
  safeAppend(form, "external_id", external_id, debugFields);
  safeAppend(form, "massive", toBool(massive), debugFields);
  safeAppend(form, "message_for_signers", message_for_signers, debugFields);

  // Hardcode payer here:
  const staticPayer = "desarrollo.tecnologico@casitaiedis.edu.mx";
  safeAppend(form, "payer", staticPayer, debugFields);

  safeAppend(form, "remind_every", remind_every, debugFields);
  safeAppend(form, "send_invites", toBool(send_invites), debugFields);
  safeAppend(form, "transfer_operation_document_id", transfer_operation_document_id, debugFields);

  if (Array.isArray(viewers) && viewers.length)
    setIndexedFields(form, "viewers", viewers, debugFields);

  for (const [k, v] of Object.entries(options)) {
    if (v === undefined || v === null) continue;
    if (/^(file|signatories|viewers|signers)$/i.test(k)) continue;
    safeAppend(form, k, v, debugFields);
  }

  console.log("[mifielCreateDocument] Multipart fields:", JSON.stringify(debugFields, null, 1));
  try { console.log("[mifielCreateDocument] Content-Length (approx):", await new Promise(rs => form.getLength((err, len) => rs(len)))); } catch { }

  let formBuffer = null;
  try {
    formBuffer = form.getBuffer();
  } catch (err) {
    console.error("[mifielCreateDocument] form.getBuffer() failed", err);
    throw new Error("Could not serialize FormData to buffer.");
  }

  const headers = form.getHeaders();
  const axiosOpts = {
    headers: {
      ...headers
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    transitional: { forcedJSONParsing: false }
  };

  try {
    const { data } = await mifielClient.post("/documents", formBuffer, axiosOpts);
    return data;
  } catch (e) {
    console.error("[mifielCreateDocument] FULL ERROR OBJECT:", e);
    if (e?.response) {
      console.error("[mifielCreateDocument] e.response.status:", e.response.status);
      console.error("[mifielCreateDocument] e.response.data:", e.response.data);
      console.error("[mifielCreateDocument] e.response.headers:", e.response.headers);
      console.error("[mifielCreateDocument] e.response.config:", e.response.config);
    }
    if (e?.request) {
      // Axios in node
      console.error("[mifielCreateDocument] e.request PATH:", e.request.path);
      console.error("[mifielCreateDocument] e.request HEADERS:", e.request._header);
    }
    if (e?.message) {
      console.error("[mifielCreateDocument] e.message:", e.message);
    }
    if (typeof e.toJSON === "function" && e.toJSON) {
      try { console.error("[mifielCreateDocument] e.toJSON():", e.toJSON()); } catch {};
    }
    throw e;
  }
}

export async function mifielGetDocument(docId) {
  if (!docId) throw new Error("docId required");
  try {
    const { data } = await mifielClient.get(`/documents/${docId}`);
    return data;
  } catch (e) {
    console.error("[mifielGetDocument] FULL ERROR OBJECT:", e);
    if (e?.response) {
      console.error("[mifielGetDocument] e.response.status:", e.response.status);
      console.error("[mifielGetDocument] e.response.data:", e.response.data);
    }
    throw e;
  }
}

export async function mifielCreateWidget(docId, { email, name }) {
  if (!docId) throw new Error("docId required");
  if (!email) throw new Error("email required");

  const form = new FormData();
  const debugFields = [];
  safeAppend(form, "signer_email", email, debugFields);
  if (name) safeAppend(form, "signer_name", name, debugFields);

  let formBuffer = null;
  try {
    formBuffer = form.getBuffer();
  } catch (err) {
    console.error("[mifielCreateWidget] form.getBuffer() failed", err);
    throw new Error("Could not serialize FormData to buffer.");
  }

  const headers = form.getHeaders();
  try {
    const { data } = await mifielClient.post(`/documents/${docId}/create_widget`, formBuffer, {
      headers,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      transitional: { forcedJSONParsing: false }
    });
    return data;
  } catch (e) {
    console.error("[mifielCreateWidget] FULL ERROR OBJECT:", e);
    if (e?.response) {
      console.error("[mifielCreateWidget] e.response.status:", e.response.status);
      console.error("[mifielCreateWidget] e.response.data:", e.response.data);
    }
    throw e;
  }
}

export async function mifielDownloadSignedFile(docId) {
  if (!docId) throw new Error("docId required");
  try {
    const res = await mifielClient.get(`/documents/${docId}/file_signed`, {
      responseType: "arraybuffer",
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      transitional: { forcedJSONParsing: false }
    });
    return res.data;
  } catch (e) {
    console.error("[mifielDownloadSignedFile] FULL ERROR OBJECT:", e);
    if (e?.response) {
      console.error("[mifielDownloadSignedFile] e.response.status:", e.response.status);
      console.error("[mifielDownloadSignedFile] e.response.data:", e.response.data);
    }
    throw e;
  }
}
