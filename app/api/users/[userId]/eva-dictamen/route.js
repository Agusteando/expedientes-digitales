
import { NextResponse } from "next/server";
const { getSigniaPool, getEva, waitEva } = require("../../../shared");

// Retry loop: transient errors defined below, with random backoff.
const isTransient = (e, code) => {
  const msg = String((e && e.message ? e.message : e) || "").toLowerCase();
  if (
    /timeout|session.*closed|protocol error|target closed|execution context.*destroyed|econnreset|etimedout|eai_again/.test(msg) ||
    code === 408 || code === 502 || code === 503 || code === 504 ||
    // Buffer.from "first argument..." and any base64 error considered transient
    /the first argument must be of type string.*buffer/i.test(msg) ||
    /base64/.test(msg)
  ) {
    return true;
  }
  return false;
};

export async function GET(req, context) {
  const params = await context.params;
  const userId = params.userId;
  let signiaPool;
  let eva;
  let attempt = 0, maxAttempts = 3;
  const startedAt = Date.now();

  let pdfBuffer = null;
  let attempts = 0;
  for (; attempt < maxAttempts; attempt++) {
    let err = null;
    let sizeBytes = 0;
    try {
      console.log(`[ATTEMPT] EVA dictamen dload: userId=${userId} try=${attempt+1}/${maxAttempts}`);

      signiaPool = getSigniaPool();
      // Find user's evaId
      const [[user]] = await signiaPool.query("SELECT evaId FROM `user` WHERE id=?", [userId]);
      if (!user || !user.evaId) {
        console.log(`[EXIT.FAIL] userId=${userId} evaId not found (attempts=${attempt+1})`);
        return new NextResponse("EVA ID no encontrado para este usuario", { status: 404 });
      }
      eva = getEva();
      await waitEva(eva);

      // Download PDF (may throw)
      pdfBuffer = await eva.downloadPDF(user.evaId);

      sizeBytes = pdfBuffer ? pdfBuffer.length : 0;
      const took = Date.now() - startedAt;
      console.log(`[EXIT.SUCCESS] userId=${userId} attempts=${attempt+1} duration=${took}ms size=${sizeBytes}`);
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="eva_dictamen_${user.evaId}.pdf"`,
          "Cache-Control": "no-store, must-revalidate",
        }
      });
    } catch (e) {
      attempts++;
      let code = (typeof e === "object" ? (e.code || e.statusCode) : undefined);
      if (
        (e && e.message && e.message.match(/captcha|interstitial/i)) ||
        (typeof e === "string" && e.match(/captcha|interstitial/i))
      ) {
        const took = Date.now() - startedAt;
        console.log(`[EXIT.FAIL] userId=${userId} CAPTCHA/INTERSTITIAL (attempts=${attempt+1} duration=${took}ms)`);
        return new NextResponse("Evaluatest requiere interacción CAPTCHA/interstitial", { status: 428 });
      }
      if (attempt + 1 < maxAttempts && isTransient(e, code)) {
        const backoff = 1000 + 700 * attempt + Math.floor(Math.random() * 150);
        console.log(`[RETRY] userId=${userId} transient error (attempt=${attempt+1} next in ${backoff}ms): ${(e&&e.message)||e}`);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      // Not transient or retry exhausted
      const took = Date.now() - startedAt;
      let finalMsg = `[EXIT.FAIL] userId=${userId} err="${(e && e.message) || e}" attempts=${attempt+1} duration=${took}ms`;
      if (pdfBuffer) finalMsg += ` size=${pdfBuffer.length}`;
      console.log(finalMsg);
      // If known not-found, 404
      if (e && e.message && e.message.match(/not found|cid not found|id no encontrado/i)) {
        return new NextResponse("EVA ID no encontrado para este usuario", { status: 404 });
      }
      return new NextResponse("Error interno del servidor", { status: 500 });
    }
  }
}