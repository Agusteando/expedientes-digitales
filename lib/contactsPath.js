
const path = require('path');

// Always prefer the environment variable
// Example usage in .env.local or .env.production:
// CONTACTS_FILE_PATH=C:\Server\htdocs\REST\contacts.js
const CONTACTS_FILE_PATH = process.env.CONTACTS_FILE_PATH
  ? process.env.CONTACTS_FILE_PATH
  : path.join(process.cwd(), 'data', 'contacts.js'); // fallback: local copy inside repo

module.exports = { CONTACTS_FILE_PATH };
