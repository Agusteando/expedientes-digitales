
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

// POST body: { items: string[], mode: "merge" | "replace" }
// - merge: upsert items to active=true, do not deactivate others
// - replace: deactivate all existing, then upsert items and set active=true
export async function POST(req, context) {
  const params = await context?.params;
  const session = await getSessionFromCookies(req.cookies);
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  let data;
  try { data = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  let items = Array.isArray(data?.items) ? data.items : [];
  const mode = data?.mode === "replace" ? "replace" : "merge";

  items = items
    .map(x => (typeof x === "string" ? x : ""))
    .map(x => x.trim())
    .filter(x => !!x && x.length >= 2);
  // Deduplicate case-insensitively by normalized signature
  const seen = new Set();
  const deduped = [];
  for (const n of items) {
    const key = n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (!seen.has(key)) { seen.add(key); deduped.push(n); }
  }

  try {
    if (mode === "replace") {
      await prisma.puesto.updateMany({ data: { active: false }, where: {} });
    }
    // Load all current (for case-insensitive match)
    const current = await prisma.puesto.findMany({ select: { id: true, name: true, active: true } });
    const currentMap = new Map(current.map(p => [p.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(), p]));

    let created = 0, reactivated = 0, unchanged = 0;
    for (const name of deduped) {
      const key = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const match = currentMap.get(key);
      if (!match) {
        await prisma.puesto.create({ data: { name, active: true } });
        created++;
      } else {
        if (!match.active || match.name !== name) {
          await prisma.puesto.update({ where: { id: match.id }, data: { name, active: true } });
          reactivated++;
        } else {
          // ensure active in replace mode also
          if (mode === "replace" && !match.active) {
            await prisma.puesto.update({ where: { id: match.id }, data: { active: true } });
            reactivated++;
          } else {
            unchanged++;
          }
        }
      }
    }
    console.log("[puestos/import][POST]", { mode, input: items.length, deduped: deduped.length, created, reactivated, unchanged });

    return NextResponse.json({ ok: true, stats: { mode, input: items.length, deduped: deduped.length, created, reactivated, unchanged } });
  } catch (e) {
    return NextResponse.json({ error: "Error al importar puestos" }, { status: 500 });
  }
}
