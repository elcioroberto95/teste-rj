import { readFile } from "node:fs/promises";
import { importPKCS8, SignJWT } from "jose";

const [role = "passageiro", subject = "passageiro-demo"] = process.argv.slice(2);
if (role !== "passageiro" && role !== "motorista") {
  throw new Error("Perfil deve ser passageiro ou motorista");
}

const privatePem = await readFile(new URL("../.dev-keys/private.pem", import.meta.url), "utf8");
const privateKey = await importPKCS8(privatePem, "RS256");
const token = await new SignJWT({ role })
  .setProtectedHeader({ alg: "RS256", typ: "JWT" })
  .setSubject(subject)
  .setIssuer(process.env.JWT_ISSUER ?? "corridas-local")
  .setAudience(process.env.JWT_AUDIENCE ?? "corridas-api")
  .setIssuedAt()
  .setExpirationTime("1h")
  .sign(privateKey);

console.log(token);
