import { describe, expect, it } from "@jest/globals";
import { ScryptPasswordHasher } from "../../src/auth/infrastructure/security/scrypt-password-hasher.js";

describe("ScryptPasswordHasher", () => {
  it("stores a salted scrypt hash and verifies only the original password", async () => {
    const hasher = new ScryptPasswordHasher();
    const hash = await hasher.hash("senha-forte-123");

    expect(hash).toMatch(/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/);
    expect(hash).not.toContain("senha-forte-123");
    await expect(hasher.verificar("senha-forte-123", hash)).resolves.toBe(true);
    await expect(hasher.verificar("senha-errada-123", hash)).resolves.toBe(false);
    await expect(hasher.verificar("senha-forte-123", "formato-inválido")).resolves.toBe(false);
  });
});
