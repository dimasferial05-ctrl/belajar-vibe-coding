import { Elysia, t } from "elysia";
import {
  getCurrentUser,
  InvalidCredentialsError,
  loginUser,
  registerUser,
  UnauthorizedError,
  UserAlreadyExistsError,
} from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const result = await registerUser(body);
        return result;
      } catch (error: any) {
        if (error instanceof UserAlreadyExistsError) {
          set.status = 400;
          return { error: error.message };
        }
        set.status = 500;
        return { error: error.message || "Internal server error" };
      }
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
    async ({ body, set }) => {
      try {
        const result = await loginUser(body);
        return result;
      } catch (error: any) {
        if (error instanceof InvalidCredentialsError) {
          set.status = 400;
          return { error: error.message };
        }
        set.status = 500;
        return { error: error.message || "Internal server error" };
      }
    },
    {
      body: t.Object({
        email: t.String({ minLength: 1 }),
        password: t.String({ minLength: 1 }),
      }),
    }
  )
  .get("/current", async ({ headers, set }) => {
    try {
      const authHeader = headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const token = authHeader.substring(7).trim();
      if (!token) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const result = await getCurrentUser(token);
      return result;
    } catch (error: any) {
      if (error instanceof UnauthorizedError) {
        set.status = 401;
        return { error: error.message };
      }
      set.status = 500;
      return { error: error.message || "Internal server error" };
    }
  });
