
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const checklistTypes = [
    "Identificación oficial (INE, pasaporte o cédula profesional)",
    "CURP (Clave Única de Registro de Población)",
    "RFC (Registro Federal de Contribuyentes)",
    "Número de Seguridad Social (NSS)",
    "Acta de nacimiento",
    "Comprobante de domicilio",
    "Certificado médico",
    "Título profesional o certificados de estudios",
    "Cartas de recomendación y/o constancias de trabajo",
    "Fotografías tamaño infantil",
    "Carta de antecedentes no penales"
  ];

  // Create Plantel
  const plantel = await prisma.plantel.upsert({
    where: { name: "Plantel Central" },
    update: {},
    create: {
      name: "Plantel Central"
    }
  });

  // Seed Super Admins
  await prisma.user.createMany({
    data: [
      {
        email: 'desarrollo.tecnologico@casitaiedis.edu.mx',
        name: 'Desarrollo Tecnológico',
        picture: '',
        role: 'SUPERADMIN',
        isActive: true,
        plantelId: null
      },
      {
        email: 'coord.admon@casitaiedis.edu.mx',
        name: 'Coordinación Administrativa',
        picture: '',
        role: 'SUPERADMIN',
        isActive: true,
        plantelId: null
      }
    ],
    skipDuplicates: true
  });

  // Seed Dummy Admin
  await prisma.user.upsert({
    where: { email: 'admin.central@casitaiedis.edu.mx' },
    update: {},
    create: {
      email: 'admin.central@casitaiedis.edu.mx',
      name: 'Admin Central',
      picture: '',
      role: 'ADMIN',
      isActive: true,
      plantelId: plantel.id
    }
  });

  // Seed Dummy Employee with full checklist
  const employee = await prisma.user.upsert({
    where: { email: 'juan.perez@casitaiedis.edu.mx' },
    update: {},
    create: {
      email: 'juan.perez@casitaiedis.edu.mx',
      name: 'Juan Pérez',
      picture: '',
      role: 'EMPLOYEE',
      isActive: true,
      plantelId: plantel.id
    }
  });

  for (const type of checklistTypes) {
    await prisma.checklistItem.create({
      data: {
        userId: employee.id,
        type: type,
        required: true
      }
    });
  }

  console.log("✅ Seed complete: 2 superadmins, 1 admin, 1 employee, 11 checklist items.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
