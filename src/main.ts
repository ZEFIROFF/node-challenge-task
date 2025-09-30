import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    logger.log('Starting Token Price Service...');

    const app = await NestFactory.create(AppModule, {
      bufferLogs: true,
      logger: ['error', 'warn', 'log'],
    });

    app.useLogger(app.get(Logger));

    const configService = app.get(ConfigService);
    const nodeEnv = configService.get<string>('NODE_ENV', 'development');
    const port = configService.get<number>('PORT', 3000);
    const logLevel = configService.get<string>('LOG_LEVEL', 'log');

    // kjubth
    if (logLevel === 'debug') {
      app.useLogger(['error', 'warn', 'log', 'debug', 'verbose']);
    } else if (logLevel === 'verbose') {
      app.useLogger(['error', 'warn', 'log', 'verbose']);
    }

    app.enableShutdownHooks();

    await app.listen(port);

    logger.log(`🚀 Token Price Service is running on port ${port}`);
    logger.log(`📦 Environment: ${nodeEnv}`);
    logger.log(`🔗 Health check: http://localhost:${port}/health`);
  } catch (error) {
    logger.error(`❌ Failed to start application: ${error.message}`, error.stack);
    process.exit(1);
  }
}

bootstrap();
