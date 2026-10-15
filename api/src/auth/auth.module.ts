import { Module } from "@nestjs/common";
import { CadastrarUsuarioUseCase } from "./application/use-cases/cadastrar-usuario.use-case.js";
import { LoginUseCase } from "./application/use-cases/login.use-case.js";
import { ACCESS_TOKEN_ISSUER } from "./application/ports/access-token-issuer.js";
import { PASSWORD_HASHER } from "./application/ports/password-hasher.js";
import { USUARIO_REPOSITORY } from "./application/ports/usuario.repository.js";
import { PrismaUsuarioRepository } from "./infrastructure/prisma-usuario.repository.js";
import { Rs256JwtTokenIssuer } from "./infrastructure/security/rs256-jwt-token-issuer.js";
import { ScryptPasswordHasher } from "./infrastructure/security/scrypt-password-hasher.js";
import { AuthController } from "./presentation/auth.controller.js";

@Module({
  controllers: [AuthController],
  providers: [
    PrismaUsuarioRepository,
    { provide: USUARIO_REPOSITORY, useExisting: PrismaUsuarioRepository },
    { provide: PASSWORD_HASHER, useClass: ScryptPasswordHasher },
    { provide: ACCESS_TOKEN_ISSUER, useClass: Rs256JwtTokenIssuer },
    CadastrarUsuarioUseCase,
    LoginUseCase,
  ],
})
export class AuthModule {}
