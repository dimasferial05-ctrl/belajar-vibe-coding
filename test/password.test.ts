import { describe, expect, it } from "bun:test";

describe("Password Hashing with Bcrypt", () => {
  it("should hash password with bcrypt algorithm and verify successfully", async () => {
    const rawPassword = "rahasia";
    const hashedPassword = await Bun.password.hash(rawPassword, {
      algorithm: "bcrypt",
      cost: 10,
    });

    expect(hashedPassword).toBeString();
    expect(hashedPassword.startsWith("$2a$") || hashedPassword.startsWith("$2b$")).toBeTrue();

    const isMatch = await Bun.password.verify(rawPassword, hashedPassword);
    expect(isMatch).toBeTrue();

    const isWrongMatch = await Bun.password.verify("salahpassword", hashedPassword);
    expect(isWrongMatch).toBeFalse();
  });
});
