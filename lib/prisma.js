import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

function addConnectionLimit(databaseUrl) {
  if (!databaseUrl || databaseUrl.includes("connection_limit=")) {
    return databaseUrl;
  }

  const separator = databaseUrl.includes("?") ? "&" : "?";
  return `${databaseUrl}${separator}connection_limit=1`;
}

const datasourceUrl = addConnectionLimit(process.env.DATABASE_URL);

const prismaClientOptions = datasourceUrl
  ? {
      datasources: {
        db: {
          url: datasourceUrl,
        },
      },
    }
  : undefined;

const prisma = globalForPrisma.prisma || new PrismaClient(prismaClientOptions);

globalForPrisma.prisma = prisma;

export default prisma;
