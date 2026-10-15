import { Body, ConflictException, Controller, HttpCode, HttpStatus, Post, UnauthorizedException } from "@nestjs/common";
import { RotaPublica } from "../../shared/auth/roles.decorator.js";
import { CadastrarUsuarioUseCase } from "../application/use-cases/cadastrar-usuario.use-case.js";
import { CredenciaisInvalidasError, EmailJaCadastradoError } from "../application/errors.js";
import { LoginUseCase } from "../application/use-cases/login.use-case.js";
import { CadastroUsuarioDto } from "./cadastro-usuario.dto.js";
import { LoginDto } from "./login.dto.js";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly cadastrarUsuario: CadastrarUsuarioUseCase,
    private readonly login: LoginUseCase,
  ) {}

  @Post("usuarios")
  @RotaPublica()
  async cadastrar(@Body() body: CadastroUsuarioDto) {
    try {
      return await this.cadastrarUsuario.execute(body);
    } catch (error) {
      if (error instanceof EmailJaCadastradoError) throw new ConflictException(error.message);
      throw error;
    }
  }

  @Post("sessoes")
  @HttpCode(HttpStatus.OK)
  @RotaPublica()
  async criarSessao(@Body() body: LoginDto) {
    try {
      return await this.login.execute(body.email, body.senha);
    } catch (error) {
      if (error instanceof CredenciaisInvalidasError) {
        throw new UnauthorizedException(error.message);
      }
      throw error;
    }
  }
}
