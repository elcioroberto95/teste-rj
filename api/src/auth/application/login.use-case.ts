import { Inject, Injectable } from "@nestjs/common";
import { CredenciaisInvalidasError } from "./errors.js";
import { JwtTokenIssuer } from "./jwt-token.issuer.js";
import { PasswordHasher } from "./password-hasher.js";
import { USUARIO_REPOSITORY, type Usuario, type UsuarioRepository } from "./usuario.repository.js";

const HASH_DE_COMPARACAO = `scrypt$${"0".repeat(32)}$${"0".repeat(128)}`;

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenIssuer: JwtTokenIssuer,
  ) {}

  async execute(emailInput: string, senha: string) {
    const usuario = await this.usuarios.buscarPorEmail(emailInput.trim().toLowerCase());
    if (!usuario) {
      await this.passwordHasher.verificar(senha, HASH_DE_COMPARACAO);
      throw new CredenciaisInvalidasError();
    }
    if (!(await this.passwordHasher.verificar(senha, usuario.senhaHash))) {
      throw new CredenciaisInvalidasError();
    }

    return {
      accessToken: await this.tokenIssuer.issue(usuario.id, usuario.perfil),
      tokenType: "Bearer",
      expiresIn: 3600,
      user: this.publicUser(usuario),
    };
  }

  private publicUser(usuario: Usuario) {
    return { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil };
  }
}
