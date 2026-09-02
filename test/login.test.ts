import { beforeEach, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { sessions, users } from "../src/db/schema";
import { usersRoute } from "../src/routes/users-route";
import { clearDatabase } from "./test-helper";

const app = new Elysia().use(usersRoute);

describe("User Login Feature (POST /api/users/login)", () => {
  const registeredUser = {
    name: "Dimas Login Test",
    email: "dimas_login@localhost",
    password: "passwordValid123",
  };

  beforeEach(async () => {
    // Hapus data terlebih dahulu sebelum setiap skenario agar konsisten
    await clearDatabase();

    // Persiapkan user terdaftar di database
    await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registeredUser),
      })
    );
  });

  it("berhasil login dengan email dan password yang benar (Status 200 & Token UUID)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registeredUser.email,
          password: registeredUser.password,
        }),
      })
    );

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data).toBeString();

    // Verifikasi format UUID v4
    expect(body.data).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    // Verifikasi session tersimpan di database
    const [savedSession] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, body.data));
    expect(savedSession).toBeDefined();
    expect(savedSession?.token).toBe(body.data);

    // Verifikasi relasi ke user
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, registeredUser.email));
    expect(dbUser).toBeDefined();
    expect(savedSession?.userId).toBe(dbUser?.id);
  });

  it("gagal login jika password salah (Status 400 & Error message)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registeredUser.email,
          password: "passwordSalahBanget",
        }),
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "Email atau password salah" });
  });

  it("gagal login jika email tidak terdaftar di database (Status 400 & Error message)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "belum_daftar@localhost",
          password: registeredUser.password,
        }),
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "Email atau password salah" });
  });

  it("validasi gagal jika field email tidak disertakan (Status 422)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: registeredUser.password,
        }),
      })
    );

    expect(res.status).toBe(422);
  });

  it("validasi gagal jika field password tidak disertakan (Status 422)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registeredUser.email,
        }),
      })
    );

    expect(res.status).toBe(422);
  });

  it("validasi gagal jika input email kosong (Status 422)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "",
          password: registeredUser.password,
        }),
      })
    );

    expect(res.status).toBe(422);
  });

  it("validasi gagal jika input email melebihi 255 karakter (Status 422)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `${"a".repeat(250)}@localhost.com`,
          password: registeredUser.password,
        }),
      })
    );

    expect(res.status).toBe(422);
  });

  it("validasi gagal jika input password melebihi 255 karakter (Status 422)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registeredUser.email,
          password: "P".repeat(300),
        }),
      })
    );

    expect(res.status).toBe(422);
  });
});
