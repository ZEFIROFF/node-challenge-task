import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { TokenSeeder } from "./seeders/token.seeder";

@Global()
@Module({
  providers: [PrismaService, TokenSeeder],
  exports: [PrismaService, TokenSeeder],
})
export class DatabaseModule {}
