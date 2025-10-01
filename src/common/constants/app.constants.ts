export const APP_CONSTANTS = {
  UNKNOWN_SYMBOL: 'UNKNOWN',
  DEFAULT_KAFKA_TOPIC: 'token-price-updates',
  DEFAULT_AGGREGATE_TYPE: 'Token',
  PRICE_UPDATE_EVENT_TYPE: 'token.price.updated',
} as const;

export type AppConstant = (typeof APP_CONSTANTS)[keyof typeof APP_CONSTANTS];
