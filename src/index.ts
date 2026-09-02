import { Elysia } from "elysia";
import { usersRoute } from "./routes/users-route";

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const app = new Elysia()
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
