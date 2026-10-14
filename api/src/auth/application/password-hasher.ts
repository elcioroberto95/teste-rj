import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

function derivar(senha: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(senha, salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}

export class PasswordHasher {
  async hash(senha: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const derived = await derivar(senha, salt);
    return `scrypt$${salt}$${derived.toString("hex")}`;
  }

  async verificar(senha: string, hash: string): Promise<boolean> {
    const [algorithm, salt, encoded] = hash.split("$");
    if (algorithm !== "scrypt" || !salt || !encoded || !/^[a-f0-9]{128}$/i.test(encoded)) {
      return false;
    }
    const expected = Buffer.from(encoded, "hex");
    const actual = await derivar(senha, salt);
    return timingSafeEqual(expected, actual);
  }
}
