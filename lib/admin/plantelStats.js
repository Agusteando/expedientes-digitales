
import prisma from "@/lib/prisma";

/**
 * Returns stats for each plantel:
 * - id, name, employees[], completedEmployeeIds[]
 * - completion: { completed, total, percent }
 * Will also return per-employee step/checklist completion.
 */
export async function fetchAllPlantelStats() {
  // Get all planteles
  const planteles = await prisma.plantel.findMany({
    include: {
      users: {
        where: { isActive: true, role: { in: ["EMPLOYEE", "employee", "candidate"] } },
        include: {
          checklistItems: true,
          signatures: true,
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  // For progress computation (full expediente is all checklists fulfilled and all signable signed)
  function isExpedienteComplete(user) {
    if (!user.checklistItems || user.checklistItems.length < 10) return false;
    const allChecklist = user.checklistItems.filter(x => x.required !== false);
    if (!allChecklist.every(x => x.fulfilled)) return false;
    const contractSignature = user.signatures.find(s => s.type === "contrato" && ["completed", "signed"].includes(s.status));
    const reglamentoSignature = user.signatures.find(s => s.type === "reglamento" && ["completed", "signed"].includes(s.status));
    return Boolean(contractSignature && reglamentoSignature);
  }

  // Aggregate stats per plantel
  return planteles.map(plantel => {
    const employees = plantel.users;
    const completed = employees.filter(isExpedienteComplete);
    return {
      id: plantel.id,
      name: plantel.name,
      employees: employees.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        picture: u.picture,
        checklistItems: u.checklistItems,
        signatures: u.signatures,
        isActive: u.isActive,
        role: u.role,
        expedienteComplete: isExpedienteComplete(u)
      })),
      progress: {
        total: employees.length,
        completed: completed.length,
        percent: employees.length === 0 ? 0 : Math.round((completed.length / employees.length) * 100),
      }
    };
  });
}

/**
 * Fetches all users with no assigned plantel, one page sorted by createdAt.
 */
export async function fetchUnassignedUsers() {
  return prisma.user.findMany({
    where: {
      plantelId: null,
      isActive: true,
      role: { in: ["EMPLOYEE", "employee", "candidate"] }
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, picture: true, createdAt: true, role: true
    }
  });
}
