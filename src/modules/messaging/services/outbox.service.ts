import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { OutboxEvent, OutboxEventStatus } from '@prisma/client';

import { kafkaConfig } from '../../../common/config';
import { APP_CONSTANTS } from '../../../common/constants';
import { PriceUpdateEventPayload, PrismaTransactionClient } from '../../../common/types';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(kafkaConfig.KEY)
    private readonly kafka: ConfigType<typeof kafkaConfig>,
  ) {}

  async createPriceUpdateEvent(
    priceUpdateData: PriceUpdateEventPayload,
    prismaTransaction?: PrismaTransactionClient,
  ): Promise<OutboxEvent> {
    const prismaClient = prismaTransaction || this.prisma;

    const savedEvent = await prismaClient.outboxEvent.create({
      data: {
        eventType: APP_CONSTANTS.PRICE_UPDATE_EVENT_TYPE,
        aggregateId: priceUpdateData.tokenId,
        aggregateType: APP_CONSTANTS.DEFAULT_AGGREGATE_TYPE,
        payload: {
          tokenId: priceUpdateData.tokenId,
          symbol: priceUpdateData.symbol,
          oldPrice: priceUpdateData.oldPrice,
          newPrice: priceUpdateData.newPrice,
          timestamp: priceUpdateData.timestamp || new Date(),
        },
        kafkaTopic: this.kafka.topic,
        kafkaKey: priceUpdateData.symbol,
        status: OutboxEventStatus.PENDING,
      },
    });

    this.logger.log(`Created outbox event for token ${priceUpdateData.symbol}: ${savedEvent.id}`);
    return savedEvent;
  }

  async getPendingEvents(limit = 100): Promise<OutboxEvent[]> {
    return this.prisma.outboxEvent.findMany({
      where: { status: OutboxEventStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async markAsProcessing(eventId: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: OutboxEventStatus.PROCESSING,
        processedAt: new Date(),
      },
    });
  }

  async markAsPublished(eventId: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: OutboxEventStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    this.logger.log(`Outbox event ${eventId} marked as published`);
  }

  async markAsFailed(eventId: string, error: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: OutboxEventStatus.FAILED,
        lastError: error,
        retryCount: { increment: 1 },
      },
    });

    this.logger.error(`Outbox event ${eventId} marked as failed: ${error}`);
  }

  async getFailedEvents(maxRetries = 3): Promise<OutboxEvent[]> {
    return this.prisma.outboxEvent.findMany({
      where: {
        status: OutboxEventStatus.FAILED,
        retryCount: { lt: maxRetries },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async resetFailedEventForRetry(eventId: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: OutboxEventStatus.PENDING,
        lastError: null,
      },
    });

    this.logger.log(`Reset failed outbox event ${eventId} for retry`);
  }

  async getStats(): Promise<{
    pending: number;
    processing: number;
    published: number;
    failed: number;
  }> {
    const [pending, processing, published, failed] = await Promise.all([
      this.prisma.outboxEvent.count({
        where: { status: OutboxEventStatus.PENDING },
      }),
      this.prisma.outboxEvent.count({
        where: { status: OutboxEventStatus.PROCESSING },
      }),
      this.prisma.outboxEvent.count({
        where: { status: OutboxEventStatus.PUBLISHED },
      }),
      this.prisma.outboxEvent.count({
        where: { status: OutboxEventStatus.FAILED },
      }),
    ]);

    return { pending, processing, published, failed };
  }
}
