import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { MessagingModule } from '../../modules/messaging/messaging.module';
import { PriceModule } from '../../modules/price/price.module';
import { HealthController } from './health.controller';
import {
  CircuitBreakerHealthIndicator,
  KafkaHealthIndicator,
  OutboxHealthIndicator,
  PrismaHealthIndicator,
} from './indicators';

@Module({
  imports: [TerminusModule, MessagingModule, PriceModule],
  controllers: [HealthController],
  providers: [
    PrismaHealthIndicator,
    KafkaHealthIndicator,
    OutboxHealthIndicator,
    CircuitBreakerHealthIndicator,
  ],
})
export class HealthModule {}
