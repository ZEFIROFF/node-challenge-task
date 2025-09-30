import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { Kafka, Producer, logLevel } from "kafkajs";
import { kafkaConfig } from "../../../common/config";

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private producer: Producer;
  private readonly topic: string;
  private isConnected = false;

  constructor(
    @Inject(kafkaConfig.KEY)
    private readonly config: ConfigType<typeof kafkaConfig>,
  ) {
    const kafka = new Kafka({
      clientId: this.config.clientId,
      brokers: this.config.brokers,
      logLevel: logLevel.ERROR,
    });

    this.topic = this.config.topic;
    this.producer = kafka.producer();
  }

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log("Successfully connected to Kafka");
    } catch (error) {
      this.logger.error(`Failed to connect to Kafka: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.producer.disconnect();
        this.isConnected = false;
        this.logger.log("Disconnected from Kafka");
      }
    } catch (error) {
      this.logger.error(`Error disconnecting from Kafka: ${error.message}`, error.stack);
    }
  }

  async sendMessage(messageData: {
    topic: string;
    key: string;
    value: string;
    timestamp?: string;
  }): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.warn("Kafka producer not connected, attempting to reconnect...");
        await this.connect();
      }

      await this.producer.send({
        topic: messageData.topic,
        messages: [
          {
            key: messageData.key,
            value: messageData.value,
            timestamp: messageData.timestamp,
          },
        ],
      });

      this.logger.debug(
        `Message sent to Kafka topic ${messageData.topic} with key ${messageData.key}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send message to Kafka: ${error.message}`, error.stack);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    return this.isConnected;
  }
}
