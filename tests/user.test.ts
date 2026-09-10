import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { app } from "../src/index";

describe("User Registration Endpoint (POST /api/users)", () => {
  const testEmail = "agus@vibe.com";

  beforeAll(async () => {
    // Bersihkan data test jika sebelumnya ada
    await db.delete(users).where(eq(users.email, testEmail));
  });

  afterAll(async () => {
    // Bersihkan data test setelah pengujian selesai
    await db.delete(users).where(eq(users.email, testEmail));
  });

  it("berhasil mendaftarkan user baru", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Agus",
          email: testEmail,
          password: "rahasia",
        }),
      })
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: string };
    expect(body).toEqual({ data: "oke" });

    // Verifikasi di database bahwa user tersimpan dengan password ter-hash
    const insertedUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);

    expect(insertedUsers.length).toBe(1);
    const insertedUser = insertedUsers[0]!;
    expect(insertedUser.name).toBe("Agus");
    expect(insertedUser.email).toBe(testEmail);
    expect(insertedUser.password).not.toBe("rahasia");

    const isMatch = await bcrypt.compare("rahasia", insertedUser.password);
    expect(isMatch).toBe(true);
  });

  it("mengembalikan pesan error ketika email sudah terdaftar", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Agus",
          email: testEmail,
          password: "rahasia",
        }),
      })
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body).toEqual({ error: "Email sudah terdaftar" });
  });

  it("mengembalikan error validasi jika field tidak lengkap", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "invalid@vibe.com",
        }),
      })
    );

    // Elysia schema validation returns status 422 or 400 for invalid body
    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});
