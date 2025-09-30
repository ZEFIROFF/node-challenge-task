import { Logger, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { CircuitBreakerModule } from './common/circuit-breaker';
import {
  appConfig,
  circuitBreakerConfig,
  databaseConfig,
  kafkaConfig,
  outboxConfig,
  validate,
} from './common/config';
import { GlobalExceptionFilter } from './common/exceptions/global-exception.filter';
import { HealthModule } from './common/health/health.module';
import { DatabaseModule } from './database/database.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { PriceModule } from './modules/price/price.module';
import { TokenModule } from './modules/token/token.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      cache: true,
      envFilePath: ['.env.local', '.env'],
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      load: [appConfig, databaseConfig, kafkaConfig, circuitBreakerConfig, outboxConfig],
    }),
    ScheduleModule.forRoot(),
    CircuitBreakerModule,
    DatabaseModule,
    TokenModule,
    MessagingModule,
    PriceModule,
    HealthModule,
  ],
  providers: [
    Logger,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    },
  ],
})
export class AppModule {}
