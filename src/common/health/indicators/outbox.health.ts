import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

import { OutboxProcessorService } from '../../../modules/messaging/services/outbox-processor.service';

@Injectable()
export class OutboxHealthIndicator extends HealthIndicator {
  constructor(private readonly outboxProcessor: OutboxProcessorService) {
    super();
  }

  async isHealthy(key: string, maxPending = 1000): Promise<HealthIndicatorResult> {
    try {
      const stats = await this.outboxProcessor.getProcessorStats();
      const totalPending = stats.outboxStats.pending + stats.outboxStats.processing;

      const isHealthy = totalPending < maxPending;

      if (isHealthy) {
        return this.getStatus(key, true, {
          pending: stats.outboxStats.pending,
          processing: stats.outboxStats.processing,
          failed: stats.outboxStats.failed,
        });
      }

      throw new HealthCheckError(
        'Outbox check failed',
        this.getStatus(key, false, {
          message: `Outbox overloaded: ${totalPending} pending events (max: ${maxPending})`,
          pending: stats.outboxStats.pending,
          processing: stats.outboxStats.processing,
          failed: stats.outboxStats.failed,
        }),
      );
    } catch (error) {
      if (error instanceof HealthCheckError) {
        throw error;
      }

      throw new HealthCheckError(
        'Outbox check failed',
        this.getStatus(key, false, { message: error.message }),
      );
    }
  }
}
