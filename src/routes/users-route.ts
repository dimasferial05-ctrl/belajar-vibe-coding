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
        name: t.String({ minLength: 1 }),
        email: t.String({ minLength: 1 }),
        password: t.String({ minLength: 1 }),
      }),
    }
  )
  .post(
    "/login",
    async ({ body }) => {
      return await loginUser(body);
    },
    {
      body: t.Object({
        email: t.String({ minLength: 1 }),
        password: t.String({ minLength: 1 }),
      }),
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
        .get("/current", async ({ token }) => {
          return await getCurrentUser(token);
        })
        .delete("/logout", async ({ token }) => {
          return await logoutUser(token);
        })
  );
