import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Token } from '@prisma/client';

import { CircuitBreakerOptions, CircuitBreakerService } from '../../../common/circuit-breaker';
import { circuitBreakerConfig } from '../../../common/config';

@Injectable()
export class MockPriceService {
  private readonly logger = new Logger(MockPriceService.name);
  private readonly circuitName = 'MockPriceService';
  private readonly circuitOptions: CircuitBreakerOptions;

  constructor(
    private readonly circuitBreakerService: CircuitBreakerService,
    @Inject(circuitBreakerConfig.KEY)
    private readonly cbConfig: ConfigType<typeof circuitBreakerConfig>,
  ) {
    this.circuitOptions = this.cbConfig.priceService;
  }

  async getRandomPriceForToken(token: Token): Promise<number> {
    try {
      return await this.circuitBreakerService.execute(
        this.circuitName,
        async () => this.fetchPrice(token),
        this.circuitOptions,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate price for token ${token.id}: ${error.message}`,
        error.stack,
      );

      // Возвращаем последнюю известную цену в случае ошибки, если ошибка не связана с ценой
      this.logger.warn(`Returning last known price for ${token.symbol}: ${token.price}`);
      return Number(token.price);
    }
  }

  private async fetchPrice(token: Token): Promise<number> {
    // Симулируем случайные ошибки для тестирования circuit breaker, 10% вероятность ошибки
    if (Math.random() < 0.1) {
      throw new Error('Mock API temporary failure');
    }
    const delay = this.getRandomInt(50, 200);
    await this.sleep(delay);

    const basePrice = this.getBasePriceBySymbol(token.symbol || 'UNKNOWN');
    const volatilityFactor = this.getVolatilityFactor();

    const newPrice = Math.max(0, basePrice * volatilityFactor);

    this.logger.debug(
      `Generated price for ${token.symbol}: ${newPrice} (base: ${basePrice}, factor: ${volatilityFactor})`,
    );

    return Math.round(newPrice * 100) / 100;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getBasePriceBySymbol(symbol: string): number {
    const basePrices: Record<string, number> = {
      BTC: 105000,
      ETH: 3500,
      SOL: 250,
      TRX: 0.8,
    };

    return basePrices[symbol.toUpperCase()] || this.getRandomInt(1, 1000);
  }

  private getVolatilityFactor(): number {
    const minFactor = 0.95;
    const maxFactor = 1.05;
    return minFactor + Math.random() * (maxFactor - minFactor);
  }

  private getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
