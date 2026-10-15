export const PASSWORD_HASHER = Symbol("PASSWORD_HASHER");

export interface PasswordHasher {
  hash(senha: string): Promise<string>;
  verificar(senha: string, hash: string): Promise<boolean>;
}
