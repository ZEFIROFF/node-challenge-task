import { registerAs } from "@nestjs/config";

export const circuitBreakerConfig = registerAs("circuitBreaker", () => ({
  priceService: {
    failureThreshold: parseInt(process.env.PRICE_SERVICE_FAILURE_THRESHOLD || "5", 10),
    recoveryTimeout: parseInt(process.env.PRICE_SERVICE_RECOVERY_TIMEOUT_MS || "30000", 10),
    successThreshold: parseInt(process.env.PRICE_SERVICE_SUCCESS_THRESHOLD || "3", 10),
    timeout: parseInt(process.env.PRICE_SERVICE_TIMEOUT_MS || "5000", 10),
  },
}));

export type CircuitBreakerConfig = ReturnType<typeof circuitBreakerConfig>;
