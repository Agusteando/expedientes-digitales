
import fs from "fs";
import path from "path";
import contactsPath from "../../lib/contactsPath";

// Interop with CJS default export
const { CONTACTS_FILE_PATH } = contactsPath;

// Ensure we run on the Node runtime (not Edge)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb",
    },
    externalResolver: false,
  },
};

const ROLE_OPTIONS = ["ADMON", "PRINCIPAL"];

// Helper: read the CJS module freshly each time
function readContactsModule(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Bust require cache so changes are always visible
  const resolved = require.resolve(filePath);
  delete require.cache[resolved];

  // Use require to load the CommonJS export
  // This executes the module, so it must be trusted code.
  // Your file is controlled by you, so ok.
  const contacts = require(filePath);

  if (!contacts || typeof contacts !== "object" || Array.isArray(contacts)) {
    throw new Error("contacts.js did not export a plain object.");
  }

  return contacts;
}

// Convert any incoming UI state into the contacts.js shape
// We accept entries that may include `Phone` or already have `ID`.
function normalizeIncomingContacts(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Invalid contacts payload. Expected an object.");
  }

  const out = {};
  for (const plantelKey of Object.keys(raw)) {
    const list = raw[plantelKey];
    if (!Array.isArray(list)) {
      throw new Error(`Invalid list for plantel "${plantelKey}". Expected an array.`);
    }

    const normalizedList = list.map((entry, idx) => {
      const e = entry || {};
      const role = String(e.Role || "").trim().toUpperCase();
      const name = String(e.Name || "").trim();

      if (!ROLE_OPTIONS.includes(role)) {
        throw new Error(
          `Invalid Role "${e.Role}" at ${plantelKey}[${idx}]. Use one of: ${ROLE_OPTIONS.join(", ")}.`
        );
      }
      if (!name) {
        throw new Error(`Missing Name at ${plantelKey}[${idx}].`);
      }

      let phoneDigits = "";
      if (e.Phone != null && String(e.Phone).trim().length > 0) {
        phoneDigits = String(e.Phone).replace(/\D/g, "");
      } else if (e.ID != null) {
        // Derive phone from ID if present
        phoneDigits = String(e.ID).replace(/@c\.us$/i, "").replace(/\D/g, "");
      }

      if (!phoneDigits) {
        throw new Error(`Missing phone/ID at ${plantelKey}[${idx}].`);
      }

      if (phoneDigits.length < 8 || phoneDigits.length > 15) {
        throw new Error(
          `Invalid phone length at ${plantelKey}[${idx}]. Must be 8-15 digits (got ${phoneDigits.length}).`
        );
      }

      const id = `${phoneDigits}@c.us`;

      return {
        Role: role,
        ID: id,
        Name: name,
      };
    });

    out[plantelKey] = normalizedList;
  }

  return out;
}

// Serialize back into a CommonJS module file, pretty-printed.
function serializeToContactsModule(obj) {
  const body = JSON.stringify(obj, null, 4);
  // Keep it simple and consistent. Comments from the original file will not be preserved.
  return `const contacts = ${body};\n\nmodule.exports = contacts;\n`;
}

export default async function handler(req, res) {
  // Minimal debug logs for verification (remove after confirming paths and methods)
  console.log("[debug] /api/contacts method:", req.method, "filePath:", CONTACTS_FILE_PATH);

  try {
    if (req.method === "GET") {
      const contacts = readContactsModule(CONTACTS_FILE_PATH);

      // Also return a UI-friendly view including derived "Phone" for easy editing.
      const withPhone = {};
      for (const k of Object.keys(contacts)) {
        withPhone[k] = (contacts[k] || []).map((e) => {
          const id = String(e.ID || "");
          const phone = id.replace(/@c\.us$/i, "").replace(/\D/g, "");
          return {
            Role: e.Role || "",
            Name: e.Name || "",
            ID: id,
            Phone: phone,
          };
        });
      }

      return res.status(200).json({
        ok: true,
        contacts: withPhone,
        path: CONTACTS_FILE_PATH,
      });
    }

    if (req.method === "PUT" || req.method === "POST") {
      const incoming = (req.body && req.body.contacts) || null;
      const normalized = normalizeIncomingContacts(incoming);
      const moduleText = serializeToContactsModule(normalized);

      // Ensure directory exists (it should, but be defensive)
      const dir = path.dirname(CONTACTS_FILE_PATH);
      if (!fs.existsSync(dir)) {
        throw new Error(`Directory does not exist: ${dir}`);
      }

      fs.writeFileSync(CONTACTS_FILE_PATH, moduleText, "utf8");

      // Re-read to confirm and return
      const saved = readContactsModule(CONTACTS_FILE_PATH);

      return res.status(200).json({
        ok: true,
        saved,
        path: CONTACTS_FILE_PATH,
      });
    }

    res.setHeader("Allow", ["GET", "PUT", "POST"]);
    return res.status(405).json({ ok: false, error: `Method ${req.method} Not Allowed` });
  } catch (err) {
    console.error("[error] /api/contacts:", err?.message || err);
    return res.status(400).json({
      ok: false,
      error: err && err.message ? err.message : "Unknown error",
    });
  }
}
