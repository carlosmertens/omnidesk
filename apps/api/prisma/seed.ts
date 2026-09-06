import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { hashPassword } from '../src/users/password.util.js';

const SEED_WORKSPACE_NAME = 'Acme Support';
const SEED_ADMIN_EMAIL = 'admin@acme.test';
const SEED_ADMIN_PASSWORD = 'password123';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL'] }),
});

async function main() {
  const workspace = await prisma.workspace.create({
    data: { name: SEED_WORKSPACE_NAME },
  });

  const admin = await prisma.user.create({
    data: {
      workspaceId: workspace.id,
      email: SEED_ADMIN_EMAIL,
      passwordHash: await hashPassword(SEED_ADMIN_PASSWORD),
      role: 'ADMIN',
    },
  });

  console.log(`Seeded workspace "${workspace.name}" (${workspace.id})`);
  console.log(`Seeded admin user ${admin.email} (password: ${SEED_ADMIN_PASSWORD})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
