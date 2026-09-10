import { Elysia, t } from "elysia";
import { registerUser } from "../services/user.service";

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
  );
