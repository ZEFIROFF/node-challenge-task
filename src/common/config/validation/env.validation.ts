import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

class EnvironmentVariables {
  // App config
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.DEVELOPMENT;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT = 3000;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  PRICE_UPDATE_INTERVAL_SECONDS = 5;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  PRICE_UPDATE_BATCH_SIZE = 5;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  PRICE_UPDATE_THRESHOLD_PERCENT = 0.1;

  // Database config
  @IsString()
  @IsOptional()
  DB_HOST = 'localhost';

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  DB_PORT = 51214;

  @IsString()
  @IsOptional()
  DB_USERNAME = 'postgres';

  @IsString()
  @IsOptional()
  DB_PASSWORD = 'postgres';

  @IsString()
  @IsOptional()
  DB_DATABASE = 'tokens';

  @IsString()
  @IsOptional()
  DATABASE_URL?: string;

  // Kafka config
  @Transform(({ value }) => value?.split(',') || ['localhost:9092'])
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  KAFKA_BROKERS: string[] = ['localhost:9092'];

  @IsString()
  @IsOptional()
  KAFKA_CLIENT_ID = 'token-price-service';

  @IsString()
  @IsOptional()
  KAFKA_TOPIC = 'token-price-updates';

  // Circuit Breaker config
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  PRICE_SERVICE_FAILURE_THRESHOLD = 5;

  @Type(() => Number)
  @IsNumber()
  @Min(1000)
  @IsOptional()
  PRICE_SERVICE_RECOVERY_TIMEOUT_MS = 30000;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  PRICE_SERVICE_SUCCESS_THRESHOLD = 3;

  @Type(() => Number)
  @IsNumber()
  @Min(1000)
  @IsOptional()
  PRICE_SERVICE_TIMEOUT_MS = 5000;

  // Outbox Processor config
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  OUTBOX_BATCH_SIZE = 50;

  @Type(() => Number)
  @IsNumber()
  @Min(100)
  @IsOptional()
  OUTBOX_PROCESSING_INTERVAL_MS = 1000;

  @Type(() => Number)
  @IsNumber()
  @Min(1000)
  @IsOptional()
  OUTBOX_RETRY_INTERVAL_MS = 30000;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  OUTBOX_MAX_RETRIES = 3;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    whitelist: true,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
