import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { sessions, users } from "../db/schema";

export interface LoginUserInput {
  email: string;
  password: string;
}

export async function loginUser(input: LoginUserInput) {
  // 1. Cari record pengguna di tabel users berdasarkan email
  const userRecords = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  const user = userRecords[0];
  if (!user) {
    throw new Error("Email atau password salah");
  }

  // 2. Bandingkan password menggunakan bcrypt.compare
  const isPasswordMatch = await bcrypt.compare(input.password, user.password);
  if (!isPasswordMatch) {
    throw new Error("Email atau password salah");
  }

  // 3. Generate token UUID baru untuk sesi
  const token = crypto.randomUUID();

  // 4. Simpan record sesi ke tabel sessions
  await db.insert(sessions).values({
    userId: user.id,
    token,
  });

  // 5. Kembalikan response sukses dengan token
  return { data: token };
}
