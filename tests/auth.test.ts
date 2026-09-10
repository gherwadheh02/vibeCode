import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { sessions, users } from "../src/db/schema";
import { app } from "../src/index";

describe("User Login Endpoint (POST /api/login)", () => {
  const testEmail = "agus.login@vibe.com";
  const testPassword = "rahasia";
  let testUserId: number;

  beforeAll(async () => {
    // Bersihkan sesi dan user pengujian jika ada
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0]!;
      await db.delete(sessions).where(eq(sessions.userId, existingUser.id));
      await db.delete(users).where(eq(users.id, existingUser.id));
    }

    // Buat user untuk pengujian
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const [result] = await db.insert(users).values({
      name: "Agus Login",
      email: testEmail,
      password: hashedPassword,
    });

    testUserId = Number(result.insertId);
  });

  afterAll(async () => {
    // Bersihkan data setelah pengujian selesai
    if (testUserId) {
      await db.delete(sessions).where(eq(sessions.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  it("berhasil login dengan kredensial yang benar dan mengembalikan token UUID", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      })
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: string };
    expect(body).toHaveProperty("data");
    expect(typeof body.data).toBe("string");

    // Validasi format UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuidRegex.test(body.data)).toBe(true);

    // Verifikasi bahwa token tersimpan di database sessions
    const sessionRecords = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, body.data))
      .limit(1);

    expect(sessionRecords.length).toBe(1);
    const sessionRecord = sessionRecords[0]!;
    expect(sessionRecord.userId).toBe(testUserId);
    expect(sessionRecord.token).toBe(body.data);
    expect(sessionRecord.createdAt).toBeDefined();
  });

  it("mengembalikan pesan error ketika password salah", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testEmail,
          password: "passwordsalah",
        }),
      })
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body).toEqual({ error: "Email atau password salah" });
  });

  it("mengembalikan pesan error ketika email tidak terdaftar", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "tidakada@vibe.com",
          password: testPassword,
        }),
      })
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body).toEqual({ error: "Email atau password salah" });
  });

  it("mengembalikan error validasi jika field tidak lengkap", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testEmail,
        }),
      })
    );

    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});
