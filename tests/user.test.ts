import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { sessions, users } from "../src/db/schema";
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

describe("Get Current User Endpoint (GET /api/user/current)", () => {
  const testEmail = "current.user@vibe.com";
  const testToken = "valid-session-token-12345";
  let testUserId: number;

  beforeAll(async () => {
    // Bersihkan data lama jika ada
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

    // Buat user baru
    const hashedPassword = await bcrypt.hash("rahasia", 10);
    const [userResult] = await db.insert(users).values({
      name: "Current User",
      email: testEmail,
      password: hashedPassword,
    });
    testUserId = Number(userResult.insertId);

    // Buat session baru untuk user tersebut
    await db.insert(sessions).values({
      userId: testUserId,
      token: testToken,
    });
  });

  afterAll(async () => {
    if (testUserId) {
      await db.delete(sessions).where(eq(sessions.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  it("berhasil mendapatkan data user saat ini dengan token yang valid", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/user/current", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      })
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: {
        id: number | string;
        name: string;
        email: string;
        createdAt: string;
      };
    };

    expect(body).toHaveProperty("data");
    expect(body.data.id).toBe(testUserId);
    expect(body.data.name).toBe("Current User");
    expect(body.data.email).toBe(testEmail);
    expect(typeof body.data.createdAt).toBe("string");
    expect(new Date(body.data.createdAt).toString()).not.toBe("Invalid Date");
  });

  it("mengembalikan 401 unauthorized ketika header Authorization tidak disertakan", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/user/current", {
        method: "GET",
      })
    );

    expect(response.status).toBe(401);
    const body = (await response.json()) as { error: string };
    expect(body).toEqual({ error: "unauthorized" });
  });

  it("mengembalikan 401 unauthorized ketika token tidak valid / tidak ada di database", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/user/current", {
        method: "GET",
        headers: {
          Authorization: "Bearer invalid-token-99999",
        },
      })
    );

    expect(response.status).toBe(401);
    const body = (await response.json()) as { error: string };
    expect(body).toEqual({ error: "unauthorized" });
  });

  it("mengembalikan 401 unauthorized ketika format header bukan Bearer", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/user/current", {
        method: "GET",
        headers: {
          Authorization: "Basic 12345",
        },
      })
    );

    expect(response.status).toBe(401);
    const body = (await response.json()) as { error: string };
    expect(body).toEqual({ error: "unauthorized" });
  });
});

describe("Logout User Endpoint (DELETE /api/users/logout)", () => {
  const testEmail = "logout.user@vibe.com";
  const testToken = "logout-session-token-12345";
  let testUserId: number;

  beforeAll(async () => {
    // Bersihkan data lama jika ada
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

    // Buat user baru
    const hashedPassword = await bcrypt.hash("rahasia", 10);
    const [userResult] = await db.insert(users).values({
      name: "Logout User",
      email: testEmail,
      password: hashedPassword,
    });
    testUserId = Number(userResult.insertId);

    // Buat session baru untuk user tersebut
    await db.insert(sessions).values({
      userId: testUserId,
      token: testToken,
    });
  });

  afterAll(async () => {
    if (testUserId) {
      await db.delete(sessions).where(eq(sessions.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  it("berhasil logout dan menghapus session ketika token valid", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      })
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: string };
    expect(body).toEqual({ data: "OK" });

    // Verifikasi di database bahwa sesi telah terhapus
    const remainingSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, testToken));

    expect(remainingSessions.length).toBe(0);
  });

  it("mengembalikan 401 unauthorized ketika logout ulang dengan token yang sudah dihapus", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      })
    );

    expect(response.status).toBe(401);
    const body = (await response.json()) as { error: string };
    expect(body).toEqual({ error: "unauthorized" });
  });

  it("mengembalikan 401 unauthorized ketika header Authorization tidak disertakan", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
      })
    );

    expect(response.status).toBe(401);
    const body = (await response.json()) as { error: string };
    expect(body).toEqual({ error: "unauthorized" });
  });

  it("mengembalikan 401 unauthorized ketika token tidak valid / tidak ada di database", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: {
          Authorization: "Bearer invalid-token-99999",
        },
      })
    );

    expect(response.status).toBe(401);
    const body = (await response.json()) as { error: string };
    expect(body).toEqual({ error: "unauthorized" });
  });

  it("mengembalikan 401 unauthorized ketika format header bukan Bearer", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: {
          Authorization: "Basic 12345",
        },
      })
    );

    expect(response.status).toBe(401);
    const body = (await response.json()) as { error: string };
    expect(body).toEqual({ error: "unauthorized" });
  });
});

