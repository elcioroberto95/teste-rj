import type { Perfil } from "../../../shared/auth/auth.types.js";

export const USUARIO_REPOSITORY = Symbol("USUARIO_REPOSITORY");

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senhaHash: string;
  perfil: Perfil;
}

export interface UsuarioRepository {
  buscarPorEmail(email: string): Promise<Usuario | null>;
  criar(input: Omit<Usuario, "id">): Promise<Usuario>;
}
