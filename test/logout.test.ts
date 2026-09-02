import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { sessions } from "../src/db/schema";
import { usersRoute } from "../src/routes/users-route";

const app = new Elysia().use(usersRoute);

describe("User Logout Feature (DELETE /api/users/logout)", () => {
  const testUser = {
    name: "Dimas Logout",
    email: `logout_test_${Date.now()}@localhost`,
    password: "rahasia",
  };

  let validToken = "";

  it("mempersiapkan user baru dan login untuk mendapatkan session token", async () => {
    // 1. Register user
    const regRes = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testUser),
      })
    );
    expect(regRes.status).toBe(200);

    // 2. Login user
    const loginRes = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      })
    );
    expect(loginRes.status).toBe(200);
    const loginBody: any = await loginRes.json();
    expect(loginBody.data).toBeString();
    validToken = loginBody.data;

    // Pastikan session tersimpan di DB
    const [savedSession] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, validToken));
    expect(savedSession).toBeDefined();
  });

  it("berhasil logout dengan token valid (Status 200 & data: OK)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      })
    );

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body).toEqual({ data: "OK" });

    // Pastikan session sudah terhapus dari tabel sessions di DB
    const [deletedSession] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, validToken));
    expect(deletedSession).toBeUndefined();
  });

  it("token yang sudah di-logout tidak bisa digunakan lagi untuk GET /api/users/current (Status 401)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      })
    );

    expect(res.status).toBe(401);
    const body: any = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("gagal logout ulang jika token sudah dihapus / tidak valid (Status 401)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      })
    );

    expect(res.status).toBe(401);
    const body: any = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("gagal (Status 401 Unauthorized) jika logout tanpa header Authorization", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
      })
    );

    expect(res.status).toBe(401);
    const body: any = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("gagal (Status 401 Unauthorized) jika format Authorization salah", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: {
          Authorization: "Basic token-palsu",
        },
      })
    );

    expect(res.status).toBe(401);
    const body: any = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });
});
