import { Injectable } from "@nestjs/common";
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from "@nestjs/terminus";
import { KafkaProducerService } from "../../../modules/messaging/services/kafka-producer.service";

@Injectable()
export class KafkaHealthIndicator extends HealthIndicator {
  constructor(private readonly kafkaProducer: KafkaProducerService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const isConnected = await this.kafkaProducer.healthCheck();

      if (isConnected) {
        return this.getStatus(key, true);
      }

      throw new HealthCheckError(
        "Kafka check failed",
        this.getStatus(key, false, {
          message: "Kafka producer is not connected",
        }),
      );
    } catch (error) {
      throw new HealthCheckError(
        "Kafka check failed",
        this.getStatus(key, false, { message: error.message }),
      );
    }
  }
}
