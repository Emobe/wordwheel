import { DEFAULT_ECONOMY_CONFIG, REVEAL_LETTER_ITEM, REVEAL_WORD_ITEM } from "@word-wheel/core";
import { applyLedgerEntry, getCoins, getItemCount } from "../db/repository";

export { REVEAL_LETTER_ITEM, REVEAL_WORD_ITEM };

function priceOf(itemId: string): number {
  const item = DEFAULT_ECONOMY_CONFIG.itemCatalog.find((i) => i.id === itemId);
  if (!item) throw new Error(`Unknown item ${itemId}`);
  return item.coinPrice;
}

/** Plan.md section 13: "10 coins per level completed to start." */
export function awardLevelComplete() {
  applyLedgerEntry({ reason: "levelComplete", coinsDelta: DEFAULT_ECONOMY_CONFIG.earningRules.levelComplete });
}

export function canAfford(itemId: string): boolean {
  return getCoins() >= priceOf(itemId);
}

/** Buys one of `itemId` from the shop (section 13's item catalog), adding it to inventory. Price is 0 for every launch item, so this always succeeds today, but still goes through the ledger like a real purchase would. */
export function buyItem(itemId: string) {
  const price = priceOf(itemId);
  if (getCoins() < price) throw new Error(`Not enough coins for ${itemId}`);
  applyLedgerEntry({ reason: "itemPurchase", coinsDelta: -price, itemId, itemDelta: 1 });
}

/** Spends one owned `itemId` (a hint) — throws if none are owned, since hints are used from inventory, not bought-and-immediately-consumed. */
export function useItem(itemId: string) {
  if (getItemCount(itemId) <= 0) throw new Error(`No ${itemId} in inventory`);
  applyLedgerEntry({ reason: "itemUse", coinsDelta: 0, itemId, itemDelta: -1 });
}

/**
 * In-game hint button (Plan.md section 12: "hint button showing its cost"):
 * pays the item's coin price and consumes it in one step, rather than
 * requiring a separate shop purchase first — owned inventory (bought from
 * the shop ahead of time) is spent first if any exists, so a shop purchase
 * still means something. Returns false without charging if unaffordable.
 */
export function spendOnHint(itemId: string): boolean {
  if (getItemCount(itemId) > 0) {
    applyLedgerEntry({ reason: "itemUse", coinsDelta: 0, itemId, itemDelta: -1 });
    return true;
  }
  const price = priceOf(itemId);
  if (getCoins() < price) return false;
  applyLedgerEntry({ reason: "itemUse", coinsDelta: -price, itemId, itemDelta: 0 });
  return true;
}

export function hintPrice(itemId: string): number {
  return priceOf(itemId);
}

export function coinBalance(): number {
  return getCoins();
}
