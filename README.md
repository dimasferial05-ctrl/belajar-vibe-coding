# Belajar Vibe Coding (Bun + ElysiaJS + Drizzle + MySQL)

Aplikasi ini adalah sebuah RESTful API Backend sederhana yang menangani proses Autentikasi Pengguna (User Authentication) yang mencakup fitur Registrasi, Login, mendapatkan data pengguna saat ini (Get Current User), dan Logout. Proyek ini dibangun dengan tujuan pembelajaran ("Vibe Coding") menggunakan teknologi ekosistem JavaScript/TypeScript modern yang sangat cepat.

---

## 🛠️ Technology Stack & Libraries

- **Runtime:** [Bun](https://bun.sh) (Sangat cepat, memiliki built-in test runner, bundler, dan package manager)
- **Web Framework:** [ElysiaJS](https://elysiajs.com) (Framework web super cepat untuk Bun)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team) (TypeScript ORM yang ringan dan type-safe)
- **Database:** MySQL (Relational Database)
- **Password Hashing:** `Bun.password` (Built-in Bun API menggunakan algoritma bcrypt)
- **Testing:** `bun:test` (Built-in Bun test runner)

---

## 📁 Arsitektur & Struktur Direktori

Aplikasi ini menggunakan pola arsitektur *Service-Controller/Route* yang memisahkan antara layer routing (HTTP) dan layer *business logic*.

```text
.
├── drizzle/              # Berkas migrasi database SQL yang di-generate oleh Drizzle Kit
├── src/
│   ├── db/
│   │   ├── index.ts      # Konfigurasi koneksi database MySQL & instance Drizzle
│   │   └── schema.ts     # Definisi skema tabel database (Users & Sessions)
│   ├── routes/           # Layer Routing (Controller) ElysiaJS (ex: users-route.ts)
│   ├── services/         # Layer Business Logic (ex: users-service.ts)
│   └── index.ts          # Entry point utama aplikasi Server ElysiaJS
├── test/                 # Kumpulan Unit Test terisolasi per fitur (ex: users.test.ts)
├── .env                  # Variabel environment (koneksi database)
└── package.json          # Dependency & npm scripts
```

### Penamaan File (File Naming Conventions)
- **Kebab-case**: Digunakan untuk penamaan file TypeScript seperti `users-route.ts` dan `users-service.ts`.
- **Routes (`*-route.ts`)**: Berisi definisi endpoint HTTP, validasi payload/body, dan auth guard / middleware.
- **Services (`*-service.ts`)**: Berisi logika bisnis utama, *query* ke database dengan Drizzle ORM, dan lemparan error (*throw error*).
- **Tests (`*.test.ts`)**: Kumpulan skenario unit test.

---

## 🗄️ Skema Database

Aplikasi ini menggunakan 2 tabel utama yang saling berelasi:

### Tabel `users`
Menyimpan data pendaftaran kredensial pengguna.
- `id` (INT, Primary Key, Auto Increment)
- `name` (VARCHAR(255), Not Null)
- `email` (VARCHAR(255), Unique, Not Null)
- `password` (VARCHAR(255), Not Null) - *Disimpan dalam format hash bcrypt*
- `created_at` (TIMESTAMP, Default Now)

### Tabel `sessions`
Menyimpan state / sesi login pengguna (Stateful Authentication).
- `id` (INT, Primary Key, Auto Increment)
- `token` (VARCHAR(255), Unique, Not Null) - *Berupa UUID v4*
- `user_id` (INT, Foreign Key references `users.id`)
- `created_at` (TIMESTAMP, Default Now)

---

## 🌐 Endpoint API yang Tersedia

### 1. Register User
- **Endpoint**: `POST /api/users`
- **Body Request**: `{ "name": "...", "email": "...", "password": "..." }`
- **Deskripsi**: Mendaftarkan pengguna baru ke database.

### 2. Login User
- **Endpoint**: `POST /api/users/login`
- **Body Request**: `{ "email": "...", "password": "..." }`
- **Deskripsi**: Autentikasi pengguna dan mengembalikan Session Token.
- **Response Sukses**: `{ "data": "<uuid-token>" }`

### 3. Get Current User
- **Endpoint**: `GET /api/users/current`
- **Headers**: `Authorization: Bearer <token>`
- **Deskripsi**: Mendapatkan profil pengguna yang sedang login berdasarkan token. Data password tidak akan dikembalikan demi keamanan.

### 4. Logout User
- **Endpoint**: `DELETE /api/users/logout`
- **Headers**: `Authorization: Bearer <token>`
- **Deskripsi**: Menghapus token sesi pengguna dari database.

---

## 🚀 Cara Setup Project

1. **Clone repository ini** ke mesin lokal Anda.
2. **Install dependency** menggunakan Bun:
   ```bash
   bun install
   ```
3. **Konfigurasi Environment Variables**:
   Buat file `.env` di *root folder* (atau salin dari `.env.example` jika ada) dan pastikan variabel `DATABASE_URL` mengarah ke database MySQL lokal Anda.
   ```env
   DATABASE_URL="mysql://root:@localhost:3306/belajar_vibe_coding"
   ```
4. **Push Skema Database**:
   Jalankan perintah berikut agar Drizzle ORM membuat tabel secara otomatis di database MySQL Anda:
   ```bash
   bun run db:push
   ```

---

## 🏃 Cara Menjalankan Aplikasi

- **Development Mode (Auto-reload saat ada perubahan kode):**
  ```bash
  bun run dev
  ```
- **Production Mode:**
  ```bash
  bun run start
  ```
Server secara *default* akan berjalan di `http://localhost:3000`.

---

## 🧪 Cara Menjalankan Test (Unit Testing)

Aplikasi ini telah dilindungi oleh pengujian *unit test* komprehensif menggunakan test runner bawaan Bun (`bun:test`).

- Jalankan semua skenario pengujian:
  ```bash
  bun test
  ```
*Catatan: Test suite dirancang secara independen. Data uji coba di tabel `users` dan `sessions` akan dihapus sebelum setiap skenario dijalankan (`beforeEach`) untuk menjaga konsistensi. Harap **tidak menjalankan** command test ini di atas database production.*
