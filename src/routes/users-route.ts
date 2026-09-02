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
        name: t.String({ minLength: 1, maxLength: 255, examples: ["Dimas Ferial"] }),
        email: t.String({ minLength: 1, maxLength: 255, examples: ["dimas@example.com"] }),
        password: t.String({ minLength: 1, maxLength: 255, examples: ["passwordRahasia123"] }),
      }),
      response: {
        200: t.Object(
          {
            data: t.String({ examples: ["OK"] }),
          },
          { description: "Berhasil registrasi pengguna baru" }
        ),
        400: t.Object(
          {
            error: t.String({ examples: ["Email sudah terdaftar"] }),
          },
          { description: "Email sudah terdaftar" }
        ),
      },
      detail: {
        summary: "Registrasi User Baru",
        description: "Mendaftarkan user baru ke dalam database dan menghash password",
        tags: ["Users"],
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
        email: t.String({ minLength: 1, maxLength: 255, examples: ["dimas@example.com"] }),
        password: t.String({ minLength: 1, maxLength: 255, examples: ["passwordRahasia123"] }),
      }),
      response: {
        200: t.Object(
          {
            data: t.String({ examples: ["018f3a57-79a2-7a2e-9bb7-6e40d0f7725a"] }),
          },
          { description: "Berhasil login dan mengembalikan session token UUID" }
        ),
        400: t.Object(
          {
            error: t.String({ examples: ["Email atau password salah"] }),
          },
          { description: "Email atau password salah" }
        ),
      },
      detail: {
        summary: "Login User",
        description: "Autentikasi pengguna dan mengembalikan session token (UUID)",
        tags: ["Users"],
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
            response: {
              200: t.Object(
                {
                  data: t.Object({
                    id: t.Number({ examples: [1] }),
                    name: t.String({ examples: ["Dimas Ferial"] }),
                    email: t.String({ examples: ["dimas@example.com"] }),
                    created_at: t.Any({ examples: ["2026-09-02T03:00:00.000Z"] }),
                  }),
                },
                { description: "Berhasil mendapatkan data profil pengguna yang login" }
              ),
              401: t.Object(
                {
                  error: t.String({ examples: ["Unauthorized"] }),
                },
                { description: "Unauthorized (token tidak valid atau tidak disertakan)" }
              ),
            },
            detail: {
              summary: "Dapatkan Data Pengguna Saat Ini",
              description: "Mengambil profil pengguna yang sedang login berdasarkan token Bearer",
              tags: ["Users"],
              security: [{ bearerAuth: [] }],
            },
          }
        )
        .delete(
          "/logout",
          async ({ token }) => {
            return await logoutUser(token);
          },
          {
            response: {
              200: t.Object(
                {
                  data: t.String({ examples: ["OK"] }),
                },
                { description: "Berhasil logout dan menghapus token sesi" }
              ),
              401: t.Object(
                {
                  error: t.String({ examples: ["Unauthorized"] }),
                },
                { description: "Unauthorized (token tidak valid atau tidak disertakan)" }
              ),
            },
            detail: {
              summary: "Logout User",
              description: "Mengakhiri sesi dengan menghapus session token dari database",
              tags: ["Users"],
              security: [{ bearerAuth: [] }],
            },
          }
        )
  );
