import { Controller, Get } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from "@nestjs/terminus";
import { PrismaHealthIndicator } from "./indicators/prisma.health";
import { KafkaHealthIndicator } from "./indicators/kafka.health";
import { OutboxHealthIndicator } from "./indicators/outbox.health";
import { CircuitBreakerHealthIndicator } from "./indicators/circuit-breaker.health";

//todo: добавить ридмишку
@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly kafkaHealth: KafkaHealthIndicator,
    private readonly outboxHealth: OutboxHealthIndicator,
    private readonly circuitBreakerHealth: CircuitBreakerHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaHealth.isHealthy("database"),
      () => this.kafkaHealth.isHealthy("kafka"),
      () => this.outboxHealth.isHealthy("outbox", 1000),
      () => this.circuitBreakerHealth.isHealthy("priceService", "MockPriceService"),
      () => this.memory.checkHeap("memory_heap", 300 * 1024 * 1024),
      () =>
        this.disk.checkStorage("storage", {
          path: "/",
          thresholdPercent: 0.9,
        }),
    ]);
  }

  @Get("database")
  @HealthCheck()
  checkDatabase() {
    return this.health.check([() => this.prismaHealth.isHealthy("database")]);
  }

  @Get("kafka")
  @HealthCheck()
  checkKafka() {
    return this.health.check([() => this.kafkaHealth.isHealthy("kafka")]);
  }

  @Get("outbox")
  @HealthCheck()
  checkOutbox() {
    return this.health.check([() => this.outboxHealth.isHealthy("outbox", 1000)]);
  }

  @Get("circuit-breaker")
  @HealthCheck()
  checkCircuitBreaker() {
    return this.health.check([
      () => this.circuitBreakerHealth.isHealthy("priceService", "MockPriceService"),
    ]);
  }

  @Get("memory")
  @HealthCheck()
  checkMemory() {
    return this.health.check([
      () => this.memory.checkHeap("memory_heap", 300 * 1024 * 1024),
      () => this.memory.checkRSS("memory_rss", 300 * 1024 * 1024),
    ]);
  }

  @Get("disk")
  @HealthCheck()
  checkDisk() {
    return this.health.check([
      () =>
        this.disk.checkStorage("storage", {
          path: "/",
          thresholdPercent: 0.9,
        }),
    ]);
  }
}
