# Belajar Vibe Coding (Bun + ElysiaJS + Drizzle + MySQL)

Proyek backend modern menggunakan **Bun**, **ElysiaJS**, **Drizzle ORM**, dan **MySQL**.

---

## 🛠️ Tech Stack
- **Runtime:** [Bun](https://bun.sh)
- **Web Framework:** [ElysiaJS](https://elysiajs.com)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team)
- **Database:** MySQL
- **Migration Tool:** Drizzle Kit

---

## 📁 Struktur Folder
```text
.
├── drizzle/              # Berkas migrasi database SQL yang digenerate oleh Drizzle Kit
├── src/
│   ├── db/
│   │   ├── index.ts      # Koneksi database & instance Drizzle
│   │   └── schema.ts     # Definisi skema tabel database (Users)
│   └── index.ts          # Server ElysiaJS & route handlers
├── .env                  # Variabel environment (koneksi database & port)
├── .env.example          # Contoh variabel environment
├── drizzle.config.ts     # Konfigurasi Drizzle Kit
├── package.json
└── tsconfig.json
```

---

## 🚀 Panduan Menjalankan

### 1. Instalasi Dependensi
```bash
bun install
```

### 2. Konfigurasi Database
Salin `.env.example` ke `.env` dan sesuaikan kredensial MySQL Anda (misal menggunakan MySQL Laragon/XAMPP):
```env
PORT=3000
DATABASE_URL=mysql://root:@localhost:3306/belajar_vibe_coding
```

### 3. Migrasi Database
Untuk melakukan generate file migrasi dan push skema langsung ke MySQL:
```bash
# Push skema langsung ke database
bun run db:push

# Atau generate file migrasi SQL
bun run db:generate
```

### 4. Menjalankan Server Development
```bash
bun run dev
```
Server akan aktif di `http://localhost:3000`.

---

## 📌 Endpoint API
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/` | Health check & Welcome message |
| `GET` | `/users` | Mengambil seluruh data users |
| `GET` | `/users/:id` | Mengambil data user berdasarkan ID |
| `POST` | `/users` | Menambahkan user baru (`{ "name": "...", "email": "..." }`) |
