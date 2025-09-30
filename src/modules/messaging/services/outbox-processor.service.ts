import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { OutboxEvent } from '@prisma/client';

import { outboxConfig } from '../../../common/config';
import { KafkaProducerService } from './kafka-producer.service';
import { OutboxService } from './outbox.service';

// todo: подумать над упрощение
@Injectable()
export class OutboxProcessorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxProcessorService.name);
  private readonly processingIntervalName = 'outbox-processing-interval';
  private readonly retryIntervalName = 'outbox-retry-interval';
  private readonly batchSize: number;
  private readonly processingIntervalMs: number;
  private readonly retryIntervalMs: number;
  private readonly maxRetries: number;
  private isProcessing = false;
  private processingPromise: Promise<void> | null = null;

  constructor(
    private readonly outboxService: OutboxService,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly schedulerRegistry: SchedulerRegistry,
    @Inject(outboxConfig.KEY)
    private readonly config: ConfigType<typeof outboxConfig>,
  ) {
    this.batchSize = this.config.batchSize;
    this.processingIntervalMs = this.config.processingIntervalMs;
    this.retryIntervalMs = this.config.retryIntervalMs;
    this.maxRetries = this.config.maxRetries;
  }

  async onModuleInit(): Promise<void> {
    await this.startProcessing();
  }

  async onModuleDestroy(): Promise<void> {
    await this.stopProcessing();
  }

  private async startProcessing(): Promise<void> {
    this.logger.log('Starting outbox processor...');

    const processingInterval = setInterval(
      () => void this.processPendingEvents(),
      this.processingIntervalMs,
    );
    this.schedulerRegistry.addInterval(this.processingIntervalName, processingInterval);

    const retryInterval = setInterval(() => void this.retryFailedEvents(), this.retryIntervalMs);
    this.schedulerRegistry.addInterval(this.retryIntervalName, retryInterval);

    this.logger.log(
      `Outbox processor started (batch: ${this.batchSize}, interval: ${this.processingIntervalMs}ms)`,
    );
  }

  private async stopProcessing(): Promise<void> {
    this.logger.log('Stopping outbox processor...');

    if (this.schedulerRegistry.doesExist('interval', this.processingIntervalName)) {
      this.schedulerRegistry.deleteInterval(this.processingIntervalName);
    }

    if (this.schedulerRegistry.doesExist('interval', this.retryIntervalName)) {
      this.schedulerRegistry.deleteInterval(this.retryIntervalName);
    }

    if (this.processingPromise) {
      await this.processingPromise;
    }

    this.logger.log('Outbox processor stopped');
  }

  private async processPendingEvents(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.processingPromise = this.executePendingEvents();

    try {
      await this.processingPromise;
    } finally {
      this.isProcessing = false;
      this.processingPromise = null;
    }
  }

  private async executePendingEvents(): Promise<void> {
    try {
      const pendingEvents = await this.outboxService.getPendingEvents(this.batchSize);

      if (pendingEvents.length === 0) {
        return;
      }

      this.logger.log(`Processing ${pendingEvents.length} pending outbox events`);

      // Обрабатываем события параллельно
      await Promise.allSettled(pendingEvents.map((event) => this.processEvent(event)));
    } catch (error) {
      this.logger.error(`Error processing pending events: ${error.message}`, error.stack);
    }
  }

  private async retryFailedEvents(): Promise<void> {
    try {
      const failedEvents = await this.outboxService.getFailedEvents(this.maxRetries);

      if (failedEvents.length === 0) {
        return;
      }

      this.logger.log(`Retrying ${failedEvents.length} failed outbox events`);

      for (const event of failedEvents) {
        await this.outboxService.resetFailedEventForRetry(event.id);
      }
    } catch (error) {
      this.logger.error(`Error retrying failed events: ${error.message}`, error.stack);
    }
  }

  private async processEvent(event: OutboxEvent): Promise<void> {
    try {
      // Помечаем как обрабатываемое
      await this.outboxService.markAsProcessing(event.id);

      // Отправляем в Kafka
      await this.publishToKafka(event);

      // Помечаем как опубликованное
      await this.outboxService.markAsPublished(event.id);

      this.logger.debug(`Successfully processed outbox event ${event.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to process outbox event ${event.id}: ${error.message}`,
        error.stack,
      );
      await this.outboxService.markAsFailed(event.id, error.message);
    }
  }

  private async publishToKafka(event: OutboxEvent): Promise<void> {
    const { kafkaTopic, kafkaKey, payload } = event;

    if (!kafkaTopic) {
      throw new Error('Kafka topic is not specified');
    }

    await this.kafkaProducer.sendMessage({
      topic: kafkaTopic,
      key: kafkaKey || event.aggregateId,
      value: JSON.stringify(payload),
    });
  }

  async getProcessorStats(): Promise<{
    isProcessing: boolean;
    batchSize: number;
    processingIntervalMs: number;
    retryIntervalMs: number;
    maxRetries: number;
    outboxStats: {
      pending: number;
      processing: number;
      published: number;
      failed: number;
    };
  }> {
    const outboxStats = await this.outboxService.getStats();

    return {
      isProcessing: this.isProcessing,
      batchSize: this.batchSize,
      processingIntervalMs: this.processingIntervalMs,
      retryIntervalMs: this.retryIntervalMs,
      maxRetries: this.maxRetries,
      outboxStats,
    };
  }
}
