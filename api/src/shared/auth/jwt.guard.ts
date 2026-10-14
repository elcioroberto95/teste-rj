import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { importSPKI, jwtVerify } from "jose";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Perfil, UsuarioAutenticado } from "./auth.types.js";
import { PERFIS_KEY } from "./roles.decorator.js";

type RequestWithUser = {
  headers: { authorization?: string };
  user: UsuarioAutenticado;
};

@Injectable()
export class JwtGuard implements CanActivate {
  private publicKey?: Promise<CryptoKey>;

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) throw new UnauthorizedException();

    try {
      const key = this.getPublicKey();
      const { payload } = await jwtVerify(authorization.slice(7), await key, {
        algorithms: ["RS256"],
        issuer: process.env.JWT_ISSUER ?? "corridas-local",
        audience: process.env.JWT_AUDIENCE ?? "corridas-api",
      });
      if (typeof payload.sub !== "string" || !payload.sub ||
          (payload.role !== "passageiro" && payload.role !== "motorista")) {
        throw new UnauthorizedException();
      }
      request.user = { sub: payload.sub, role: payload.role as Perfil };
    } catch {
      throw new UnauthorizedException("Token JWT inválido");
    }

    const perfis = this.reflector.getAllAndOverride<Perfil[]>(PERFIS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (perfis && !perfis.includes(request.user.role)) throw new ForbiddenException();
    return true;
  }

  private getPublicKey(): Promise<CryptoKey> {
    const keyPath = process.env.JWT_PUBLIC_KEY_PATH ?? "./.dev-keys/public.pem";
    this.publicKey ??= readFile(resolve(process.cwd(), keyPath), "utf8")
      .then((pem) => importSPKI(pem, "RS256"));
    return this.publicKey;
  }
}
