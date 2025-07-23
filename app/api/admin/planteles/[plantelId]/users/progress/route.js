
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import { stepsExpediente } from "@/components/stepMetaExpediente";

export async function GET(req, context) {
  const params = await context.params;
  const session = await getSessionFromCookies(req.cookies);

  if (!session || !["superadmin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const plantelId = Number(params.plantelId);
  if (!plantelId) return NextResponse.json({ error: "ID de plantel requerida" }, { status: 400 });

  if (session.role === "admin" && !(session.plantelesAdminIds || []).includes(plantelId)) {
    return NextResponse.json({ error: "Sin permiso sobre este plantel" }, { status: 403 });
  }

  try {
    // User and their checklistItems+docs
    const users = await prisma.user.findMany({
      where: { plantelId, role: { in: ["employee", "candidate"] } },
      select: {
        id: true, name: true, email: true, picture: true, role: true, isActive: true, plantelId: true,
        checklistItems: { select: { id: true, type: true, fulfilled: true, required: true, documentId: true } },
        documents: { select: { id: true, type: true, status: true } }
      },
      orderBy: { name: "asc" }
    });

    // Define keys for:
    const userDocumentKeys = stepsExpediente.filter(s => !s.adminUploadOnly && !s.isPlantelSelection).map(s => s.key);
    const adminOnlyKey = stepsExpediente.filter(s => s.adminUploadOnly).map(s => s.key)[0] || "proyectivos";

    // Compose per-user progress (user-part and admin-full part)
    const result = users.map(u => {
      // User part
      const checklist = userDocumentKeys.map(type =>
        u.checklistItems.find(c => c.type === type && c.required)
      );
      const userDoneCount = checklist.reduce((sum, c) => (c?.fulfilled ? sum + 1 : sum), 0);

      // Admin-only completion
      const hasProyectivos = !!u.documents.find(
        d => d.type === adminOnlyKey && d.status === "ACCEPTED"
      );

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        picture: u.picture,
        role: u.role,
        isActive: u.isActive,
        userProgress: {
          done: userDoneCount,
          total: userDocumentKeys.length,
          pct: userDocumentKeys.length > 0 ? Math.round((userDoneCount / userDocumentKeys.length) * 100) : 0,
          complete: userDoneCount === userDocumentKeys.length,
        },
        adminProgress: {
          proyectivosUploaded: hasProyectivos
        },
        fullyCompleted: userDoneCount === userDocumentKeys.length && hasProyectivos
      };
    });

    return NextResponse.json({ users: result });
  } catch (e) {
    console.error("[plantel users/progress][GET] Error:", e);
    return NextResponse.json({ error: "Error al consultar usuarios de plantel: " + (e.message || "desconocido") }, { status: 500 });
  }
}
