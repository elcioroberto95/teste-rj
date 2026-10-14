import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { CorridasModule } from "./corridas/corridas.module.js";
import { JwtGuard } from "./shared/auth/jwt.guard.js";
import { PrismaModule } from "./shared/database/prisma.module.js";
import { HealthController } from "./health.controller.js";
import { AuthModule } from "./auth/auth.module.js";

@Module({
  controllers: [HealthController],
  imports: [PrismaModule, CorridasModule, AuthModule],
  providers: [{ provide: APP_GUARD, useClass: JwtGuard }],
})
export class AppModule {}
