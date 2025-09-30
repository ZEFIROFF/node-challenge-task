import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

import { CircuitBreakerService, CircuitBreakerState } from '../../circuit-breaker';

@Injectable()
export class CircuitBreakerHealthIndicator extends HealthIndicator {
  constructor(private readonly circuitBreakerService: CircuitBreakerService) {
    super();
  }

  async isHealthy(key: string, circuitName = 'MockPriceService'): Promise<HealthIndicatorResult> {
    const circuitState = this.circuitBreakerService.getState(circuitName);

    if (!circuitState) {
      return this.getStatus(key, true, {
        state: 'not_initialized',
        message: `Circuit breaker '${circuitName}' not yet initialized`,
      });
    }

    const isHealthy = circuitState.state !== CircuitBreakerState.OPEN;

    if (isHealthy) {
      return this.getStatus(key, true, {
        state: circuitState.state,
        failureCount: circuitState.failureCount,
        successCount: circuitState.successCount,
      });
    }

    throw new HealthCheckError(
      'Circuit breaker check failed',
      this.getStatus(key, false, {
        message: `Circuit breaker '${circuitName}' is OPEN (${circuitState.failureCount} failures)`,
        state: circuitState.state,
        failureCount: circuitState.failureCount,
        lastFailureTime: circuitState.lastFailureTime,
      }),
    );
  }
}
