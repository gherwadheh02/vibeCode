# Issue: Implementasi API Get Current User

## Deskripsi Tugas
Buatkan API endpoint untuk mengambil data user yang saat ini sedang login berdasarkan token autentikasi. Tugas ini mencakup pembuatan logic di layer service dan pembuatan/penambahan endpoint di layer route.

## Spesifikasi API

- **Endpoint:** `GET /api/user/current`
- **Headers:**
  - `Authorization: Bearer <token>`
    *(Catatan: Token ini adalah token yang disimpan di dalam tabel `users` di database)*

### Response Body (Success)
```json
{
    "data": {
        "id": "<id>",
        "name": "<name>",
        "email": "<email>",
        "createdAt": "<createdAt>"
    }
}
```

### Response Body (Error)
Jika token tidak valid, tidak ditemukan, atau header tidak disertakan:
```json
{
    "error": "unauthorized"
}
```
*(Status HTTP direkomendasikan: 401 Unauthorized)*

## Struktur Direktori dan File
Pastikan kode yang ditulis diletakkan pada tempat yang sesuai dengan arsitektur saat ini:
- **Routes:** `src/routes/user.routes.ts` (menggunakan Elysia JS, atau framework utama project)
- **Services:** `src/services/user.service.ts` (berisi seluruh logic bisnis dan interaksi dengan database)

---

## Tahapan Implementasi

Berikut adalah langkah-langkah terstruktur yang harus dilakukan untuk mengimplementasikan fitur ini. Kerjakan secara berurutan:

### Langkah 1: Persiapan Service Layer (`src/services/user.service.ts`)
1. Buka file `src/services/user.service.ts`.
2. Buat sebuah fungsi baru (misal: `getCurrentUser(token: string)`).
3. Di dalam fungsi ini, buat query ke database untuk mencari user di tabel `users` di mana kolom `token` cocok dengan parameter token yang diberikan.
4. Jika user ditemukan, kembalikan object user yang hanya berisi field: `id`, `name`, `email`, dan `createdAt`.
5. Jika user tidak ditemukan, lemparkan error atau kembalikan nilai `null` untuk menandakan autentikasi gagal.

### Langkah 2: Persiapan Route Layer (`src/routes/user.routes.ts`)
1. Buka file `src/routes/user.routes.ts`.
2. Buat rute baru dengan method `GET` untuk path `/api/user/current` (sesuaikan dengan prefix Elysia instance Anda jika `/api/user` sudah di-group).
3. Di dalam handler rute tersebut:
   - Ambil nilai dari header `Authorization`.
   - Lakukan validasi. Jika header tidak ada, atau tidak dimulai dengan kata `Bearer `, segera kembalikan response error: `{"error": "unauthorized"}` dengan status 401.
   - Ekstrak nilai `<token>` yang ada setelah kata `Bearer `.

### Langkah 3: Integrasi Route dan Service
1. Masih di dalam handler rute `GET /api/user/current`, panggil fungsi `getCurrentUser(token)` dari service layer.
2. Tangkap balasan dari service layer:
   - Jika berhasil mendapatkan data user, format balasan tersebut ke dalam bentuk JSON yang memiliki root property `"data"` sesuai spesifikasi response sukses, lalu kembalikan.
   - Jika gagal (karena nilai kembalian `null` atau error dari service), tangkap kondisi tersebut dan kembalikan response error: `{"error": "unauthorized"}` dengan status 401.

### Langkah 4: Pengujian (Testing)
Lakukan pengujian secara manual untuk memvalidasi bahwa fitur berjalan dengan benar:
1. **Skenario Sukses:** Lakukan request dengan menyertakan `Authorization: Bearer <token_yang_ada_di_db>`. Pastikan data user muncul sesuai spesifikasi.
2. **Skenario Gagal 1:** Lakukan request tanpa menyertakan header `Authorization`. Pastikan mendapat respons `{"error": "unauthorized"}`.
3. **Skenario Gagal 2:** Lakukan request dengan `Authorization: Bearer token_ngasal`. Pastikan mendapat respons `{"error": "unauthorized"}`.
