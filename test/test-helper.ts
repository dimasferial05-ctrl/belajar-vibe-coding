import { db } from "../src/db";
import { sessions, users } from "../src/db/schema";

/**
 * Menghapus semua data dari tabel sessions dan users untuk memastikan
 * lingkungan pengujian terisolasi dan konsisten.
 */
export async function clearDatabase() {
  await db.delete(sessions);
  await db.delete(users);
}
