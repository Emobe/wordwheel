/**
 * Plan.md section 14: SQLite save. One database, one player. Tables:
 *  - player: single row, anonymous ID + creation time.
 *  - progress: per-language current level number (one row per word language).
 *  - played_levels: which level IDs a language's player has completed, so
 *    level-selection.ts can exclude them.
 *  - seen_words / seen_wheels: last-seen timestamps for level-selection.ts's
 *    variety ranking.
 *  - settings: single row — UI language, current word language, sound,
 *    haptics, reduce motion.
 *  - wallet: single row — coin balance (shared across languages, section 13).
 *  - inventory: item_id -> count owned.
 *  - ledger: the change log — every coin/item change, ever (section 14).
 *
 * `schemaVersion` records which shape a given install last migrated to
 * (Plan.md: "the save records which pack and pool versions the player has.
 * Migrations run when the app updates") — pack/pool version columns live on
 * `progress` per language since packs are per-language.
 */
export const SCHEMA_VERSION = 1;

export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS player (
  id TEXT PRIMARY KEY NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS progress (
  lang TEXT PRIMARY KEY NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  pack_version INTEGER NOT NULL DEFAULT 1,
  pool_version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS played_levels (
  lang TEXT NOT NULL,
  level_id TEXT NOT NULL,
  played_at INTEGER NOT NULL,
  PRIMARY KEY (lang, level_id)
);

CREATE TABLE IF NOT EXISTS seen_words (
  lang TEXT NOT NULL,
  base_word TEXT NOT NULL,
  last_seen_at INTEGER NOT NULL,
  PRIMARY KEY (lang, base_word)
);

CREATE TABLE IF NOT EXISTS seen_wheels (
  lang TEXT NOT NULL,
  wheel_key TEXT NOT NULL,
  last_seen_at INTEGER NOT NULL,
  PRIMARY KEY (lang, wheel_key)
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 0),
  ui_language TEXT NOT NULL DEFAULT 'en',
  word_language TEXT NOT NULL DEFAULT 'en',
  sound_enabled INTEGER NOT NULL DEFAULT 1,
  haptics_enabled INTEGER NOT NULL DEFAULT 1,
  reduce_motion INTEGER NOT NULL DEFAULT 0,
  tutorial_done INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS wallet (
  id INTEGER PRIMARY KEY CHECK (id = 0),
  coins INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS inventory (
  item_id TEXT PRIMARY KEY NOT NULL,
  count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ledger (
  id TEXT PRIMARY KEY NOT NULL,
  timestamp INTEGER NOT NULL,
  reason TEXT NOT NULL,
  coins_delta INTEGER NOT NULL,
  item_id TEXT,
  item_delta INTEGER,
  synced INTEGER NOT NULL DEFAULT 0
);
`;
