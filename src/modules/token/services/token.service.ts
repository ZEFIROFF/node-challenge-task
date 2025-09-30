import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { Token } from "@prisma/client";
import { CreateTokenDto } from "../dto/create-token.dto";
import { UpdateTokenDto } from "../dto/update-token.dto";

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
        },
        orderBy: { priority: "asc" },
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
        orderBy: { createdAt: "desc" },
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
      if (error.code === "P2025") {
        // Не магическое число, это Prisma error code for record not found
        throw new NotFoundException(`Token with ID ${id} not found`);
      }
      this.logger.error(`Failed to update token ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updatePrice(id: string, price: number): Promise<Token> {
    try {
      const updatedToken = await this.prisma.token.update({
        where: { id },
        data: {
          price: price,
          // updatedAt автоматически обновится Prisma, поэтому не нужно его обновлять
        },
      });

      this.logger.log(`Updated price for token ${updatedToken.symbol}: ${price}`);
      return updatedToken;
    } catch (error) {
      if (error.code === "P2025") {
        // Не магическое число, это Prisma error code for record not found
        throw new NotFoundException(`Token with ID ${id} not found`);
      }
      this.logger.error(`Failed to update price for token ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updatePriceInTransaction(
    id: string,
    price: number,
    prismaTransaction: Parameters<Parameters<PrismaService["$transaction"]>[0]>[0],
  ): Promise<Token> {
    try {
      const updatedToken = await prismaTransaction.token.update({
        where: { id },
        data: {
          price: price,
          // updatedAt автоматически обновится Prisma, поэтому не нужно его обновлять
        },
      });

      this.logger.log(`Updated price for token ${updatedToken.symbol}: ${price} (in transaction)`);
      return updatedToken;
    } catch (error) {
      if (error.code === "P2025") {
        // Не магическое число, это Prisma error code for record not found
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
      if (error.code === "P2025") {
        // Не магическое число, это Prisma error code for record not found
        throw new NotFoundException(`Token with ID ${id} not found`);
      }
      this.logger.error(`Failed to remove token ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
