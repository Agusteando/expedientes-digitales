// /pages/api/contacts.js
const fs = require('fs');
const path = require('path');

// IMPORTANT: use CJS require to avoid ESM interop surprises here
const { CONTACTS_FILE_PATH } = require('../../lib/contactsPath');

export const config = {
  api: {
    bodyParser: { sizeLimit: '2mb' },
    externalResolver: false,
  },
};

const ROLE_OPTIONS = ['ADMON', 'PRINCIPAL'];

function assertRWAccess(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }
  try {
    fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
  } catch (e) {
    const code = e && e.code ? ` (code: ${e.code})` : '';
    throw new Error(`File exists but is not readable/writable: ${filePath}${code}`);
  }
}

// Use eval('require') so Next/webpack doesn’t try to statically bundle/resolve it.
function readContactsModule(filePath) {
  assertRWAccess(filePath);
  try {
    const _require = eval('require');
    // Bust cache so we always see latest on each GET
    const resolved = _require.resolve(filePath);
    if (_require.cache && _require.cache[resolved]) delete _require.cache[resolved];

    const mod = _require(filePath);

    if (!mod || typeof mod !== 'object' || Array.isArray(mod)) {
      throw new Error('contacts.js did not export a plain object.');
    }
    return mod;
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    throw new Error(`Failed to load contacts module at ${filePath}. ${msg}`);
  }
}

function normalizeIncomingContacts(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Invalid contacts payload. Expected an object.');
  }

  const out = {};
  for (const plantelKey of Object.keys(raw)) {
    const list = raw[plantelKey];
    if (!Array.isArray(list)) {
      throw new Error(`Invalid list for plantel "${plantelKey}". Expected an array.`);
    }

    const normalizedList = list.map((entry, idx) => {
      const e = entry || {};
      const role = String(e.Role || '').trim().toUpperCase();
      const name = String(e.Name || '').trim();

      if (!ROLE_OPTIONS.includes(role)) {
        throw new Error(
          `Invalid Role "${e.Role}" at ${plantelKey}[${idx}]. Use one of: ${ROLE_OPTIONS.join(', ')}.`
        );
      }
      if (!name) throw new Error(`Missing Name at ${plantelKey}[${idx}].`);

      let phoneDigits = '';
      if (e.Phone != null && String(e.Phone).trim().length > 0) {
        phoneDigits = String(e.Phone).replace(/\D/g, '');
      } else if (e.ID != null) {
        phoneDigits = String(e.ID).replace(/@c\.us$/i, '').replace(/\D/g, '');
      }
      if (!phoneDigits) throw new Error(`Missing phone/ID at ${plantelKey}[${idx}].`);
      if (phoneDigits.length < 8 || phoneDigits.length > 15) {
        throw new Error(
          `Invalid phone length at ${plantelKey}[${idx}]. Must be 8-15 digits (got ${phoneDigits.length}).`
        );
      }

      return { Role: role, ID: `${phoneDigits}@c.us`, Name: name };
    });

    out[plantelKey] = normalizedList;
  }

  return out;
}

function serializeToContactsModule(obj) {
  const body = JSON.stringify(obj, null, 4);
  return `const contacts = ${body};\n\nmodule.exports = contacts;\n`;
}

export default async function handler(req, res) {
  const filePath = CONTACTS_FILE_PATH;

  try {
    if (!filePath || typeof filePath !== 'string' || !filePath.trim()) {
      return res.status(400).json({
        ok: false,
        error:
          'CONTACTS_FILE_PATH is not set. Define it in .env.local/.env.production, e.g. CONTACTS_FILE_PATH=C:\\Server\\htdocs\\REST\\contacts.js',
      });
    }

    if (req.method === 'GET') {
      const contacts = readContactsModule(filePath);

      const withPhone = {};
      for (const k of Object.keys(contacts)) {
        withPhone[k] = (contacts[k] || []).map((e) => {
          const id = String(e.ID || '');
          const phone = id.replace(/@c\.us$/i, '').replace(/\D/g, '');
          return { Role: e.Role || '', Name: e.Name || '', ID: id, Phone: phone };
        });
      }

      return res.status(200).json({ ok: true, contacts: withPhone, path: filePath });
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      assertRWAccess(filePath);

      const incoming = (req.body && req.body.contacts) || null;
      const normalized = normalizeIncomingContacts(incoming);
      const moduleText = serializeToContactsModule(normalized);

      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        throw new Error(`Directory does not exist: ${dir}`);
      }

      fs.writeFileSync(filePath, moduleText, 'utf8');

      // Re-read to confirm and return
      const saved = readContactsModule(filePath);
      return res.status(200).json({ ok: true, saved, path: filePath });
    }

    res.setHeader('Allow', ['GET', 'PUT', 'POST']);
    return res.status(405).json({ ok: false, error: `Method ${req.method} Not Allowed` });
  } catch (err) {
    const msg = err && err.message ? err.message : 'Unknown error';
    return res.status(400).json({
      ok: false,
      error: `${msg} (CONTACTS_FILE_PATH tried: ${filePath})`,
    });
  }
}
