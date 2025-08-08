
import mysql from "mysql2/promise";
import { NextResponse } from "next/server";

const MAIN_DB = {
  host: "casitaiedis.edu.mx",
  user: "root",
  password: "Nicole10*",
  database: "expedientes_digitales",
  waitForConnections: true,
  connectionLimit: 5,
};

const PATH_DB = {
  host: "casitaiedis.edu.mx",
  user: "root",
  password: "Nicole10*",
  database: "reclutamiento",
  waitForConnections: true,
  connectionLimit: 5,
};

const ECO_CATALOGO_ID = 1;
const MMPI_CATALOGO_ID = 2;

export async function GET(req, context) {
  const params = await context.params;
  const userId = params.userId;
  let mainDb, pathDb;
  try {
    mainDb = await mysql.createPool(MAIN_DB);
    pathDb = await mysql.createPool(PATH_DB);

    // Find user and pathId
    const [users] = await mainDb.query("SELECT pathId FROM `user` WHERE id = ?", [userId]);
    if (!users.length || !users[0].pathId) {
      return NextResponse.json({ error: "User or pathId not found" }, { status: 404 });
    }
    const pathId = users[0].pathId;

    // Lookup latest completed ECO/MMPI with code for this candidate
    const [pruebas] = await pathDb.query(
      `SELECT id, code, catalogo_id
         FROM pruebas
        WHERE candidato_id = ? AND completada = 1 AND code IS NOT NULL AND catalogo_id IN (?, ?)
        ORDER BY pubdate DESC`,
      [pathId, ECO_CATALOGO_ID, MMPI_CATALOGO_ID]
    );

    let ecoUrl = null, mmpiUrl = null;
    for (const p of pruebas) {
      if (p.catalogo_id === ECO_CATALOGO_ID && !ecoUrl) {
        ecoUrl = `https://reclutamiento.casitaapps.com/resultados/${pathId}_${p.id}_${p.code}.pdf`;
      }
      if (p.catalogo_id === MMPI_CATALOGO_ID && !mmpiUrl) {
        mmpiUrl = `https://reclutamiento.casitaapps.com/resultados-rf/${pathId}_${p.id}_${p.code}.pdf`;
      }
      if (ecoUrl && mmpiUrl) break;
    }

    return NextResponse.json({ ecoUrl, mmpiUrl, foundPathId: pathId });
  } catch (err) {
    console.error("[dictamens-api] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    try { await mainDb?.end(); } catch {}
    try { await pathDb?.end(); } catch {}
  }
}
