import { Logger, Module, ValidationPipe } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { APP_FILTER, APP_PIPE } from "@nestjs/core";
import { DatabaseModule } from "./database/database.module";
import { TokenModule } from "./modules/token/token.module";
import { MessagingModule } from "./modules/messaging/messaging.module";
import { PriceModule } from "./modules/price/price.module";
import { HealthModule } from "./common/health/health.module";
import { CircuitBreakerModule } from "./common/circuit-breaker";
import { GlobalExceptionFilter } from "./common/exceptions/global-exception.filter";
import { validate } from "./common/config/validation/env.validation";
import { appConfig } from "./common/config/app.config";
import { databaseConfig } from "./common/config/database.config";
import { kafkaConfig } from "./common/config/kafka.config";
import { circuitBreakerConfig } from "./common/config/circuit-breaker.config";
import { outboxConfig } from "./common/config/outbox.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      cache: true,
      envFilePath: [".env.local", ".env"],
      ignoreEnvFile: process.env.NODE_ENV === "production",
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
