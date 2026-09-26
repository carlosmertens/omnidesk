import { PrismaPg } from '@prisma/adapter-pg';
import { z } from 'zod';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { hashPassword } from '../src/users/password.util.js';

// Runs outside Nest (so no ConfigService), but fails fast on missing/invalid
// vars the same way env.validation.ts does. Values come from apps/api/.env,
// loaded by prisma.config.ts's `import 'dotenv/config'`.
const seedEnv = z
  .object({
    DATABASE_URL: z.url(),
    SEED_ADMIN_EMAIL: z.email(),
    SEED_ADMIN_PASSWORD: z.string().min(8),
  })
  .parse(process.env);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: seedEnv.DATABASE_URL }),
});

async function main() {
  const passwordHash = await hashPassword(seedEnv.SEED_ADMIN_PASSWORD);

  // Upsert so re-running the seed is safe, and picks up a changed password.
  const admin = await prisma.user.upsert({
    where: { email: seedEnv.SEED_ADMIN_EMAIL },
    update: { passwordHash, role: 'ADMIN' },
    create: {
      email: seedEnv.SEED_ADMIN_EMAIL,
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log(`Seeded admin user ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
