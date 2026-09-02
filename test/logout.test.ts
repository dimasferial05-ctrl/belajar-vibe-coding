import { beforeEach, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { sessions } from "../src/db/schema";
import { usersRoute } from "../src/routes/users-route";
import { clearDatabase } from "./test-helper";

const app = new Elysia().use(usersRoute);

describe("User Logout Feature (DELETE /api/users/logout)", () => {
  const testUser = {
    name: "Dimas Logout Test",
    email: "dimas_logout@localhost",
    password: "passwordValid123",
  };

  let validToken = "";

  beforeEach(async () => {
    // Hapus data terlebih dahulu sebelum setiap skenario agar konsisten
    await clearDatabase();

    // 1. Registrasi user
    await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testUser),
      })
    );

    // 2. Login user untuk mendapatkan session token
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
    const loginBody: any = await loginRes.json();
    validToken = loginBody.data;
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

    // Pastikan session sudah terhapus dari database
    const [deletedSession] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, validToken));
    expect(deletedSession).toBeUndefined();
  });

  it("token yang sudah di-logout tidak bisa digunakan lagi untuk GET /api/users/current (Status 401)", async () => {
    // 1. Lakukan logout terlebih dahulu
    const logoutRes = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      })
    );
    expect(logoutRes.status).toBe(200);

    // 2. Coba akses endpoint GET /api/users/current dengan token yang sama
    const currentRes = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      })
    );

    expect(currentRes.status).toBe(401);
    const currentBody: any = await currentRes.json();
    expect(currentBody).toEqual({ error: "Unauthorized" });
  });

  it("gagal logout ulang jika token sudah dihapus / tidak valid (Status 401)", async () => {
    // 1. Logout pertama kali
    await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      })
    );

    // 2. Logout kedua kali dengan token yang sama
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

  it("gagal (Status 401 Unauthorized) jika header Authorization hanya 'Bearer ' tanpa token", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: {
          Authorization: "Bearer ",
        },
      })
    );

    expect(res.status).toBe(401);
    const body: any = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });
});
