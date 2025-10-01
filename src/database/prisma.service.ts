import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly configService: ConfigService) {
    const logLevel = configService.get<string>('PRISMA_LOG_LEVEL', 'warn');
    const isDevelopment = configService.get<string>('NODE_ENV') === 'development';

    super({
      log: isDevelopment ? [logLevel as any, 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    this.logger.log('Prisma client initialized');
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Disconnected from PostgreSQL database');
    } catch (error) {
      this.logger.error('Error during database disconnection:', error);
    }
  }

  async executeTransaction<T>(
    callback: (
      prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>,
    ) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(callback);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return false;
    }
  }

  async cleanDatabase(): Promise<void> {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new Error('Cannot clean database in production environment');
    }

    await this.$transaction(async (tx) => {
      await tx.outboxEvent.deleteMany();
      await tx.tokenPrice.deleteMany();
      await tx.token.deleteMany();
      await tx.logo.deleteMany();
      await tx.chain.deleteMany();
    });

    this.logger.log('Database cleaned successfully');
  }
}
