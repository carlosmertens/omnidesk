import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { hashPassword } from '../src/users/password.util.js';

const SEED_ADMIN_EMAIL = 'admin@example.com';
const SEED_ADMIN_PASSWORD = 'SeedPass#1234';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL'] }),
});

async function main() {
  const admin = await prisma.user.create({
    data: {
      email: SEED_ADMIN_EMAIL,
      passwordHash: await hashPassword(SEED_ADMIN_PASSWORD),
      role: 'ADMIN',
    },
  });

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
