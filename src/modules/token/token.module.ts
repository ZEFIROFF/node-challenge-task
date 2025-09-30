import { Module } from "@nestjs/common";
import { TokenService } from "./services/token.service";
import { TokenController } from "./controllers/token.controller";

@Module({
  controllers: [TokenController],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
