
"use client";
import { useEffect, useRef } from "react";
import { MifielWidget, defineCustomElements } from "@mifiel/widget-react";

/**
 * Renders the MiFiel Widget for digital signature.
 * - Supports both ESM, React props, and fallback listeners.
 * - Emits clear logs for widget loading/troubleshooting.
 */
export default function MifielWidgetClient({
  widgetId,
  onSuccess,
  onError,
  env = "production",
  successBtnText = "¡Documento firmado!"
}) {
  const widgetContainerRef = useRef();

  useEffect(() => {
    defineCustomElements(window);
  }, []);

  // Fallback listeners for event capture/debugging
  useEffect(() => {
    const widget = widgetContainerRef.current?.querySelector("mifiel-widget");
    if (!widget) return;
    function handleSuccess(e) {
      console.log("[MiFiel Widget] signSuccess event", e);
      if (onSuccess) onSuccess(e);
    }
    function handleError(e) {
      console.log("[MiFiel Widget] signError event", e);
      if (onError) onError(e);
    }
    widget.addEventListener("signSuccess", handleSuccess);
    widget.addEventListener("signError", handleError);
    return () => {
      widget.removeEventListener("signSuccess", handleSuccess);
      widget.removeEventListener("signError", handleError);
    };
    // eslint-disable-next-line
  }, [widgetId, widgetContainerRef.current, onSuccess, onError]);

  if (!widgetId) {
    console.warn("[MiFiel Widget] widgetId missing, widget will not render.");
    return null;
  }

  return (
    <div
      ref={widgetContainerRef}
      className="w-full rounded-lg border border-cyan-100 bg-white px-0 py-0 overflow-hidden shadow-sm"
    >
      <MifielWidget
        id={widgetId}
        environment={env}
        successBtnText={successBtnText}
        /* ESM event props, most React setups (after next-transpile-modules) */
        onSignSuccess={onSuccess}
        onSignError={onError}
        containerClass="w-full"
        style={{ display: "block", width: "100%", minHeight: 420 }}
      />
    </div>
  );
}
