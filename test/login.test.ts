import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { eq } from "drizzle-orm";
import { db, pool } from "../src/db";
import { sessions, users } from "../src/db/schema";
import { usersRoute } from "../src/routes/users-route";

const app = new Elysia().use(usersRoute);

describe("User Login Feature (POST /api/users/login)", () => {
  const testUser = {
    name: "Dimas",
    email: `login_test_${Date.now()}@localhost`,
    password: "rahasia",
  };

  it("mempersiapkan user baru untuk pengujian login", async () => {
    const regRes = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testUser),
      })
    );
    expect(regRes.status).toBe(200);
  });

  it("berhasil login dengan email dan password yang benar (Status 200 & Token UUID)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeString();
    // UUID v4 format regex
    expect(body.data).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    // Verifikasi data session di database
    const [savedSession] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, body.data));
    expect(savedSession).toBeDefined();
    expect(savedSession.token).toBe(body.data);
  });

  it("gagal login jika password salah (Status 400 & Error message)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testUser.email,
          password: "passwordsalah",
        }),
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "Email atau password salah" });
  });

  it("gagal login jika email tidak terdaftar (Status 400 & Error message)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "tidakada@localhost",
          password: "rahasia",
        }),
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "Email atau password salah" });
  });

  it("validasi gagal jika body request tidak lengkap (Status 422)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testUser.email,
          // password missing
        }),
      })
    );

    expect(res.status).toBe(422);
  });
});
