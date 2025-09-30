import { Injectable, Logger } from "@nestjs/common";
// fixme: это я где то нашел в прошлых проектах, подумать над упрощением
export enum CircuitBreakerState {
  CLOSED = "closed",
  OPEN = "open",
  HALF_OPEN = "half_open",
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeout: number;
  successThreshold: number;
  timeout: number;
}

export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number | null;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuits = new Map<string, CircuitBreakerStats>();

  createCircuit(name: string, options: CircuitBreakerOptions): void {
    if (this.circuits.has(name)) {
      this.logger.warn(`Circuit breaker ${name} already exists`);
      return;
    }

    this.circuits.set(name, {
      state: CircuitBreakerState.CLOSED,
      failureCount: 0,
      successCount: 0,
      lastFailureTime: null,
    });

    this.logger.log(`Circuit breaker ${name} created with options: ${JSON.stringify(options)}`);
  }

  async execute<T>(
    name: string,
    operation: () => Promise<T>,
    options: CircuitBreakerOptions,
  ): Promise<T> {
    const circuit = this.getOrCreateCircuit(name);

    if (circuit.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset(circuit, options.recoveryTimeout)) {
        circuit.state = CircuitBreakerState.HALF_OPEN;
        this.logger.log(`Circuit breaker ${name} transitioning to HALF_OPEN`);
      } else {
        throw new Error(`Circuit breaker ${name} is OPEN`);
      }
    }

    try {
      const result = await this.executeWithTimeout(operation, options.timeout);
      this.onSuccess(name, circuit, options.successThreshold);
      return result;
    } catch (error) {
      this.onFailure(name, circuit, options.failureThreshold);
      throw error;
    }
  }

  private getOrCreateCircuit(name: string): CircuitBreakerStats {
    if (!this.circuits.has(name)) {
      this.circuits.set(name, {
        state: CircuitBreakerState.CLOSED,
        failureCount: 0,
        successCount: 0,
        lastFailureTime: null,
      });
    }
    return this.circuits.get(name)!;
  }

  private async executeWithTimeout<T>(operation: () => Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Operation timeout")), timeout),
      ),
    ]);
  }

  private onSuccess(name: string, circuit: CircuitBreakerStats, successThreshold: number): void {
    circuit.failureCount = 0;

    if (circuit.state === CircuitBreakerState.HALF_OPEN) {
      circuit.successCount++;
      if (circuit.successCount >= successThreshold) {
        circuit.state = CircuitBreakerState.CLOSED;
        circuit.successCount = 0;
        this.logger.log(`Circuit breaker ${name} closed after successful recovery`);
      }
    }
  }

  private onFailure(name: string, circuit: CircuitBreakerStats, failureThreshold: number): void {
    circuit.failureCount++;
    circuit.lastFailureTime = Date.now();

    if (circuit.state === CircuitBreakerState.HALF_OPEN) {
      circuit.state = CircuitBreakerState.OPEN;
      circuit.successCount = 0;
      this.logger.warn(`Circuit breaker ${name} opened during recovery attempt`);
    } else if (circuit.failureCount >= failureThreshold) {
      circuit.state = CircuitBreakerState.OPEN;
      this.logger.warn(`Circuit breaker ${name} opened after ${circuit.failureCount} failures`);
    }
  }

  private shouldAttemptReset(circuit: CircuitBreakerStats, recoveryTimeout: number): boolean {
    if (!circuit.lastFailureTime) {
      return false;
    }

    return Date.now() - circuit.lastFailureTime >= recoveryTimeout;
  }

  getState(name: string): CircuitBreakerStats | undefined {
    return this.circuits.get(name);
  }
}
