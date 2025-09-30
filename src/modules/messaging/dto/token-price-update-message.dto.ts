import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class TokenPriceUpdateMessageDto {
  @IsUUID()
  tokenId: string;

  @IsString()
  symbol: string;

  @IsNumber()
  @Min(0)
  oldPrice: number;

  @IsNumber()
  @Min(0)
  newPrice: number;

  @IsDate()
  @Type(() => Date)
  timestamp: Date;
}
