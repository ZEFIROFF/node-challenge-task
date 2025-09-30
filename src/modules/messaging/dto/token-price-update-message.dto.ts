import { IsString, IsNumber, IsUUID, IsDate, Min } from "class-validator";
import { Type } from "class-transformer";

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
