import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTokenDto {
  @Transform(({ value }) => Buffer.from(value, 'hex'))
  address: Buffer;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  symbol: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsNumber()
  @Min(0)
  @Max(32767)
  decimals = 0;

  @IsBoolean()
  isNative = false;

  @IsUUID()
  @IsNotEmpty()
  chainId: string;

  @IsOptional()
  @IsUUID()
  logoId?: string;

  @IsBoolean()
  isProtected = false;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastUpdateAuthor?: string;

  @IsNumber()
  @Min(0)
  priority = 0;

  @IsNumber()
  @Min(0)
  price = 0;
}
