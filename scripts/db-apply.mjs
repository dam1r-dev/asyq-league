// Накатывает миграции Prisma на Turso (libsql://…) и создаёт тестовый аккаунт.
// `prisma migrate deploy` не умеет работать с libsql://, поэтому применяем
// готовые migration.sql напрямую через @libsql/client и помним, что уже применено.
// Локально (file:./dev.db) используйте обычный `npx prisma migrate dev`.
import "dotenv/config";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url || !url.startsWith("libsql://")) {
  console.log("[db-apply] DATABASE_URL не указывает на Turso — пропускаю.");
  process.exit(0);
}

const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
await db.execute(
  "CREATE TABLE IF NOT EXISTS _asyq_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)",
);
const applied = new Set((await db.execute("SELECT name FROM _asyq_migrations")).rows.map((r) => r.name));

const dir = join(process.cwd(), "prisma", "migrations");
const folders = readdirSync(dir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

for (const name of folders) {
  if (applied.has(name)) continue;
  const sql = readFileSync(join(dir, name, "migration.sql"), "utf8");
  console.log(`[db-apply] применяю ${name}`);
  await db.executeMultiple(sql);
  await db.execute({ sql: "INSERT INTO _asyq_migrations (name, applied_at) VALUES (?, ?)", args: [name, new Date().toISOString()] });
}

// Тестовый аккаунт для проверяющих: demo / asyq2026
const demo = await db.execute({ sql: 'SELECT id FROM "User" WHERE username = ?', args: ["demo"] });
if (demo.rows.length === 0) {
  const hash = await bcrypt.hash("asyq2026", 10);
  await db.execute({
    sql: 'INSERT INTO "User" (id, username, passwordHash, displayName, university, saqaSkin, fieldSkin, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: ["demo-user", "demo", hash, "Demo", "Narxoz", "saqa-classic", "field-aula", new Date().toISOString()],
  });
  console.log("[db-apply] создан тестовый аккаунт demo / asyq2026");
}
// Стартовые тиыны для тестового аккаунта — чтобы проверяющие могли сразу
// купить и примерить костюмы (refKey уникален, второй раз не начислится).
await db.execute({
  sql: 'INSERT OR IGNORE INTO "CoinTx" (id, userId, amount, reason, refKey, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
  args: ["demo-welcome", "demo-user", 1000, "welcome", "welcome:demo-user", new Date().toISOString()],
});
console.log("[db-apply] готово");
