import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { HealthController } from "./health.controller";
import { MessagingModule } from "../../modules/messaging/messaging.module";
import { PriceModule } from "../../modules/price/price.module";
import { PrismaHealthIndicator } from "./indicators/prisma.health";
import { KafkaHealthIndicator } from "./indicators/kafka.health";
import { OutboxHealthIndicator } from "./indicators/outbox.health";
import { CircuitBreakerHealthIndicator } from "./indicators/circuit-breaker.health";

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
