import { Elysia, t } from "elysia";
import { loginUser } from "../services/auth.service";

export const authRoutes = new Elysia()
  .post(
    "/api/login",
    async ({ body, set }) => {
      try {
        const result = await loginUser(body);
        return result;
      } catch (error: any) {
        if (error.message === "Email atau password salah") {
          set.status = 400;
          return { error: "Email atau password salah" };
        }
        set.status = 500;
        return { error: "Terjadi kesalahan pada server" };
      }
    },
    {
      body: t.Object({
        email: t.String({ minLength: 1, error: "Email is required" }),
        password: t.String({ minLength: 1, error: "Password is required" }),
      }),
    }
  );
