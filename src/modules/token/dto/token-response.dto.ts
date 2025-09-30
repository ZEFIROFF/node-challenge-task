import { Expose, Transform } from 'class-transformer';

export class TokenResponseDto {
  @Expose()
  id: string;

  @Expose()
  @Transform(({ value }) => value?.toString('hex'))
  address: string;

  @Expose()
  symbol: string;

  @Expose()
  name: string;

  @Expose()
  decimals: number;

  @Expose()
  isNative: boolean;

  @Expose()
  chainId: string;

  @Expose()
  isProtected: boolean;

  @Expose()
  lastUpdateAuthor: string;

  @Expose()
  priority: number;

  @Expose()
  timestamp: Date;

  @Expose()
  chain_Id: string;

  @Expose()
  chain_DeId: number;

  @Expose()
  chain_Name: string;

  @Expose()
  chain_IsEnabled: boolean;

  @Expose()
  logo_Id: string;

  @Expose()
  logo_TokenId: string;

  @Expose()
  logo_BigRelativePath: string;

  @Expose()
  logo_SmallRelativePath: string;

  @Expose()
  logo_ThumbRelativePath: string;

  @Expose()
  price: number;

  @Expose()
  lastPriceUpdate: Date;
}
