
/**
 * Prisma Seed Script to create superadmin users from environment variable list.
 * This must be invoked with: npx prisma db seed
 *
 * Environment variable: SUPERADMIN_EMAILS (comma-separated)
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Use comma-separated env var for superadmin emails, fallback to empty array
  const superadminEmails = process.env.SUPERADMIN_EMAILS
    ? process.env.SUPERADMIN_EMAILS.split(",").map(e => e.trim().toLowerCase()).filter(Boolean)
    : [];

  for (const email of superadminEmails) {
    if (!email.endsWith("@casitaiedis.edu.mx")) {
      console.log(`[seed] Skipping non-institutional superadmin: ${email}`);
      continue;
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.role !== "superadmin") {
        await prisma.user.update({
          where: { email },
          data: { role: "superadmin", isActive: true },
        });
        console.log(`[seed] Upgraded admin to superadmin: ${email}`);
      } else {
        console.log(`[seed] Superadmin exists (no action): ${email}`);
      }
    } else {
      await prisma.user.create({
        data: {
          name: "Superadmin",
          email,
          isActive: true,
          role: "superadmin",
        }
      });
      console.log(`[seed] Created new superadmin: ${email}`);
    }
  }
}

main()
  .then(() => {
    console.log("[seed] Superadmin seeding done.");
    return prisma.$disconnect();
  })
  .catch(e => {
    console.error("[seed] Seeding error", e);
    prisma.$disconnect();
    process.exit(1);
  });
