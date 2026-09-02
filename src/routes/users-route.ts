import { Elysia, t } from "elysia";
import {
  getCurrentUser,
  InvalidCredentialsError,
  loginUser,
  logoutUser,
  registerUser,
  UnauthorizedError,
  UserAlreadyExistsError,
} from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .error({
    UNAUTHORIZED: UnauthorizedError,
    USER_ALREADY_EXISTS: UserAlreadyExistsError,
    INVALID_CREDENTIALS: InvalidCredentialsError,
  })
  .onError(({ code, error, set }) => {
    if (code === "UNAUTHORIZED") {
      set.status = 401;
      return { error: error.message };
    }
    if (code === "USER_ALREADY_EXISTS" || code === "INVALID_CREDENTIALS") {
      set.status = 400;
      return { error: error.message };
    }
  })
  .post(
    "/",
    async ({ body }) => {
      return await registerUser(body);
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 255 }),
        email: t.String({ minLength: 1, maxLength: 255 }),
        password: t.String({ minLength: 1, maxLength: 255 }),
      }),
      detail: {
        summary: "Registrasi User Baru",
        description: "Mendaftarkan user baru ke dalam database dan menghash password",
        tags: ["Users"],
        responses: {
          200: { description: "Berhasil registrasi" },
          400: { description: "Email sudah terdaftar" },
          422: { description: "Validasi body gagal" },
        },
      },
    }
  )
  .post(
    "/login",
    async ({ body }) => {
      return await loginUser(body);
    },
    {
      body: t.Object({
        email: t.String({ minLength: 1, maxLength: 255 }),
        password: t.String({ minLength: 1, maxLength: 255 }),
      }),
      detail: {
        summary: "Login User",
        description: "Autentikasi pengguna dan mengembalikan session token (UUID)",
        tags: ["Users"],
        responses: {
          200: { description: "Berhasil login dan mendapatkan token" },
          400: { description: "Email atau password salah" },
          422: { description: "Validasi body gagal" },
        },
      },
    }
  )
  .guard(
    {
      beforeHandle: ({ headers }) => {
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          throw new UnauthorizedError("Unauthorized");
        }
        const token = authHeader.substring(7).trim();
        if (!token) {
          throw new UnauthorizedError("Unauthorized");
        }
      },
    },
    (app) =>
      app
        .resolve(({ headers }) => {
          const token = headers.authorization!.substring(7).trim();
          return { token };
        })
        .get(
          "/current",
          async ({ token }) => {
            return await getCurrentUser(token);
          },
          {
            detail: {
              summary: "Dapatkan Data Pengguna Saat Ini",
              description: "Mengambil profil pengguna yang sedang login berdasarkan token Bearer",
              tags: ["Users"],
              responses: {
                200: { description: "Berhasil mendapatkan profil user" },
                401: { description: "Unauthorized (token tidak valid atau tidak ada)" },
              },
            },
          }
        )
        .delete(
          "/logout",
          async ({ token }) => {
            return await logoutUser(token);
          },
          {
            detail: {
              summary: "Logout User",
              description: "Mengakhiri sesi dengan menghapus session token dari database",
              tags: ["Users"],
              responses: {
                200: { description: "Berhasil logout" },
                401: { description: "Unauthorized (token tidak valid atau tidak ada)" },
              },
            },
          }
        )
  );
