
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

function parseFechaIngreso(val) {
  // Accepts ""|null (returns null), string "YYYY-MM-DD", Date, or undefined
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    // Create in UTC (time 00:00:00)
    const parts = val.split("-");
    const d = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]));
    if (!isNaN(d)) return d;
    return null;
  }
  // Try parsing as date
  const d = new Date(val);
  return isNaN(d) ? null : d;
}

export async function PATCH(req, context) {
  const params = await context.params;
  const session = await getSessionFromCookies(req.cookies);

  if (!session || !["admin", "superadmin"].includes(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const userId = Number(params.userId);
  if (!userId) return NextResponse.json({ error: "userId inválido" }, { status: 400 });

  let data;
  try {
    data = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Defensive: only allow allowed fields
  const fields = [
    "rfc", "curp", "domicilioFiscal", "nss",
    "fechaIngreso", "puesto", "horarioLaboral", "plantelId"
  ];
  const toUpdate = {};
  for (const field of fields) {
    if (field in data) toUpdate[field] = data[field];
  }

  // Fix fechaIngreso for Prisma
  if ("fechaIngreso" in toUpdate) {
    toUpdate.fechaIngreso = parseFechaIngreso(toUpdate.fechaIngreso);
  }

  // Optional: convert empty plantelId to null
  if ("plantelId" in toUpdate) {
    if (toUpdate.plantelId === "" || toUpdate.plantelId === undefined) toUpdate.plantelId = null;
    else toUpdate.plantelId = Number(toUpdate.plantelId) || null;
  }

  // Auto-assign role=employee if fechaIngreso present and user was candidate
  if (
    (toUpdate.fechaIngreso !== undefined && toUpdate.fechaIngreso !== null && toUpdate.fechaIngreso !== "") ||
    (data.fechaIngreso !== undefined && data.fechaIngreso !== null && data.fechaIngreso !== "")
  ) {
    const existingUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (existingUser && existingUser.role === "candidate") {
      toUpdate.role = "employee";
    }
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: toUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plantelId: true,
        fechaIngreso: true,
        nss: true,
        puesto: true,
        rfc: true,
        curp: true,
        domicilioFiscal: true,
        horarioLaboral: true,
      },
    });
    return NextResponse.json({ ficha: user });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
