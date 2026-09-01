import { Elysia, t } from "elysia";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const app = new Elysia()
  .get("/", () => {
    return {
      status: "success",
      message: "Server Elysia + Bun + Drizzle + MySQL is running! 🚀",
      timestamp: new Date().toISOString(),
    };
  })
  .group("/users", (app) =>
    app
      .get("/", async () => {
        try {
          const allUsers = await db.select().from(users);
          return { status: "success", data: allUsers };
        } catch (error: any) {
          return { status: "error", message: error.message };
        }
      })
      .get("/:id", async ({ params, set }) => {
        try {
          const id = parseInt(params.id);
          const [user] = await db.select().from(users).where(eq(users.id, id));
          if (!user) {
            set.status = 404;
            return { status: "error", message: "User not found" };
          }
          return { status: "success", data: user };
        } catch (error: any) {
          set.status = 500;
          return { status: "error", message: error.message };
        }
      })
      .post(
        "/",
        async ({ body, set }) => {
          try {
            const result = await db.insert(users).values({
              name: body.name,
              email: body.email,
            });
            set.status = 201;
            return {
              status: "success",
              message: "User created successfully",
              data: {
                id: Number(result[0].insertId),
                name: body.name,
                email: body.email,
              },
            };
          } catch (error: any) {
            set.status = 500;
            return { status: "error", message: error.message };
          }
        },
        {
          body: t.Object({
            name: t.String(),
            email: t.String(),
          }),
        }
      )
  )
  .listen(port);

console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);
