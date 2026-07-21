
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedTower } from './seed-tower';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

function buildStarterGrid(): number[][] {
  const WALL = 1;
  const EMPTY = 0;
  const EXIT = 2;
  const SPAWN = 3;
  const SIZE = 25;

  return Array.from({ length: SIZE }, (_, row) =>
    Array.from({ length: SIZE }, (_, col) => {
      if (row === 0 || row === SIZE - 1 || col === 0 || col === SIZE - 1) return WALL;
      if (row === 1 && col === 1) return SPAWN;
      if (row === 23 && col === 23) return EXIT;
      return EMPTY;
    }),
  );
}

async function main(): Promise<void> {
  await prisma.$connect();

  const [hash1, hash2] = await Promise.all([
    bcrypt.hash('Password123!', SALT_ROUNDS),
    bcrypt.hash('Password456!', SALT_ROUNDS),
  ]);

  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      username: 'alice',
      password_hash: hash1,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      username: 'bob',
      password_hash: hash2,
    },
  });

  const adminMap = await prisma.adminMap.upsert({
    where: { order_index: 1 },
    update: {},
    create: {
      order_index: 1,
      name: 'The Depths — Level 1',
      grid_json: JSON.stringify(buildStarterGrid()),
    },
  });

  console.log('Seeded users:', user1.username, user2.username);
  console.log('Seeded admin map:', adminMap.name);

  await seedTower(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
