import { Elysia } from "elysia";
import { usersRoute } from "./routes/users-route";
import { swagger } from "@elysiajs/swagger";

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const app = new Elysia()
  .use(
    swagger({
      path: "/swagger",
      documentation: {
        info: {
          title: "Belajar Vibe Coding API",
          version: "1.0.0",
          description: "Dokumentasi API untuk aplikasi autentikasi pengguna",
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "UUID",
            },
          },
        },
        tags: [
          { name: "Users", description: "Endpoint untuk autentikasi dan manajemen user" },
        ],
      },
    })
  )
  .get("/", () => {
    return {
      status: "success",
      message: "Server Elysia + Bun + Drizzle + MySQL is running! 🚀",
      timestamp: new Date().toISOString(),
    };
  })
  .use(usersRoute)
  .listen(port);

console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);
