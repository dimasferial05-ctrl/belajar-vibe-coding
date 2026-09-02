import { beforeEach, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { usersRoute } from "../src/routes/users-route";
import { clearDatabase } from "./test-helper";

const app = new Elysia().use(usersRoute);

describe("Get Current User Feature (GET /api/users/current)", () => {
  const testUser = {
    name: "Dimas Current Test",
    email: "dimas_current@localhost",
    password: "passwordValid123",
  };

  let validToken = "";

  beforeEach(async () => {
    // Hapus data terlebih dahulu sebelum setiap skenario agar konsisten
    await clearDatabase();

    // 1. Registrasikan user baru
    await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testUser),
      })
    );

    // 2. Login untuk mendapatkan token session
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

  it("berhasil mendapatkan data user saat ini dengan token valid (Status 200)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      })
    );

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data).toBeDefined();
    expect(body.data.name).toBe(testUser.name);
    expect(body.data.email).toBe(testUser.email);
    expect(body.data.id).toBeNumber();
    expect(body.data.created_at).toBeDefined();
    expect(body.data.password).toBeUndefined(); // Keamanan: password tidak boleh diekspos
  });

  it("gagal (Status 401 Unauthorized) jika request tanpa header Authorization", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
      })
    );

    expect(res.status).toBe(401);
    const body: any = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("gagal (Status 401 Unauthorized) jika format Authorization bukan Bearer", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: {
          Authorization: `Basic ${validToken}`,
        },
      })
    );

    expect(res.status).toBe(401);
    const body: any = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("gagal (Status 401 Unauthorized) jika header Authorization hanya 'Bearer ' tanpa token", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: {
          Authorization: "Bearer ",
        },
      })
    );

    expect(res.status).toBe(401);
    const body: any = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("gagal (Status 401 Unauthorized) jika token salah atau tidak ditemukan di database", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: {
          Authorization: "Bearer token-palsu-tidak-ada-di-db",
        },
      })
    );

    expect(res.status).toBe(401);
    const body: any = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });
});
