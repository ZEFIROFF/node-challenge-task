import { registerAs } from "@nestjs/config";

export const outboxConfig = registerAs("outbox", () => ({
  batchSize: parseInt(process.env.OUTBOX_BATCH_SIZE || "50", 10),
  processingIntervalMs: parseInt(process.env.OUTBOX_PROCESSING_INTERVAL_MS || "1000", 10),
  retryIntervalMs: parseInt(process.env.OUTBOX_RETRY_INTERVAL_MS || "30000", 10),
  maxRetries: parseInt(process.env.OUTBOX_MAX_RETRIES || "3", 10),
}));

export type OutboxConfig = ReturnType<typeof outboxConfig>;
