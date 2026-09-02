import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { usersRoute } from "../src/routes/users-route";

const app = new Elysia().use(usersRoute);

describe("User Registration (POST /api/users)", () => {
  const testUser = {
    name: "Dimas",
    email: `dimas_${Date.now()}@localhost`,
    password: "rahasia",
  };

  it("berhasil melakukan registrasi user baru (Status 200 & Response OK)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testUser),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ data: "OK" });
  });

  it("gagal registrasi ketika email sudah terdaftar (Status 400 & Pesan Error)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testUser),
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "Email sudah terdaftar" });
  });

  it("validasi gagal ketika request body tidak lengkap (Status 422)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Dimas",
          // email tidak diisi
          password: "rahasia",
        }),
      })
    );

    expect(res.status).toBe(422);
  });
});
