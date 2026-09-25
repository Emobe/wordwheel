/**
 * Plan.md section 13: everything is data so items and prices can change
 * without code changes. Pure config + types here; the actual wallet/ledger
 * storage is SQLite (section 14), which is I/O and lives in apps/mobile —
 * this package stays I/O-free per its own layout rule.
 */
export interface ItemCatalogEntry {
  id: string;
  type: "consumable" | "cosmetic" | "unlock";
  coinPrice: number;
  /** Real-money product ID, mapped to a store product later (section 16). Unset while purchases are off. */
  productId?: string;
}

export interface EarningRules {
  levelComplete: number;
  bonusWordFound: number;
  coinWordFound: number;
  dailyReward: number;
  /** Plan.md section 16: "Rewarded ads for coins or hints." Coins granted for completing one rewarded ad. */
  adReward: number;
}

export interface EconomyConfig {
  earningRules: EarningRules;
  itemCatalog: ItemCatalogEntry[];
}

/** Sequentially reveals one letter of an auto-picked unfound word per use — see GameScreen.handleRevealLetter. */
export const REVEAL_LETTER_ITEM = "reveal-letter";
/** Reveals whichever unfound grid cell the player taps — see GameScreen.handleCellPick. */
export const PICK_LETTER_ITEM = "pick-letter";

/** "Launch prices: every coin price set to 0, so everything is free." Bonus-word/coin-word/daily-reward earnings are also 0 for now per section 13 ("slots... set to 0 for now"); only level completion pays out today. `adReward` is section 16's rewarded-ad payout — also dormant at launch since ads are off by PlatformConfig.adsEnabled, not by this being 0. */
export const DEFAULT_ECONOMY_CONFIG: EconomyConfig = {
  earningRules: {
    levelComplete: 10,
    bonusWordFound: 0,
    coinWordFound: 0,
    dailyReward: 0,
    adReward: 20,
  },
  itemCatalog: [
    { id: REVEAL_LETTER_ITEM, type: "consumable", coinPrice: 0 },
    { id: PICK_LETTER_ITEM, type: "consumable", coinPrice: 0 },
  ],
};

export type LedgerReason =
  | "levelComplete"
  | "bonusWordFound"
  | "coinWordFound"
  | "dailyReward"
  | "adReward"
  | "itemPurchase"
  | "itemUse";

/** One row of the change log (section 14): every coin/item change goes through one function (apps/mobile's ledger.ts) and is written here. */
export interface LedgerEntry {
  id: string;
  timestamp: number;
  reason: LedgerReason;
  coinsDelta: number;
  itemId?: string;
  itemDelta?: number;
  synced: boolean;
}
