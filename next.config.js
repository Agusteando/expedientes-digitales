
/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  // Prevent the dev CaseSensitivePathsPlugin from erroring on Windows when the
  // same absolute path is discovered with different directory casing (Patchly vs patchly).
  // Also pin a single, consistent alias for the specific Next internals reported.
  webpack: (config, { dev }) => {
    if (dev) {
      config.plugins = (config.plugins || []).filter(
        (p) => (p?.constructor?.name || "") !== "CaseSensitivePathsPlugin"
      );
    }

    const nextLibRoot = path.join(process.cwd(), "node_modules", "next", "dist", "lib");

    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Stabilize these imports to a single absolute path to avoid dual-resolve with different casing.
      "next/dist/lib/error-telemetry-utils": path.join(nextLibRoot, "error-telemetry-utils.js"),
      "next/dist/lib/error-telemetry-utils.js": path.join(nextLibRoot, "error-telemetry-utils.js"),
      "next/dist/lib/is-error": path.join(nextLibRoot, "is-error.js"),
      "next/dist/lib/is-error.js": path.join(nextLibRoot, "is-error.js"),
      "next/dist/lib/metadata/metadata-constants": path.join(nextLibRoot, "metadata", "metadata-constants.js"),
      "next/dist/lib/metadata/metadata-constants.js": path.join(nextLibRoot, "metadata", "metadata-constants.js"),
    };

    return config;
  },
};

module.exports = nextConfig;
