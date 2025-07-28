
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

export async function PATCH(req, context) {
  const params = await context.params;
  const { userId } = params;
  const session = await getSessionFromCookies(req.cookies);
  if(!session || (session.role !== "admin" && session.role !== "superadmin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  let data;
  try { data = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const safeFields = [
    "rfc", "curp", "domicilioFiscal", "fechaIngreso",
    "puesto", "horarioLaboral", "plantelId", "nss"
  ];

  const nextData = {};
  for(const key of safeFields) {
    if(Object.prototype.hasOwnProperty.call(data, key)) nextData[key] = data[key];
  }

  // Load prev user
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { role: true, fechaIngreso: true }
  });

  // Convert empty fechaIngreso (from forms) to null
  if (nextData.fechaIngreso === "") nextData.fechaIngreso = null;

  // If fechaIngreso is being set and role is candidate, update to employee
  if (
    nextData.fechaIngreso &&
    user.role === "candidate"
  ) {
    nextData.role = "employee";
  }

  await prisma.user.update({
    where: { id: Number(userId) },
    data: nextData
  });

  return NextResponse.json({ ok: true });
}
