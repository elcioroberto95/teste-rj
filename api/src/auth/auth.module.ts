import { Module } from "@nestjs/common";
import { CadastrarUsuarioUseCase } from "./application/cadastrar-usuario.use-case.js";
import { JwtTokenIssuer } from "./application/jwt-token.issuer.js";
import { LoginUseCase } from "./application/login.use-case.js";
import { PasswordHasher } from "./application/password-hasher.js";
import { USUARIO_REPOSITORY } from "./application/usuario.repository.js";
import { PrismaUsuarioRepository } from "./infrastructure/prisma-usuario.repository.js";
import { AuthController } from "./presentation/auth.controller.js";

@Module({
  controllers: [AuthController],
  providers: [
    PrismaUsuarioRepository,
    { provide: USUARIO_REPOSITORY, useExisting: PrismaUsuarioRepository },
    PasswordHasher,
    JwtTokenIssuer,
    CadastrarUsuarioUseCase,
    LoginUseCase,
  ],
})
export class AuthModule {}
