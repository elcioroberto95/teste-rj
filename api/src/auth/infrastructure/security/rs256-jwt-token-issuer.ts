import { Injectable } from "@nestjs/common";
import { importPKCS8, SignJWT } from "jose";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Perfil } from "../../../shared/auth/auth.types.js";
import type { AccessTokenIssuer } from "../../application/ports/access-token-issuer.js";

@Injectable()
export class Rs256JwtTokenIssuer implements AccessTokenIssuer {
  private privateKey?: Promise<CryptoKey>;

  async issue(subject: string, role: Perfil): Promise<string> {
    this.privateKey ??= readFile(
      resolve(process.env.JWT_PRIVATE_KEY_PATH ?? "./.dev-keys/private.pem"),
      "utf8",
    ).then((pem) => importPKCS8(pem, "RS256"));

    return new SignJWT({ role })
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .setSubject(subject)
      .setIssuer(process.env.JWT_ISSUER ?? "corridas-local")
      .setAudience(process.env.JWT_AUDIENCE ?? "corridas-api")
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(await this.privateKey);
  }
}
