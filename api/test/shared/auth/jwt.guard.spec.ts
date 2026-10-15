import { afterAll, afterEach, beforeAll, describe, expect, it } from "@jest/globals";
import type { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { generateKeyPairSync } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { importPKCS8, SignJWT } from "jose";
import { JwtGuard } from "../../../src/shared/auth/jwt.guard.js";
import { PERFIS_KEY, PUBLIC_ROUTE_KEY } from "../../../src/shared/auth/roles.decorator.js";

const issuer = "corridas-test";
const audience = "corridas-api-test";
const previousEnv = {
  publicKeyPath: process.env.JWT_PUBLIC_KEY_PATH,
  issuer: process.env.JWT_ISSUER,
  audience: process.env.JWT_AUDIENCE,
};

describe("JwtGuard", () => {
  const metadata = new Map<string, unknown>();
  const handler = () => undefined;
  let guard: JwtGuard;
  let privateKey: CryptoKey;
  let keyDirectory: string;

  beforeAll(async () => {
    const pair = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    keyDirectory = await mkdtemp(join(tmpdir(), "corridas-jwt-test-"));
    const publicKeyPath = join(keyDirectory, "public.pem");
    await writeFile(publicKeyPath, pair.publicKey);
    privateKey = await importPKCS8(pair.privateKey, "RS256");
    process.env.JWT_PUBLIC_KEY_PATH = publicKeyPath;
    process.env.JWT_ISSUER = issuer;
    process.env.JWT_AUDIENCE = audience;
    guard = new JwtGuard({
      getAllAndOverride: (key: string) => metadata.get(key),
    } as unknown as Reflector);
  });

  afterEach(() => metadata.clear());

  afterAll(async () => {
    await rm(keyDirectory, { recursive: true, force: true });
    if (previousEnv.publicKeyPath === undefined) delete process.env.JWT_PUBLIC_KEY_PATH;
    else process.env.JWT_PUBLIC_KEY_PATH = previousEnv.publicKeyPath;
    if (previousEnv.issuer === undefined) delete process.env.JWT_ISSUER;
    else process.env.JWT_ISSUER = previousEnv.issuer;
    if (previousEnv.audience === undefined) delete process.env.JWT_AUDIENCE;
    else process.env.JWT_AUDIENCE = previousEnv.audience;
  });

  async function token(claims: {
    sub?: string;
    role?: string;
    expired?: boolean;
    tokenIssuer?: string;
    tokenAudience?: string;
  } = {}) {
    const builder = new SignJWT(claims.role === undefined ? {} : { role: claims.role })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer(claims.tokenIssuer ?? issuer)
      .setAudience(claims.tokenAudience ?? audience);
    if (claims.sub !== undefined) builder.setSubject(claims.sub);
    builder.setExpirationTime(claims.expired ? "-1h" : "1h");
    return builder.sign(privateKey);
  }

  async function activate(authorization?: string): Promise<{ allowed: boolean; user?: unknown }> {
    const request: { headers: { authorization?: string }; user?: unknown } = {
      headers: authorization === undefined ? {} : { authorization },
    };
    const context = {
      getHandler: () => handler,
      getClass: () => class TestController {},
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    const result = await guard.canActivate(context);
    return { allowed: result, user: request.user };
  }

  it("allows a public route without a token", async () => {
    metadata.set(PUBLIC_ROUTE_KEY, true);
    expect(await activate()).toEqual({ allowed: true, user: undefined });
  });

  it("returns 401 when the Bearer token is missing", async () => {
    await expect(activate()).rejects.toMatchObject({ status: 401 });
  });

  it.each([
    { scenario: "malformed token", type: "malformed" },
    { scenario: "expired token", type: "expired" },
    { scenario: "missing subject", type: "missing-sub" },
    { scenario: "invalid role", type: "bad-role" },
    { scenario: "wrong issuer", type: "wrong-issuer" },
    { scenario: "wrong audience", type: "wrong-audience" },
  ])("returns 401 for $scenario", async ({ type }) => {
    const jwt = type === "expired"
      ? await token({ sub: "user-1", role: "passageiro", expired: true })
      : type === "missing-sub"
        ? await token({ role: "passageiro" })
        : type === "bad-role"
          ? await token({ sub: "user-1", role: "admin" })
          : type === "wrong-issuer"
            ? await token({ sub: "user-1", role: "passageiro", tokenIssuer: "other-issuer" })
            : type === "wrong-audience"
              ? await token({ sub: "user-1", role: "passageiro", tokenAudience: "other-api" })
              : "invalid";
    await expect(activate(`Bearer ${jwt}`)).rejects.toMatchObject({ status: 401 });
  });

  it("installs identity from JWT claims for an authorized role", async () => {
    metadata.set(PERFIS_KEY, ["passageiro"]);
    const jwt = await token({ sub: "passenger-1", role: "passageiro" });
    expect(await activate(`Bearer ${jwt}`)).toEqual({
      allowed: true,
      user: { sub: "passenger-1", role: "passageiro" },
    });
  });

  it("returns 403 when the authenticated role is not authorized", async () => {
    metadata.set(PERFIS_KEY, ["motorista"]);
    const jwt = await token({ sub: "passenger-1", role: "passageiro" });
    await expect(activate(`Bearer ${jwt}`)).rejects.toMatchObject({ status: 403 });
  });
});
