
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

// GET: Progress for all users assigned to a plantel (candidates/employees)
// Returns [{ id, name, email, picture, role, rfc, curp, domicilioFiscal, fechaIngreso, puesto, sueldo, horarioLaboral, checklistDone, checklistTotal, firmaReglamentoOk, firmaContratoOk, readyForApproval }]
export async function GET(req, context) {
  const params = await context.params;
  const { plantelId } = params;
  const session = await getSessionFromCookies(req.cookies);

  if (!session || !["superadmin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const pid = parseInt(plantelId, 10);
  if (!pid) return NextResponse.json({ error: "Plantel inválido" }, { status: 400 });

  // Admin: only allowed to see their planteles
  if (session.role === "admin" && !(session.plantelesAdminIds || []).includes(pid)) {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: ["employee", "candidate"] },
      plantelId: pid
    },
    select: {
      id: true,
      name: true,
      email: true,
      picture: true,
      role: true,
      rfc: true,
      curp: true,
      domicilioFiscal: true,
      fechaIngreso: true,
      puesto: true,
      sueldo: true,
      horarioLaboral: true,
      isApproved: true
    },
    orderBy: { name: "asc" }
  });

  if (!users.length) return NextResponse.json({ users: [] });

  const userIds = users.map(u => u.id);

  // Checklist progress
  const allChecklist = await prisma.checklistItem.findMany({
    where: { userId: { in: userIds }, required: true },
    select: { id: true, userId: true, fulfilled: true }
  });
  const checklistMap = {};
  for (const c of allChecklist) {
    if (!checklistMap[c.userId]) checklistMap[c.userId] = { done: 0, total: 0 };
    checklistMap[c.userId].total += 1;
    if (c.fulfilled) checklistMap[c.userId].done += 1;
  }

  // Signatures
  const allSigs = await prisma.signature.findMany({
    where: { userId: { in: userIds }, type: { in: ["reglamento", "contrato"] } },
    select: { id: true, userId: true, type: true, status: true }
  });
  const sigMap = {};
  for (const s of allSigs) {
    if (!sigMap[s.userId]) sigMap[s.userId] = {};
    const ok = ["signed", "completed"].includes(s.status);
    if (s.type === "reglamento") sigMap[s.userId].reglamento = ok;
    if (s.type === "contrato") sigMap[s.userId].contrato = ok;
  }

  // Determine readyForApproval and include all progress
  const enriched = users.map(u => {
    const fichaFilled =
      [u.rfc, u.curp, u.domicilioFiscal, u.fechaIngreso, u.puesto, u.sueldo, u.horarioLaboral]
        .filter(x => !!x && `${x}`.trim() !== "").length;

    const checks = checklistMap[u.id] || { done: 0, total: 0 };
    const firmaReglamentoOk = sigMap[u.id]?.reglamento || false;
    const firmaContratoOk = sigMap[u.id]?.contrato || false;

    // Requirements for "readyForApproval" (must match /admin/inicio)
    const readyForApproval =
      u.role === "candidate" &&
      !u.isApproved &&
      checks.total > 0 && checks.done === checks.total &&
      firmaContratoOk;

    return {
      ...u,
      checklistDone: checks.done,
      checklistTotal: checks.total,
      firmaReglamentoOk,
      firmaContratoOk,
      readyForApproval
    };
  });

  return NextResponse.json({ users: enriched });
}
