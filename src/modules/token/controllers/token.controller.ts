import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { CreateTokenDto } from '../dto/create-token.dto';
import { TokenResponseDto } from '../dto/token-response.dto';
import { UpdateTokenDto } from '../dto/update-token.dto';
import { TokenService } from '../services/token.service';

//todo: возмонжо вообще убрать этот контроллер
@Controller('tokens')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Post()
  async create(@Body() createTokenDto: CreateTokenDto): Promise<TokenResponseDto> {
    const token = await this.tokenService.create(createTokenDto);
    return plainToInstance(TokenResponseDto, token, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  async findAll(): Promise<TokenResponseDto[]> {
    const tokens = await this.tokenService.findAll();
    return tokens.map((token) =>
      plainToInstance(TokenResponseDto, token, {
        excludeExtraneousValues: true,
      }),
    );
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<TokenResponseDto> {
    const token = await this.tokenService.findOne(id);
    return plainToInstance(TokenResponseDto, token, {
      excludeExtraneousValues: true,
    });
  }

  @Get('symbol/:symbol')
  async findBySymbol(@Param('symbol') symbol: string): Promise<TokenResponseDto[]> {
    const tokens = await this.tokenService.findBySymbol(symbol);
    return tokens.map((token) =>
      plainToInstance(TokenResponseDto, token, {
        excludeExtraneousValues: true,
      }),
    );
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTokenDto: UpdateTokenDto,
  ): Promise<TokenResponseDto> {
    const token = await this.tokenService.update(id, updateTokenDto);
    return plainToInstance(TokenResponseDto, token, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.tokenService.remove(id);
  }
}
