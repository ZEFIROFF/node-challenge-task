import { Logger } from '@nestjs/common';
import { config } from 'dotenv';

import { PrismaService } from '../prisma.service';
import { TokenSeeder } from './token.seeder';

config();

const logger = new Logger('DatabaseSeeder');

async function seed() {
  const prisma = new PrismaService({ get: () => process.env } as any);

  try {
    const tokenSeeder = new TokenSeeder(prisma);
    await tokenSeeder.seed();
    logger.log('Database seeded successfully');
  } catch (error) {
    logger.error('Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
