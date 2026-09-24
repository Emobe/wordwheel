import * as SQLite from "expo-sqlite";
import { CREATE_TABLES_SQL, SCHEMA_VERSION } from "./schema";

let db: SQLite.SQLiteDatabase | null = null;

function randomId(): string {
  // Not level-generation code (packages/core's "never Math.random" rule is
  // about seeded, reproducible pool generation) — this is a one-off local
  // identifier, same category as GameScreen's cosmetic wheel shuffle.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Opens (creating if needed) the single app database, runs migrations, and seeds the single-row tables. Safe to call more than once — returns the same connection. */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (db) return db;
  db = SQLite.openDatabaseSync("wordwheel.db");
  db.execSync(CREATE_TABLES_SQL);
  migrate(db);
  seedDefaults(db);
  return db;
}

function migrate(database: SQLite.SQLiteDatabase) {
  const row = database.getFirstSync<{ value: string }>("SELECT value FROM meta WHERE key = 'schemaVersion'");
  const currentVersion = row ? Number(row.value) : 0;
  // No migrations beyond the initial create yet — this is where future
  // ALTER TABLE steps would run, keyed off currentVersion.
  if (currentVersion !== SCHEMA_VERSION) {
    database.runSync("INSERT OR REPLACE INTO meta (key, value) VALUES ('schemaVersion', ?)", [
      String(SCHEMA_VERSION),
    ]);
  }
}

function seedDefaults(database: SQLite.SQLiteDatabase) {
  const player = database.getFirstSync<{ id: string }>("SELECT id FROM player LIMIT 1");
  if (!player) {
    database.runSync("INSERT INTO player (id, created_at) VALUES (?, ?)", [randomId(), Date.now()]);
  }
  database.runSync("INSERT OR IGNORE INTO settings (id) VALUES (0)");
  database.runSync("INSERT OR IGNORE INTO wallet (id, coins) VALUES (0, 0)");
}

/** Test/dev-only: closes and forgets the cached connection so a fresh getDatabase() call reopens it. */
export function resetDatabaseConnectionForTests() {
  db?.closeSync();
  db = null;
}
