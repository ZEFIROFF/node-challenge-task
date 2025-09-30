import { Module } from "@nestjs/common";
import { MockPriceService } from "./services/mock-price.service";
import { TokenPriceUpdateService } from "./services/token-price-update.service";
import { TokenModule } from "../token/token.module";
import { MessagingModule } from "../messaging/messaging.module";

@Module({
  imports: [TokenModule, MessagingModule],
  providers: [MockPriceService, TokenPriceUpdateService],
  exports: [MockPriceService, TokenPriceUpdateService],
})
export class PriceModule {}
