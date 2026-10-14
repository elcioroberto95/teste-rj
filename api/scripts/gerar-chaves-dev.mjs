import { generateKeyPairSync } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

const directory = new URL("../.dev-keys/", import.meta.url);
await mkdir(directory, { recursive: true });

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

await Promise.all([
  writeFile(new URL("public.pem", directory), publicKey, { mode: 0o644 }),
  writeFile(new URL("private.pem", directory), privateKey, { mode: 0o600 }),
]);
console.log("Chaves RSA locais criadas em .dev-keys (diretório ignorado pelo Git).");
