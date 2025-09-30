import { registerAs } from "@nestjs/config";

export const kafkaConfig = registerAs("kafka", () => ({
  brokers: process.env.KAFKA_BROKERS?.split(",") || ["localhost:9092"],
  clientId: process.env.KAFKA_CLIENT_ID || "token-price-service",
  topic: process.env.KAFKA_TOPIC || "token-price-updates",
}));

export type KafkaConfig = ReturnType<typeof kafkaConfig>;
