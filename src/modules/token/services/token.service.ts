import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Token } from '@prisma/client';

import { PRISMA_ERROR_CODES } from '../../../common/constants';
import { PrismaTransactionClient } from '../../../common/types';
import { PrismaService } from '../../../database/prisma.service';
import { CreateTokenDto } from '../dto/create-token.dto';
import { UpdateTokenDto } from '../dto/update-token.dto';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createTokenDto: CreateTokenDto): Promise<Token> {
    try {
      const savedToken = await this.prisma.token.create({
        data: {
          ...createTokenDto,
        },
      });

      this.logger.log(`Token created with ID: ${savedToken.id}`);
      return savedToken;
    } catch (error) {
      this.logger.error(`Failed to create token: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(): Promise<Token[]> {
    try {
      const tokens = await this.prisma.token.findMany({
        include: {
          chain: true,
          logo: true,
          price: true,
        },
        orderBy: { priority: 'asc' },
      });
      this.logger.log(`Retrieved ${tokens.length} tokens`);
      return tokens;
    } catch (error) {
      this.logger.error(`Failed to retrieve tokens: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string): Promise<Token> {
    try {
      const token = await this.prisma.token.findUnique({
        where: { id },
        include: {
          chain: true,
          logo: true,
          price: true,
        },
      });

      if (!token) {
        throw new NotFoundException(`Token with ID ${id} not found`);
      }

      return token;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to retrieve token ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findBySymbol(symbol: string): Promise<Token[]> {
    try {
      const tokens = await this.prisma.token.findMany({
        where: { symbol },
        orderBy: { createdAt: 'desc' },
      });

      this.logger.log(`Found ${tokens.length} tokens with symbol ${symbol}`);
      return tokens;
    } catch (error) {
      this.logger.error(`Failed to find tokens by symbol ${symbol}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, updateTokenDto: UpdateTokenDto): Promise<Token> {
    try {
      const updatedToken = await this.prisma.token.update({
        where: { id },
        data: updateTokenDto,
      });

      this.logger.log(`Token ${id} updated successfully`);
      return updatedToken;
    } catch (error) {
      if (error.code === PRISMA_ERROR_CODES.RECORD_NOT_FOUND) {
        throw new NotFoundException(`Token with ID ${id} not found`);
      }
      this.logger.error(`Failed to update token ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updatePrice(id: string, price: number): Promise<Token> {
    try {
      await this.prisma.tokenPrice.upsert({
        where: { tokenId: id },
        create: { tokenId: id, price },
        update: { price },
      });

      const token = await this.prisma.token.findUnique({
        where: { id },
        include: { price: true },
      });

      if (!token) {
        throw new NotFoundException(`Token with ID ${id} not found`);
      }

      this.logger.log(`Updated price for token ${token.symbol}: ${price}`);
      return token;
    } catch (error) {
      if (error.code === PRISMA_ERROR_CODES.RECORD_NOT_FOUND) {
        throw new NotFoundException(`Token with ID ${id} not found`);
      }
      this.logger.error(`Failed to update price for token ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updatePriceInTransaction(
    id: string,
    price: number,
    prismaTransaction: PrismaTransactionClient,
  ): Promise<Token> {
    try {
      await prismaTransaction.tokenPrice.upsert({
        where: { tokenId: id },
        create: { tokenId: id, price },
        update: { price },
      });

      const token = await prismaTransaction.token.findUnique({
        where: { id },
        include: { price: true },
      });

      if (!token) {
        throw new NotFoundException(`Token with ID ${id} not found`);
      }

      this.logger.log(`Updated price for token ${token.symbol}: ${price} (in transaction)`);
      return token;
    } catch (error) {
      if (error.code === PRISMA_ERROR_CODES.RECORD_NOT_FOUND) {
        throw new NotFoundException(`Token with ID ${id} not found`);
      }
      this.logger.error(
        `Failed to update price for token ${id} in transaction: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.token.delete({
        where: { id },
      });
      this.logger.log(`Token ${id} removed successfully`);
    } catch (error) {
      if (error.code === PRISMA_ERROR_CODES.RECORD_NOT_FOUND) {
        throw new NotFoundException(`Token with ID ${id} not found`);
      }
      this.logger.error(`Failed to remove token ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
