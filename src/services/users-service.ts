import { eq } from "drizzle-orm";
import { db } from "../db";
import { sessions, users } from "../db/schema";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export class UserAlreadyExistsError extends Error {
  constructor(message = "Email sudah terdaftar") {
    super(message);
    this.name = "UserAlreadyExistsError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor(message = "Email atau password salah") {
    super(message);
    this.name = "InvalidCredentialsError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Mendaftarkan pengguna baru ke dalam database.
 * Fungsi ini akan mengecek ketersediaan email terlebih dahulu.
 * Jika email belum digunakan, fungsi akan melakukan hashing pada password
 * menggunakan algoritma bcrypt dan menyimpan data pengguna baru ke database.
 * 
 * @param input Data pendaftaran (name, email, password)
 * @returns Object berisi { data: "OK" } jika berhasil
 * @throws UserAlreadyExistsError Jika email sudah ada di database
 */
export async function registerUser(input: RegisterUserInput) {
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existingUsers.length > 0) {
    throw new UserAlreadyExistsError("Email sudah terdaftar");
  }

  const hashedPassword = await Bun.password.hash(input.password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  await db.insert(users).values({
    name: input.name,
    email: input.email,
    password: hashedPassword,
  });

  return { data: "OK" };
}

/**
 * Melakukan proses autentikasi pengguna.
 * Fungsi ini memverifikasi kecocokan email dan password. Jika cocok,
 * fungsi akan men-generate sebuah token UUID (Session Token)
 * dan menyimpannya ke tabel `sessions`.
 * 
 * @param input Kredensial login (email, password)
 * @returns Object berisi { data: "token_uuid" } jika berhasil
 * @throws InvalidCredentialsError Jika email tidak ditemukan atau password salah
 */
export async function loginUser(input: LoginUserInput) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (!user) {
    throw new InvalidCredentialsError("Email atau password salah");
  }

  const isPasswordValid = await Bun.password.verify(input.password, user.password);
  if (!isPasswordValid) {
    throw new InvalidCredentialsError("Email atau password salah");
  }

  const token = crypto.randomUUID();

  await db.insert(sessions).values({
    token,
    userId: user.id,
  });

  return { data: token };
}

/**
 * Mendapatkan informasi profil pengguna yang sedang login berdasarkan session token.
 * Fungsi ini memvalidasi keberadaan token di tabel `sessions`,
 * lalu men-join data dengan tabel `users` untuk mengambil informasi profil.
 * Atribut password secara eksplisit diabaikan demi alasan keamanan.
 * 
 * @param token Session token (UUID) milik pengguna
 * @returns Object berisi detail pengguna { data: { id, name, email, created_at } }
 * @throws UnauthorizedError Jika token tidak valid atau tidak ditemukan
 */
export async function getCurrentUser(token: string) {
  const [result] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      created_at: users.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
    .limit(1);

  if (!result) {
    throw new UnauthorizedError("Unauthorized");
  }

  return { data: result };
}

/**
 * Mengakhiri sesi pengguna dengan menghapus token yang valid dari database.
 * Fungsi ini akan memverifikasi apakah token tersebut ada di tabel `sessions`.
 * Jika ditemukan, token tersebut akan dihapus sehingga sesi tidak valid lagi.
 * 
 * @param token Session token (UUID) yang akan di-logout
 * @returns Object berisi { data: "OK" } jika berhasil
 * @throws UnauthorizedError Jika token sudah tidak ada atau tidak valid
 */
export async function logoutUser(token: string) {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (!session) {
    throw new UnauthorizedError("Unauthorized");
  }

  await db.delete(sessions).where(eq(sessions.token, token));

  return { data: "OK" };
}
