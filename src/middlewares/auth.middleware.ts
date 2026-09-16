import { Elysia } from "elysia";

export const authMiddleware = new Elysia({ name: "auth-middleware" })
  .derive({ as: "scoped" }, ({ headers, request }) => {
    const authHeader = headers.authorization || request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { token: "" };
    }
    return { token: authHeader.slice(7).trim() };
  })
  .onBeforeHandle({ as: "scoped" }, ({ token, set }) => {
    if (!token) {
      set.status = 401;
      return { error: "unauthorized" };
    }
  });
