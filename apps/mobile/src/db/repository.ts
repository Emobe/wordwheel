import type { LedgerEntry, LedgerReason } from "@word-wheel/core";
import { getDatabase } from "./database";

export function getPlayerId(): string {
  const row = getDatabase().getFirstSync<{ id: string }>("SELECT id FROM player LIMIT 1");
  if (!row) throw new Error("player row missing after seedDefaults()");
  return row.id;
}

export interface Progress {
  lang: string;
  level: number;
  packVersion: number;
  poolVersion: number;
}

export function getProgress(lang: string): Progress {
  const db = getDatabase();
  const row = db.getFirstSync<{ level: number; pack_version: number; pool_version: number }>(
    "SELECT level, pack_version, pool_version FROM progress WHERE lang = ?",
    [lang],
  );
  if (row) return { lang, level: row.level, packVersion: row.pack_version, poolVersion: row.pool_version };
  db.runSync("INSERT INTO progress (lang, level) VALUES (?, 1)", [lang]);
  return { lang, level: 1, packVersion: 1, poolVersion: 1 };
}

export function setLevel(lang: string, level: number) {
  getProgress(lang); // ensures the row exists
  getDatabase().runSync("UPDATE progress SET level = ? WHERE lang = ?", [level, lang]);
}

export function recordPlayedLevel(lang: string, levelId: string) {
  getDatabase().runSync(
    "INSERT OR REPLACE INTO played_levels (lang, level_id, played_at) VALUES (?, ?, ?)",
    [lang, levelId, Date.now()],
  );
}

export function getPlayedLevelIds(lang: string): Set<string> {
  const rows = getDatabase().getAllSync<{ level_id: string }>(
    "SELECT level_id FROM played_levels WHERE lang = ?",
    [lang],
  );
  return new Set(rows.map((r) => r.level_id));
}

export function recordSeenWords(lang: string, baseWords: readonly string[], wheelKey: string) {
  const db = getDatabase();
  const now = Date.now();
  db.withTransactionSync(() => {
    for (const word of baseWords) {
      db.runSync(
        "INSERT OR REPLACE INTO seen_words (lang, base_word, last_seen_at) VALUES (?, ?, ?)",
        [lang, word.toLowerCase(), now],
      );
    }
    db.runSync(
      "INSERT OR REPLACE INTO seen_wheels (lang, wheel_key, last_seen_at) VALUES (?, ?, ?)",
      [lang, wheelKey, now],
    );
  });
}

export function getSeenHistory(lang: string): {
  baseWordLastSeen: Map<string, number>;
  wheelLastSeen: Map<string, number>;
} {
  const db = getDatabase();
  const words = db.getAllSync<{ base_word: string; last_seen_at: number }>(
    "SELECT base_word, last_seen_at FROM seen_words WHERE lang = ?",
    [lang],
  );
  const wheels = db.getAllSync<{ wheel_key: string; last_seen_at: number }>(
    "SELECT wheel_key, last_seen_at FROM seen_wheels WHERE lang = ?",
    [lang],
  );
  return {
    baseWordLastSeen: new Map(words.map((w) => [w.base_word, w.last_seen_at])),
    wheelLastSeen: new Map(wheels.map((w) => [w.wheel_key, w.last_seen_at])),
  };
}

export interface Settings {
  uiLanguage: string;
  wordLanguage: string;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  reduceMotion: boolean;
  tutorialDone: boolean;
}

export function getSettings(): Settings {
  const row = getDatabase().getFirstSync<{
    ui_language: string;
    word_language: string;
    sound_enabled: number;
    haptics_enabled: number;
    reduce_motion: number;
    tutorial_done: number;
  }>("SELECT * FROM settings WHERE id = 0");
  if (!row) throw new Error("settings row missing after seedDefaults()");
  return {
    uiLanguage: row.ui_language,
    wordLanguage: row.word_language,
    soundEnabled: !!row.sound_enabled,
    hapticsEnabled: !!row.haptics_enabled,
    reduceMotion: !!row.reduce_motion,
    tutorialDone: !!row.tutorial_done,
  };
}

export function updateSettings(patch: Partial<Settings>) {
  const current = getSettings();
  const next = { ...current, ...patch };
  getDatabase().runSync(
    `UPDATE settings SET ui_language = ?, word_language = ?, sound_enabled = ?, haptics_enabled = ?, reduce_motion = ?, tutorial_done = ? WHERE id = 0`,
    [
      next.uiLanguage,
      next.wordLanguage,
      next.soundEnabled ? 1 : 0,
      next.hapticsEnabled ? 1 : 0,
      next.reduceMotion ? 1 : 0,
      next.tutorialDone ? 1 : 0,
    ],
  );
}

export function getCoins(): number {
  const row = getDatabase().getFirstSync<{ coins: number }>("SELECT coins FROM wallet WHERE id = 0");
  return row?.coins ?? 0;
}

export function getInventory(): Map<string, number> {
  const rows = getDatabase().getAllSync<{ item_id: string; count: number }>(
    "SELECT item_id, count FROM inventory",
  );
  return new Map(rows.map((r) => [r.item_id, r.count]));
}

export function getItemCount(itemId: string): number {
  const row = getDatabase().getFirstSync<{ count: number }>(
    "SELECT count FROM inventory WHERE item_id = ?",
    [itemId],
  );
  return row?.count ?? 0;
}

function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Plan.md section 13: "every coin and item change goes through one function
 * and is written to the change log. Nothing changes the balance directly."
 * This is that one function — the only place `wallet`/`inventory` are ever
 * written outside seedDefaults().
 */
export function applyLedgerEntry(entry: {
  reason: LedgerReason;
  coinsDelta: number;
  itemId?: string;
  itemDelta?: number;
}): LedgerEntry {
  const db = getDatabase();
  const row: LedgerEntry = {
    id: randomId(),
    timestamp: Date.now(),
    reason: entry.reason,
    coinsDelta: entry.coinsDelta,
    itemId: entry.itemId,
    itemDelta: entry.itemDelta,
    synced: false,
  };
  db.withTransactionSync(() => {
    if (entry.coinsDelta !== 0) {
      db.runSync("UPDATE wallet SET coins = coins + ? WHERE id = 0", [entry.coinsDelta]);
    }
    if (entry.itemId && entry.itemDelta) {
      db.runSync(
        `INSERT INTO inventory (item_id, count) VALUES (?, ?)
         ON CONFLICT(item_id) DO UPDATE SET count = count + excluded.count`,
        [entry.itemId, entry.itemDelta],
      );
    }
    db.runSync(
      "INSERT INTO ledger (id, timestamp, reason, coins_delta, item_id, item_delta, synced) VALUES (?, ?, ?, ?, ?, ?, 0)",
      [row.id, row.timestamp, row.reason, row.coinsDelta, row.itemId ?? null, row.itemDelta ?? null],
    );
  });
  return row;
}
