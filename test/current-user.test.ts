import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { usersRoute } from "../src/routes/users-route";

const app = new Elysia().use(usersRoute);

describe("Get Current User Feature (GET /api/users/current)", () => {
  const testUser = {
    name: "Dimas",
    email: `current_user_test_${Date.now()}@localhost`,
    password: "rahasia",
  };

  let validToken = "";

  it("mempersiapkan user baru dan login untuk mendapatkan token", async () => {
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
    expect(body.data.password).toBeUndefined(); // Password tidak boleh bocor
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

  it("gagal (Status 401 Unauthorized) jika token salah atau tidak ditemukan", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: {
          Authorization: "Bearer token-palsu-12345",
        },
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
});
