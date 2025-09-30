import { registerAs } from "@nestjs/config";

export const appConfig = registerAs("app", () => ({
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000", 10),
  logLevel: process.env.LOG_LEVEL || "log",
  priceUpdateIntervalSeconds: parseInt(process.env.PRICE_UPDATE_INTERVAL_SECONDS || "5", 10),
  priceUpdateBatchSize: parseInt(process.env.PRICE_UPDATE_BATCH_SIZE || "5", 10),
  priceUpdateThresholdPercent: parseFloat(process.env.PRICE_UPDATE_THRESHOLD_PERCENT || "0.1"),
}));

export type AppConfig = ReturnType<typeof appConfig>;
