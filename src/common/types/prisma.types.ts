import { Prisma, PrismaClient } from '@prisma/client';

export type PrismaTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export type TransactionCallback<T> = (prisma: PrismaTransactionClient) => Promise<T>;

export type PriceUpdateEventPayload = {
  tokenId: string;
  symbol: string;
  oldPrice: number;
  newPrice: number;
  timestamp: Date;
};

export { Prisma };
