import type { Perfil } from "../../../shared/auth/auth.types.js";

export const ACCESS_TOKEN_ISSUER = Symbol("ACCESS_TOKEN_ISSUER");

export interface AccessTokenIssuer {
  issue(subject: string, role: Perfil): Promise<string>;
}
