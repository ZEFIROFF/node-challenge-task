import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../prisma.service';

@Injectable()
export class TokenSeeder {
  private readonly logger = new Logger(TokenSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    const count = await this.prisma.token.count();
    if (count > 0) {
      this.logger.log('Database already seeded, skipping...');
      return;
    }

    this.logger.log('Seeding initial data...');

    await this.prisma.$transaction(async (tx) => {
      const [ethChain, btcChain, solChain] = await Promise.all([
        tx.chain.create({
          data: { deId: 1, name: 'Ethereum', isEnabled: true },
        }),
        tx.chain.create({
          data: { deId: 2, name: 'Bitcoin', isEnabled: true },
        }),
        tx.chain.create({ data: { deId: 3, name: 'Solana', isEnabled: true } }),
      ]);

      const [ethLogo, btcLogo, solLogo] = await Promise.all([
        tx.logo.create({
          data: {
            bigRelativePath: '/images/eth_big.png',
            smallRelativePath: '/images/eth_small.png',
            thumbRelativePath: '/images/eth_thumb.png',
          },
        }),
        tx.logo.create({
          data: {
            bigRelativePath: '/images/btc_big.png',
            smallRelativePath: '/images/btc_small.png',
            thumbRelativePath: '/images/btc_thumb.png',
          },
        }),
        tx.logo.create({
          data: {
            bigRelativePath: '/images/sol_big.png',
            smallRelativePath: '/images/sol_small.png',
            thumbRelativePath: '/images/sol_thumb.png',
          },
        }),
      ]);

      await tx.token.createMany({
        data: [
          {
            address: Buffer.from('0x0001020304050607080900000000000000000000', 'hex'),
            symbol: 'ETH',
            name: 'Ethereum',
            decimals: 18,
            isNative: true,
            chainId: ethChain.id,
            logoId: ethLogo.id,
            isProtected: true,
            lastUpdateAuthor: 'Seeder',
            priority: 1,
            price: 3000,
          },
          {
            address: Buffer.from('0x1011121314151617181900000000000000000000', 'hex'),
            symbol: 'BTC',
            name: 'Bitcoin',
            decimals: 8,
            isNative: true,
            chainId: btcChain.id,
            logoId: btcLogo.id,
            isProtected: true,
            lastUpdateAuthor: 'Seeder',
            priority: 2,
            price: 45000,
          },
          {
            address: Buffer.from('0x2021222324252627282900000000000000000000', 'hex'),
            symbol: 'SOL',
            name: 'Solana',
            decimals: 9,
            isNative: true,
            chainId: solChain.id,
            logoId: solLogo.id,
            isProtected: true,
            lastUpdateAuthor: 'Seeder',
            priority: 3,
            price: 150,
          },
        ],
      });
    });

    this.logger.log('Initial data seeded successfully: 3 chains, 3 logos, 3 tokens created');
  }
}
