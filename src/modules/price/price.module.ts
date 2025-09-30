import { Module } from '@nestjs/common';

import { MessagingModule } from '../messaging/messaging.module';
import { TokenModule } from '../token/token.module';
import { MockPriceService } from './services/mock-price.service';
import { TokenPriceUpdateService } from './services/token-price-update.service';

@Module({
  imports: [TokenModule, MessagingModule],
  providers: [MockPriceService, TokenPriceUpdateService],
  exports: [MockPriceService, TokenPriceUpdateService],
})
export class PriceModule {}
