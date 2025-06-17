
import prisma from "@/lib/prisma";

/**
 * Returns all planteles with both candidate and employee user info, sorted by name.
 */
export async function fetchAllPlantelStats() {
  const planteles = await prisma.plantel.findMany({
    include: {
      users: {
        where: {
          isActive: true,
          role: { in: ["employee", "candidate"] },
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

  // Calculate progress for each plantel
  return planteles.map((plantel) => {
    const employees = plantel.users;
    const total = employees.length;
    const completed = employees.filter((user) => {
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
 * Returns all active users with no plantel assigned and role "employee" OR "candidate".
 */
export async function fetchUnassignedUsers() {
  return await prisma.user.findMany({
    where: {
      isActive: true,
      plantelId: null,
      role: { in: ["employee", "candidate"] },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true, isApproved: true },
  });
}
