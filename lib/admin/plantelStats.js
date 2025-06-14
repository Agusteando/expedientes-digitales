
import prisma from "@/lib/prisma";

/**
 * Returns all planteles with basic progress and user info, sorted by name.
 * Employees considered: active users with role "employee" or "candidate".
 */
export async function fetchAllPlantelStats() {
  // Get all planteles
  const planteles = await prisma.plantel.findMany({
    include: {
      users: {
        where: {
          isActive: true,
          role: { in: ["employee", "candidate"] }, // Match enum values in your schema!
        },
        include: {
          checklistItems: true,
          signatures: true,
        },
        orderBy: {
          name: "asc",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // For each plantel, calculate progress
  return planteles.map((plantel) => {
    const employees = plantel.users;
    const total = employees.length;
    const completed = employees.filter((user) => {
      // Completed if ALL required checklist items are fulfilled
      const required = user.checklistItems?.filter((c) => c.required) || [];
      return required.length > 0 && required.every((c) => c.fulfilled);
    }).length;
    return {
      ...plantel,
      progress: { total, completed },
      employees,
    };
  });
}

/**
 * Returns all active users with no plantel assigned and role "employee" or "candidate".
 */
export async function fetchUnassignedUsers() {
  return await prisma.user.findMany({
    where: {
      isActive: true,
      plantelId: null,
      role: { in: ["employee", "candidate"] }, // Match enum values in your schema!
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });
}
