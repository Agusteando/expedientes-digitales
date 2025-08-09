
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import ExcelJS from "exceljs";
import { stepsExpediente } from "@/components/stepMetaExpediente";

// Helper to convert 1-based column index to Excel column letter (A, B, ..., Z, AA, AB, ..., AZ, BA, ...)
function excelColName(n) {
  let s = "";
  while (n > 0) {
    let m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

// GET: returns Excel file (with application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
// superadmin: all planteles/users; admin: limited per plantelesAdminIds
export async function GET(req) {
  const session = await getSessionFromCookies(req.cookies);
  if (!session || !["admin", "superadmin"].includes(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Master checklist, in order
  const checklistMeta = stepsExpediente.filter(s => !s.isPlantelSelection);
  const docKeys = checklistMeta.map(s => s.key);

  // Total keys: docKeys + extra system fields for progress
  const extraFields = [
    { key: "evaId", label: "Evaluatest" },
    { key: "pathId", label: "PATH" },
    { key: "proyectivos", label: "Proyectivos" }
  ];

  // fetch planteles
  const planteles = await prisma.plantel.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true }
  });
  let permittedPlantelIds = planteles.map(p => p.id);
  if (session.role === "admin" && Array.isArray(session.plantelesAdminIds)) {
    permittedPlantelIds = session.plantelesAdminIds;
  }

  // fetch users (employee & candidate) per plantel, now with new ordering and extra fields
  const users = await prisma.user.findMany({
    where: {
      role: { in: ["candidate", "employee"] },
      plantelId: { in: permittedPlantelIds }
    },
    select: {
      id: true,
      apellidoPaterno: true,
      apellidoMaterno: true,
      nombres: true,
      name: true, // fallback for legacy, do not use in Excel
      email: true,
      picture: true,
      role: true,
      plantelId: true,
      isActive: true,
      evaId: true,
      pathId: true,
      checklistItems: { select: { type: true, fulfilled: true } },
      documents: { select: { type: true, status: true, version: true, uploadedAt: true } },
      createdAt: true, updatedAt: true
    },
    orderBy: [
      { apellidoPaterno: "asc" },
      { apellidoMaterno: "asc" },
      { nombres: "asc" }
    ]
  });

  // group by plantelId
  const usersByPlantel = {};
  for (const u of users) {
    const pid = u.plantelId || "Sin Plantel";
    if (!usersByPlantel[pid]) usersByPlantel[pid] = [];
    usersByPlantel[pid].push(u);
  }

  // prepare workbook
  const wb = new ExcelJS.Workbook();
  wb.creator = "IECS-IEDIS";
  wb.created = new Date();
  // Build master header row: apellidoPaterno, apellidoMaterno, nombres, then static fields, then all checklist/fields, then missing, progress, status
  const header = [
    "Apellido paterno",
    "Apellido materno",
    "Nombres",
    "plantel",
    "correo",
    "rol",
    "estatus",
    "completados",
    "total",
    "progreso (%)",
    ...checklistMeta.map(s => s.label),
    ...extraFields.map(f => f.label),
    "Faltantes (CSV)",
    "Última actualización"
  ];

  for (const plantel of planteles) {
    const pUsers = (usersByPlantel[plantel.id] || []);
    if (pUsers.length === 0) continue;
    // Add worksheet
    const ws = wb.addWorksheet(plantel.name);

    ws.addRow(header);
    ws.getRow(1).font = { bold: true };

    for (const u of pUsers) {
      const checklistByType = {};
      for (const c of u.checklistItems) checklistByType[c.type] = c.fulfilled;
      // Find latest version of each doc type per user
      const docsByType = {};
      for (const d of [...u.documents].sort((a, b) => (b.version ?? 1) - (a.version ?? 1))) {
        if (!docsByType[d.type]) docsByType[d.type] = d;
      }
      // gather checklist completion
      let done = 0, total = checklistMeta.length + extraFields.length;
      const perDocStatus = [];
      for (const s of checklistMeta) {
        let fulfilled = checklistByType[s.key] || false;
        if (fulfilled) done++;
        perDocStatus.push(fulfilled ? "✓" : "—");
      }
      // extra fields
      let evaField = u.evaId ? "✓" : "—";
      let pathField = u.pathId ? "✓" : "—";
      let proyField = (docsByType.proyectivos ? "✓" : "—");
      if (u.evaId) done++;
      if (u.pathId) done++;
      if (docsByType.proyectivos) done++;

      // missing docs: list of missing checklistMeta + extra (where field is falsy)
      const missing = [];
      for (const s of checklistMeta) {
        if (!checklistByType[s.key]) missing.push(s.label);
      }
      if (!u.evaId) missing.push("Evaluatest");
      if (!u.pathId) missing.push("PATH");
      if (!docsByType.proyectivos) missing.push("Proyectivos");

      // status
      const status = u.isActive ? "Activo" : "Baja";
      const percent = Math.round((done * 100) / total);

      // Resolve fields safely
      const apellidoPaterno = u.apellidoPaterno || "";
      const apellidoMaterno = u.apellidoMaterno || "";
      const nombres = u.nombres || "";

      ws.addRow([
        apellidoPaterno,
        apellidoMaterno,
        nombres,
        plantel.name,
        u.email,
        u.role === "employee" ? "Empleado" : "Candidato",
        status,
        done,
        total,
        percent,
        ...perDocStatus,
        evaField, pathField, proyField,
        missing.join(", "),
        u.updatedAt ? u.updatedAt.toLocaleString("es-MX") : ""
      ]);
    }
    // auto width for each column: (max cell length + 2) capped at [12,50]
    ws.columns.forEach(col => {
      let max = 10;
      col.eachCell({ includeEmpty: true }, cell => {
        const len = String(cell.value || "").length;
        if (len > max) max = len;
      });
      col.width = Math.max(12, Math.min(max + 2, 50));
    });
    // Set autofilter range: from A1 to last column/row1
    const lastColLetter = excelColName(header.length);
    ws.autoFilter = { from: "A1", to: `${lastColLetter}1` };
  }

  // "Sin Plantel" sheet if any
  if (usersByPlantel["Sin Plantel"]) {
    const ws = wb.addWorksheet("Sin Plantel");
    ws.addRow(header);
    ws.getRow(1).font = { bold: true };
    for (const u of usersByPlantel["Sin Plantel"]) {
      const checklistByType = {};
      for (const c of u.checklistItems) checklistByType[c.type] = c.fulfilled;
      const docsByType = {};
      for (const d of [...u.documents].sort((a, b) => (b.version ?? 1) - (a.version ?? 1))) {
        if (!docsByType[d.type]) docsByType[d.type] = d;
      }
      let done = 0, total = checklistMeta.length + extraFields.length;
      const perDocStatus = [];
      for (const s of checklistMeta) {
        let fulfilled = checklistByType[s.key] || false;
        if (fulfilled) done++;
        perDocStatus.push(fulfilled ? "✓" : "—");
      }
      let evaField = u.evaId ? "✓" : "—";
      let pathField = u.pathId ? "✓" : "—";
      let proyField = (docsByType.proyectivos ? "✓" : "—");
      if (u.evaId) done++;
      if (u.pathId) done++;
      if (docsByType.proyectivos) done++;

      const missing = [];
      for (const s of checklistMeta) {
        if (!checklistByType[s.key]) missing.push(s.label);
      }
      if (!u.evaId) missing.push("Evaluatest");
      if (!u.pathId) missing.push("PATH");
      if (!docsByType.proyectivos) missing.push("Proyectivos");

      const status = u.isActive ? "Activo" : "Baja";
      const percent = Math.round((done * 100) / total);

      const apellidoPaterno = u.apellidoPaterno || "";
      const apellidoMaterno = u.apellidoMaterno || "";
      const nombres = u.nombres || "";

      ws.addRow([
        apellidoPaterno,
        apellidoMaterno,
        nombres,
        "Sin Plantel",
        u.email,
        u.role === "employee" ? "Empleado" : "Candidato",
        status,
        done,
        total,
        percent,
        ...perDocStatus,
        evaField, pathField, proyField,
        missing.join(", "),
        u.updatedAt ? u.updatedAt.toLocaleString("es-MX") : ""
      ]);
    }
    ws.columns.forEach(col => {
      let max = 10;
      col.eachCell({ includeEmpty: true }, cell => {
        const len = String(cell.value || "").length;
        if (len > max) max = len;
      });
      col.width = Math.max(12, Math.min(max + 2, 50));
    });
    const lastColLetter = excelColName(header.length);
    ws.autoFilter = { from: "A1", to: `${lastColLetter}1` };
  }

  // Compose to buffer and return
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ExpedientePorPlantel_${new Date().toISOString().slice(0,10)}.xlsx"`
    }
  });
}
