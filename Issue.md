# Feature: User Login API

## Deskripsi Singkat
Tugas ini adalah membuat fitur login pengguna. Fitur ini meliputi pembuatan tabel `sessions` di database untuk menyimpan sesi login pengguna, serta implementasi endpoint API untuk proses autentikasi.

## Spesifikasi Kebutuhan

### 1. Skema Database (Tabel `sessions`)
Tambahkan tabel `sessions` menggunakan Drizzle ORM dengan struktur berikut:
- `id`: integer, auto increment, primary key
- `user_id`: integer (Foreign Key ke tabel `users`)
- `token`: varchar(255), not null (berisi UUID untuk token user yang login)
- `created_at`: timestamp, default current_timestamp

### 2. Struktur Folder & File
Lanjutkan penggunaan struktur folder yang sudah ada di dalam `src`:
- `src/routes/`: Untuk routing ElysiaJS.
  - Penamaan file menggunakan format: `auth.routes.ts` (atau jika ingin digabung bisa di `user.routes.ts`).
- `src/services/`: Untuk logika bisnis.
  - Penamaan file menggunakan format: `auth.service.ts` (atau digabung di `user.service.ts`).

### 3. API Endpoint
Buat endpoint API untuk login user.
- **Method & Endpoint**: `POST /api/login`
- **Request Body (JSON)**:
  ```json
  {
      "email" : "agus@vibe.com",
      "password" : "rahasia"
  }
  ```
- **Response Body (Success)**:
  ```json
  {
      "data" : "<token-uuid>"
  }
  ```
- **Response Body (Error)**:
  ```json
  {
      "error" : "Email atau password salah"
  }
  ```

---

## Tahapan Implementasi (Instruksi)

Silakan ikuti langkah-langkah berikut secara berurutan untuk mengimplementasikan fitur ini. Asumsikan proyek ini menggunakan Bun, ElysiaJS, Drizzle ORM, MySQL, dan TypeBox.

### Langkah 1: Perbarui Skema Database (`src/db/schema.ts`)
- Buka file `src/db/schema.ts`.
- Tambahkan definisi tabel `sessions`:
  - Gunakan `int("id").autoincrement().primaryKey()` untuk id.
  - Gunakan `int("user_id").references(() => users.id)` untuk membuat foreign key yang mengarah ke tabel `users`.
  - Gunakan `varchar("token", { length: 255 }).notNull()` untuk token sesi.
  - Gunakan `timestamp("created_at").defaultNow().notNull()` untuk waktu pembuatan.
- Jalankan perintah CLI Drizzle untuk memperbarui database:
  - `bun run db:generate` (untuk membuat file migrasi)
  - `bun run db:push` (untuk mengeksekusi migrasi ke MySQL)

### Langkah 2: Implementasi Logic Bisnis (`src/services/auth.service.ts`)
- Buat file baru `src/services/auth.service.ts` (atau gunakan service yang ada).
- Buat fungsi untuk menangani login (misal `loginUser(input)`).
- Di dalam fungsi tersebut:
  1. Cari record pengguna di tabel `users` berdasarkan `email` input menggunakan Drizzle.
  2. Jika pengguna tidak ditemukan, segera *throw Error* (atau *return* status error) dengan pesan `"Email atau password salah"`.
  3. Jika pengguna ditemukan, bandingkan `password` dari input dengan hash password di database menggunakan library `bcryptjs` (method `bcrypt.compare`).
  4. Jika password tidak cocok, kembalikan pesan error yang persis sama: `"Email atau password salah"`. Hal ini untuk keamanan agar tidak memberi tahu *attacker* apakah email terdaftar atau tidak.
  5. Jika kredensial cocok, buat UUID baru sebagai token sesi (bisa menggunakan `crypto.randomUUID()`).
  6. *Insert* baris baru ke tabel `sessions` dengan `user_id` pengguna tersebut dan `token` yang baru di-generate.
  7. Kembalikan respons sukses berupa `{ data: "<token>" }`.

### Langkah 3: Implementasi Routing (`src/routes/auth.routes.ts`)
- Buat file baru `src/routes/auth.routes.ts`.
- Import `Elysia` dan `t` (TypeBox) dari `"elysia"`.
- Import fungsi `loginUser` dari service.
- Buat instance Elysia baru dan definisikan rute `POST /api/login`.
- Panggil fungsi `loginUser` dengan data `body` dari request.
- Gunakan blok `try-catch` (atau mekanisme error handling Elysia):
  - Jika terjadi error dengan pesan `"Email atau password salah"`, atur status HTTP ke `401 Unauthorized` atau `400 Bad Request` dan berikan kembalian `{ error: "Email atau password salah" }`.
- Daftarkan validasi body request:
  - Gunakan Elysia TypeBox (`t.Object`) agar request yang masuk dipastikan memiliki string `email` dan string `password`.

### Langkah 4: Daftarkan Rute ke Aplikasi Utama (`src/index.ts`)
- Buka `src/index.ts`.
- Import rute autentikasi yang baru dibuat.
- Daftarkan menggunakan `.use(authRoutes)` ke instance utama aplikasi.

### Langkah 5: Verifikasi dan Pengujian
- Pastikan tidak ada error kompilasi TypeScript dengan menjalankan `bun x tsc --noEmit`.
- Jalankan server dengan `bun run dev`.
- Lakukan pengujian endpoint dengan klien HTTP (Postman/cURL):
  - Uji memasukkan kredensial yang salah dan pastikan pesannya `"Email atau password salah"`.
  - Uji memasukkan kredensial yang benar dan periksa apakah kamu mendapatkan token UUID dan token tersebut masuk ke dalam database tabel `sessions`.
- (Opsional tetapi disarankan) Tambahkan unit/integration test baru di folder `tests/` yang menyimulasikan login gagal dan sukses.
