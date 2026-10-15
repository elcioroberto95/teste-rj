import { Inject, Injectable } from "@nestjs/common";
import type { Perfil } from "../../../shared/auth/auth.types.js";
import { EmailJaCadastradoError } from "../errors.js";
import { ACCESS_TOKEN_ISSUER, type AccessTokenIssuer } from "../ports/access-token-issuer.js";
import { PASSWORD_HASHER, type PasswordHasher } from "../ports/password-hasher.js";
import { USUARIO_REPOSITORY, type Usuario, type UsuarioRepository } from "../ports/usuario.repository.js";

export interface CadastrarUsuarioInput {
  nome: string;
  email: string;
  senha: string;
  perfil: Perfil;
}

@Injectable()
export class CadastrarUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(ACCESS_TOKEN_ISSUER) private readonly tokenIssuer: AccessTokenIssuer,
  ) {}

  async execute(input: CadastrarUsuarioInput) {
    const email = input.email.trim().toLowerCase();
    if (await this.usuarios.buscarPorEmail(email)) throw new EmailJaCadastradoError();

    const usuario: Usuario = await this.usuarios.criar({
      nome: input.nome.trim(),
      email,
      senhaHash: await this.passwordHasher.hash(input.senha),
      perfil: input.perfil,
    });

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
