import { Elysia, t } from "elysia";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getCurrentUser, logoutUser, registerUser } from "../services/user.service";

export const userRoutes = new Elysia()
  .post(
    "/api/users",
    async ({ body, set }) => {
      try {
        const result = await registerUser(body);
        return result;
      } catch (error: any) {
        if (error.message === "Email sudah terdaftar") {
          set.status = 400;
          return { error: "Email sudah terdaftar" };
        }
        set.status = 500;
        return { error: "Terjadi kesalahan pada server" };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, error: "Name is required" }),
        email: t.String({ minLength: 1, error: "Email is required" }),
        password: t.String({ minLength: 1, error: "Password is required" }),
      }),
    }
  )
  .use(authMiddleware)
  .get(
    "/api/user/current",
    async ({ token, set }) => {
      try {
        const user = await getCurrentUser(token);
        if (!user) {
          set.status = 401;
          return { error: "unauthorized" };
        }

        return {
          data: user,
        };
      } catch (error: any) {
        set.status = 500;
        return { error: "Terjadi kesalahan pada server" };
      }
    }
  )
  .delete(
    "/api/users/logout",
    async ({ token, set }) => {
      try {
        const success = await logoutUser(token);
        if (!success) {
          set.status = 401;
          return { error: "unauthorized" };
        }

        return {
          data: "OK",
        };
      } catch (error: any) {
        set.status = 500;
        return { error: "Terjadi kesalahan pada server" };
      }
    }
  );


