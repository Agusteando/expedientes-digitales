
"use client";
import { useEffect, useRef } from "react";

/**
 * Renders MiFiel Widget in a client-only boundary.
 * @param {string} widgetId - The unique ID for the signatory (from the signature.mifielMetadata.signers[0].widget_id).
 * @param {function} onSuccess - Callback for successful signing.
 * @param {function} onError - Callback for error.
 * @param {string} env - "production" or "sandbox"
 */
export default function MifielWidgetClient({ widgetId, onSuccess, onError, env = "production" }) {
  const loaded = useRef(false);
  useEffect(() => {
    if (!window || loaded.current) return;
    // Load Mifiel Widget CDN JS if not loaded
    if (!window.customElements?.get("mifiel-widget")) {
      const script = document.createElement("script");
      script.src = "https://app.mifiel.com/widget-component/index.js";
      script.async = true;
      script.onload = () => (loaded.current = true);
      document.body.appendChild(script);
    } else {
      loaded.current = true;
    }
  }, []);

  // Attach success/error event handlers on client
  useEffect(() => {
    if (!widgetId) return;
    const interval = setInterval(() => {
      const widget = document.getElementById(`mifiel-widget-${widgetId}`);
      if (widget) {
        widget.addEventListener("signSuccess", onSuccess || (() => {}));
        widget.addEventListener("signError", onError || (() => {}));
        clearInterval(interval);
      }
    }, 400);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [widgetId]);

  if (!widgetId) return null;

  return (
    <div className="w-full rounded-lg border border-cyan-100 bg-white px-0 py-0 overflow-hidden shadow-sm">
      <mifiel-widget
        id={`mifiel-widget-${widgetId}`}
        environment={env}
        success-btn-text="¡Documento firmado!"
        container-class="w-full"
        style={{ display: "block", width: "100%", minHeight: 420 }}
      ></mifiel-widget>
    </div>
  );
}
