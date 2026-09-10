import { Elysia } from "elysia";
import { userRoutes } from "./routes/user.routes";

const port = Number(process.env.PORT) || 3000;

export const app = new Elysia()
  .get("/", () => ({
    name: "vibecode-api",
    version: "1.0.0",
    framework: "ElysiaJS",
    runtime: "Bun",
  }))
  .get("/ping", () => ({
    message: "pong",
    timestamp: new Date().toISOString(),
  }))
  .get("/health", () => ({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }))
  .use(userRoutes)
  .listen(port);

console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);
