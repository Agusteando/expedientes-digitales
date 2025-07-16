
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

/**
 * Returns all assigned users for a plantel, with:
 * - User ficha fields
 * - checklist fulfillment count
 * - checklist requirements stats
 * - signature status for reglamento/contrato
 * - readyForApproval boolean
 */
export async function GET(req, context) {
  const params = await context.params;
  const session = await getSessionFromCookies(req.cookies);

  console.debug("[plantel users/progress][GET] session:",
    session ? `{id:${session.id},role:${session.role}}` : "none",
    "plantelId:", params?.plantelId
  );

  if (!session || !["superadmin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const plantelId = Number(params.plantelId);
  if (!plantelId) return NextResponse.json({ error: "ID de plantel requerida" }, { status: 400 });

  // Admins: only allow access to permitted planteles
  if (session.role === "admin" && !(session.plantelesAdminIds || []).includes(plantelId)) {
    return NextResponse.json({ error: "Sin permiso sobre este plantel" }, { status: 403 });
  }

  try {
    // Fetch all users for this plantel (candidates & employees)
    const users = await prisma.user.findMany({
      where: { plantelId, role: { in: ["employee", "candidate"] } },
      select: {
        id: true,
        name: true,
        email: true,
        picture: true,
        role: true,
        isActive: true,
        rfc: true,
        curp: true,
        domicilioFiscal: true,
        fechaIngreso: true,
        puesto: true,
        sueldo: true,
        horarioLaboral: true,
        checklistItems: {
          select: { id: true, type: true, fulfilled: true, required: true }
        },
        signatures: {
          select: { id: true, type: true, status: true }
        }
      },
      orderBy: { name: "asc" }
    });

    // Steps/checklist required keys as in your step definition
    const stepsExpediente = require("@/components/stepMetaExpediente").stepsExpediente;
    const checklistRequiredKeys = stepsExpediente
      .filter(s => !s.signable && !s.isPlantelSelection)
      .map(s => s.key);

    // Annotate each user with progress/computed data (matrix expects signature stats)
    const usersWithProgress = users.map(u => {
      // Ficha fields
      const fichaFields = [
        u.rfc, u.curp, u.domicilioFiscal, u.fechaIngreso, u.puesto, u.sueldo, u.horarioLaboral
      ];
      // Checklist progress
      const reqCheck = checklistRequiredKeys;
      const checklistTotal = reqCheck.length;
      const checklistDone = u.checklistItems.filter(
        item => item.fulfilled && reqCheck.includes(item.type)
      ).length;

      // Signature status for reglamento & contrato
      const firmaReglamentoOk = !!u.signatures.find(
        sig => sig.type === "reglamento" && ["signed", "completed"].includes(sig.status)
      );
      const firmaContratoOk = !!u.signatures.find(
        sig => sig.type === "contrato" && ["signed", "completed"].includes(sig.status)
      );

      // "Ready to approve": candidate, active, checklist ok, both signatures ok
      const readyForApproval =
        u.role === "candidate"
        && !!u.isActive
        && checklistDone === checklistTotal
        && firmaReglamentoOk
        && firmaContratoOk;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        picture: u.picture,
        role: u.role,
        isActive: u.isActive,
        rfc: u.rfc,
        curp: u.curp,
        domicilioFiscal: u.domicilioFiscal,
        fechaIngreso: u.fechaIngreso,
        puesto: u.puesto,
        sueldo: u.sueldo,
        horarioLaboral: u.horarioLaboral,
        checklistDone,
        checklistTotal,
        firmaReglamentoOk,
        firmaContratoOk,
        readyForApproval
      };
    });

    return NextResponse.json({ users: usersWithProgress });
  } catch (e) {
    console.error("[plantel users/progress][GET] Error:", e);
    return NextResponse.json({ error: "Error al consultar usuarios de plantel: " + (e.message || "desconocido") }, { status: 500 });
  }
}
