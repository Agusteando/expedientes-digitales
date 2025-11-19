
/**
 * Minimal OpenAI Embeddings client using fetch (no SDK dependency).
 * Reads OPENAI_API_KEY from env; provides embedTexts() and helpers.
 */

export async function embedTexts(texts, { model = "text-embedding-3-small", signal } = {}) {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error("embedTexts: 'texts' must be a non-empty array of strings.");
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not set.");
  }

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      input: texts,
      model
    })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI embeddings error: ${res.status} ${txt.slice(0, 300)}`);
  }
  const data = await res.json();
  const vectors = (data.data || []).map(d => d.embedding);
  return vectors;
}

export function l2Normalize(vec) {
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / norm);
}

export function meanVectors(vectors) {
  if (!Array.isArray(vectors) || vectors.length === 0) return null;
  const dim = vectors[0].length;
  const acc = new Array(dim).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) acc[i] += v[i];
  }
  return acc.map(x => x / vectors.length);
}

export function cosineSim(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // if pre-normalized inputs
}
