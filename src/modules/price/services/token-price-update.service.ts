import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Token } from '@prisma/client';

import { appConfig } from '../../../common/config';
import { PrismaService } from '../../../database/prisma.service';
import { OutboxService } from '../../messaging/services/outbox.service';
import { TokenService } from '../../token/services/token.service';
import { MockPriceService } from './mock-price.service';

@Injectable()
export class TokenPriceUpdateService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TokenPriceUpdateService.name);
  private readonly updateIntervalSeconds: number;
  private readonly batchSize: number;
  private readonly minChangeThresholdPercent: number;
  private readonly timerName = 'token-price-update-interval';

  private isRunning = false;
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly priceService: MockPriceService,
    private readonly outboxService: OutboxService,
    private readonly schedulerRegistry: SchedulerRegistry,
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
  ) {
    this.updateIntervalSeconds = this.config.priceUpdateIntervalSeconds;
    this.batchSize = this.config.priceUpdateBatchSize;
    this.minChangeThresholdPercent = this.config.priceUpdateThresholdPercent;
  }

  onModuleInit(): void {
    this.start();
  }

  onModuleDestroy(): void {
    this.stop();
  }

  start(): void {
    if (this.isRunning) {
      this.logger.warn('Price update service is already enabled');
      return;
    }

    this.registerInterval();
    this.isRunning = true;
    this.logger.log(
      `Price update service enabled (interval: ${this.updateIntervalSeconds} seconds, batch size: ${this.batchSize})`,
    );

    void this.updatePricesWithErrorHandling();
  }

  stop(): void {
    if (!this.isRunning) {
      this.logger.warn('Price update service is not enabled');
      return;
    }

    this.unregisterInterval();
    this.isRunning = false;
    this.logger.log('Price update service disabled');
  }

  private registerInterval(): void {
    const milliseconds = this.updateIntervalSeconds * 1000;

    const existingInterval = this.schedulerRegistry.doesExist('interval', this.timerName);
    if (existingInterval) {
      this.unregisterInterval();
    }

    const interval = setInterval(() => {
      void this.updatePricesWithErrorHandling();
    }, milliseconds);

    this.schedulerRegistry.addInterval(this.timerName, interval);
  }

  private unregisterInterval(): void {
    if (this.schedulerRegistry.doesExist('interval', this.timerName)) {
      const interval = this.schedulerRegistry.getInterval(this.timerName);
      clearInterval(interval);
      this.schedulerRegistry.deleteInterval(this.timerName);
    }
  }

  private async updatePricesWithErrorHandling(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    if (this.isProcessing) {
      this.logger.warn('Price update cycle skipped: previous cycle still in progress');
      return;
    }

    this.isProcessing = true;
    try {
      await this.updatePrices();
    } catch (error) {
      this.logger.error(`Error in price update cycle: ${error.message}`, error.stack);
    } finally {
      this.isProcessing = false;
    }
  }

  private async updatePrices(): Promise<void> {
    try {
      const tokens = await this.tokenService.findAll();

      if (tokens.length === 0) {
        this.logger.warn('No tokens found to update prices');
        return;
      }

      this.logger.log(`Updating prices for ${tokens.length} tokens`);

      // обрабатываем токены параллельно, но с контролируем иначе все лочится
      for (let i = 0; i < tokens.length; i += this.batchSize) {
        const batch = tokens.slice(i, i + this.batchSize);
        await Promise.allSettled(batch.map((token) => this.updateTokenPrice(token)));
      }

      this.logger.log('Price update cycle completed');
    } catch (error) {
      this.logger.error(`Failed to update prices: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async updateTokenPrice(token: Token): Promise<void> {
    try {
      const oldPrice = Number(token.price);
      const newPrice = await this.priceService.getRandomPriceForToken(token);

      if (Number.isNaN(oldPrice)) {
        this.logger.warn(`Invalid old price for token ${token.id}; skipping update`);
        return;
      }

      if (oldPrice === newPrice) {
        this.logger.debug(`No price change detected for ${token.symbol ?? 'UNKNOWN'}`);
        return;
      }

      // смотрим насколько изменилась цена
      const priceChangePercent = this.calculatePriceChangePercent(oldPrice, newPrice);

      if (priceChangePercent >= this.minChangeThresholdPercent) {
        // Используем Prisma транзакцию для атомарного обновления цены и создания outbox события
        await this.prisma.$transaction(async (prismaTransaction) => {
          // Обновляем цену токена в БД
          await this.tokenService.updatePriceInTransaction(token.id, newPrice, prismaTransaction);

          // Создаем событие в outbox для последующей отправки в Kafka
          await this.outboxService.createPriceUpdateEvent(
            {
              tokenId: token.id,
              symbol: token.symbol ?? 'UNKNOWN',
              oldPrice,
              newPrice,
              timestamp: new Date(),
            },
            prismaTransaction,
          );
        });

        this.logger.log(
          `Price updated for ${
            token.symbol ?? 'UNKNOWN'
          }: ${oldPrice} -> ${newPrice} (${priceChangePercent.toFixed(2)}% change)`,
        );
      } else {
        this.logger.debug(
          `Skipping price update for ${
            token.symbol ?? 'UNKNOWN'
          }: change too small (${priceChangePercent.toFixed(2)}%)`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to update price for token ${token.id} (${token.symbol ?? 'UNKNOWN'}): ${
          error.message
        }`,
        error.stack,
      );
      // не бросаем ошибку чтобы не останавливать весб прсесс
    }
  }

  private calculatePriceChangePercent(oldPrice: number, newPrice: number): number {
    if (oldPrice === 0) {
      return 100;
    }

    return Math.abs((newPrice - oldPrice) / oldPrice) * 100;
  }

  getStatus(): {
    isRunning: boolean;
    isProcessing: boolean;
    updateIntervalSeconds: number;
    batchSize: number;
    minChangeThresholdPercent: number;
  } {
    return {
      isRunning: this.isRunning,
      isProcessing: this.isProcessing,
      updateIntervalSeconds: this.updateIntervalSeconds,
      batchSize: this.batchSize,
      minChangeThresholdPercent: this.minChangeThresholdPercent,
    };
  }
}
