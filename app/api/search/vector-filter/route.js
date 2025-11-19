
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import { stepsExpediente } from "@/components/stepMetaExpediente";
import { embedTexts, l2Normalize, meanVectors, cosineSim } from "@/lib/openai";

/**
 * POST /api/search/vector-filter
 * Body: {
 *   userId: number,
 *   positives: string[],
 *   negatives?: string[],
 *   threshold?: number
 * }
 * Returns: { matchedDocTypes: string[], scores: Record<docType, number> }
 *
 * We embed a per-docType semantic text (label+description+aliases+light doc info)
 * against the averaged positive query and subtract similarity to averaged negative query.
 * Only admins/superadmins are allowed. Minimal logs for runtime verification.
 */

const ALIASES = {
  identificacion_oficial: ["INE", "identificación", "credencial", "pasaporte", "cédula"],
  foto_digital: ["foto", "avatar", "credencial", "perfil"],
  curp: ["identidad nacional", "clave unica", "clave CURP"],
  rfc: ["tributos", "impuestos", "SAT", "fiscal"],
  nss: ["seguro social", "IMSS", "número social"],
  acta_nacimiento: ["nacimiento", "certificado nacimiento"],
  comprobante_domicilio: ["domicilio", "recibo", "comprobante residencia"],
  certificado_medico: ["salud", "medicina", "apto", "certificado salud"],
  titulo_profesional: ["título", "cedula profesional", "certificado estudios", "diploma"],
  carta_recomendacion: ["recomendación", "constancia laboral", "referencias"],
  curriculum_vitae: ["cv", "curriculum", "hoja de vida"],
  carta_no_penales: ["no antecedentes", "penales", "no penales"],
  proyectivos: ["psicometría", "proyectivos", "evaluación psicológica"]
};

function buildDocTypeText(step) {
  const parts = [
    `Key: ${step.key}`,
    `Label: ${step.label || ""}`,
    `Description: ${step.description || ""}`,
  ];
  const aliases = ALIASES[step.key] || [];
  if (aliases.length) parts.push(`Aliases: ${aliases.join(", ")}`);
  return parts.join("\n");
}

function combineDocTypeInstance(step, docVersions = []) {
  // Versions may include reviewComment; fold brief info to bias embedding
  const latest = docVersions && docVersions.length ? docVersions[0] : null;
  const lines = [buildDocTypeText(step)];
  if (latest?.reviewComment) {
    lines.push(`ReviewComment: ${latest.reviewComment}`);
  }
  if (docVersions?.length) {
    lines.push(`Versions: ${docVersions.length}`);
  }
  return lines.join("\n");
}

export async function POST(req, context) {
  const params = await context?.params;
  const session = await getSessionFromCookies(req.cookies);
  if (!session || !["admin", "superadmin"].includes(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  let payload;
  try { payload = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }
  const userId = Number(payload?.userId || 0);
  const positives = Array.isArray(payload?.positives) ? payload.positives.filter(s => typeof s === "string" && s.trim().length > 0) : [];
  const negatives = Array.isArray(payload?.negatives) ? payload.negatives.filter(s => typeof s === "string" && s.trim().length > 0) : [];
  const threshold = typeof payload?.threshold === "number" ? payload.threshold : 0.18;

  if (!userId || positives.length === 0) {
    return NextResponse.json({ matchedDocTypes: [], scores: {}, info: "Missing userId or positives" }, { status: 200 });
  }

  // Admin must be scoped to this user's plantel (if admin, not superadmin)
  if (session.role === "admin") {
    try {
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { plantelId: true } });
      if (!u || !u.plantelId || !(session.plantelesAdminIds || []).includes(u.plantelId)) {
        return NextResponse.json({ error: "Sin permiso para este usuario" }, { status: 403 });
      }
    } catch (e) {
      return NextResponse.json({ error: "Error validando permisos" }, { status: 500 });
    }
  }

  // Load user's documents (to reflect per-doc review/comment/versions)
  let documentsByType = {};
  try {
    const docs = await prisma.document.findMany({
      where: { userId },
      orderBy: [{ uploadedAt: "desc" }],
      select: { id: true, type: true, version: true, uploadedAt: true, reviewComment: true, status: true }
    });
    for (const d of docs) {
      (documentsByType[d.type] ||= []).push(d);
    }
  } catch (e) {
    // fallback: no docs
    console.warn("[vector-filter] failed to fetch documents; proceeding without.", e?.message || e);
  }

  // Build target corpus (doc types), excluding "plantel" step
  const docSteps = stepsExpediente.filter(s => !s.isPlantelSelection);
  const targets = docSteps.map(s => ({
    key: s.key,
    text: combineDocTypeInstance(s, documentsByType[s.key] || [])
  }));

  // Prepare embeddings
  try {
    // Target embeddings
    const targetEmbeds = await embedTexts(targets.map(t => t.text));
    const targetNorms = targetEmbeds.map(l2Normalize);

    // Query embeddings
    const qPosEmbeds = await embedTexts(positives);
    const qPosMean = l2Normalize(meanVectors(qPosEmbeds));
    let qNegMean = null;
    if (negatives.length > 0) {
      const qNegEmbeds = await embedTexts(negatives);
      qNegMean = l2Normalize(meanVectors(qNegEmbeds));
    }

    // Score targets: simPos - simNegWeight
    const scores = {};
    const matched = [];
    const NEG_WEIGHT = 1.0; // weight of negative contribution

    for (let i = 0; i < targets.length; i++) {
      const simPos = cosineSim(targetNorms[i], qPosMean);
      const simNeg = qNegMean ? cosineSim(targetNorms[i], qNegMean) : 0;
      const score = simPos - (simNeg * NEG_WEIGHT);
      scores[targets[i].key] = score;
      if (score >= threshold) matched.push(targets[i].key);
    }

    console.log("[vector-filter] userId:", userId, "positives:", positives, "negatives:", negatives, "threshold:", threshold, "matches:", matched);

    return NextResponse.json({ matchedDocTypes: matched, scores });
  } catch (e) {
    console.error("[vector-filter] embedding/scoring failed:", e?.message || e);
    if (String(e?.message || "").includes("OPENAI_API_KEY")) {
      return NextResponse.json({ error: "OpenAI no configurado (OPENAI_API_KEY faltante)" }, { status: 501 });
    }
    return NextResponse.json({ error: "Error del servidor al calcular filtros semánticos" }, { status: 500 });
  }
}
