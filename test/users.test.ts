import { beforeEach, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { usersRoute } from "../src/routes/users-route";
import { clearDatabase } from "./test-helper";

const app = new Elysia().use(usersRoute);

describe("User Registration Feature (POST /api/users)", () => {
  const validUser = {
    name: "Dimas Ferial",
    email: "dimas@localhost",
    password: "password123",
  };

  beforeEach(async () => {
    // Hapus data terlebih dahulu sebelum setiap skenario agar konsisten
    await clearDatabase();
  });

  it("berhasil melakukan registrasi user baru (Status 200 & Response OK)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validUser),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ data: "OK" });

    // Verifikasi user tersimpan di database dengan password ter-hash
    const [savedUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, validUser.email));
    expect(savedUser).toBeDefined();
    expect(savedUser?.name).toBe(validUser.name);
    expect(savedUser?.email).toBe(validUser.email);
    expect(savedUser?.password).not.toBe(validUser.password);
    expect(await Bun.password.verify(validUser.password, savedUser!.password)).toBe(true);
  });

  it("gagal registrasi ketika email sudah terdaftar di database (Status 400 & Pesan Error)", async () => {
    // Registrasikan user pertama
    await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validUser),
      })
    );

    // Coba registrasi ulang dengan email yang sama
    const res = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Dimas Duplikat",
          email: validUser.email,
          password: "passwordBaru",
        }),
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "Email sudah terdaftar" });
  });

  it("validasi gagal ketika field name tidak disertakan (Status 422)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "tanpa_nama@localhost",
          password: "rahasia",
        }),
      })
    );

    expect(res.status).toBe(422);
  });

  it("validasi gagal ketika field email tidak disertakan (Status 422)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Tanpa Email",
          password: "rahasia",
        }),
      })
    );

    expect(res.status).toBe(422);
  });

  it("validasi gagal ketika field password tidak disertakan (Status 422)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Tanpa Password",
          email: "tanpa_password@localhost",
        }),
      })
    );

    expect(res.status).toBe(422);
  });

  it("validasi gagal ketika name berupa string kosong (Status 422)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "",
          email: "empty_name@localhost",
          password: "rahasia",
        }),
      })
    );

    expect(res.status).toBe(422);
  });

  it("validasi gagal ketika input name melebihi 255 karakter (Status 422)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "A".repeat(300),
          email: "valid@localhost",
          password: "rahasia",
        }),
      })
    );

    expect(res.status).toBe(422);
  });

  it("validasi gagal ketika input email melebihi 255 karakter (Status 422)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Dimas",
          email: `${"a".repeat(250)}@localhost.com`,
          password: "rahasia",
        }),
      })
    );

    expect(res.status).toBe(422);
  });

  it("validasi gagal ketika input password melebihi 255 karakter (Status 422)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Dimas",
          email: "valid_pass@localhost",
          password: "P".repeat(300),
        }),
      })
    );

    expect(res.status).toBe(422);
  });
});
