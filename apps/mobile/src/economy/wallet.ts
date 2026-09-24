import { DEFAULT_ECONOMY_CONFIG, REVEAL_LETTER_ITEM, REVEAL_WORD_ITEM } from "@word-wheel/core";
import { applyLedgerEntry, getCoins, getItemCount } from "../db/repository";
import { platformServices } from "../platform";
import type { PurchaseResult } from "../platform/types";

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

/** Plan.md section 16: "Rewarded ads for coins or hints." Called after platformServices.ads.showRewarded() resolves { earned: true }. */
export function awardAdReward() {
  applyLedgerEntry({ reason: "adReward", coinsDelta: DEFAULT_ECONOMY_CONFIG.earningRules.adReward });
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

/**
 * Plan.md section 16: "Products map to catalog items" (section 13's
 * ItemCatalogEntry.productId). Buys `itemId` with real money via RevenueCat
 * instead of coins, adding it to inventory on success.
 *
 * UNVERIFIED end to end (see KNOWN_ISSUES.md): no catalog item currently
 * sets `productId` (section 13's launch catalog is coin-only reveal-letter/
 * reveal-word), and there is no RevenueCat project to purchase against, so
 * this function has never actually completed a purchase — it's here so the
 * mapping is in place once both exist.
 */
export async function purchaseItem(itemId: string): Promise<PurchaseResult> {
  const item = DEFAULT_ECONOMY_CONFIG.itemCatalog.find((i) => i.id === itemId);
  if (!item?.productId) return { success: false, reason: "error" };
  const result = await platformServices.purchases.purchase(item.productId);
  if (result.success) {
    applyLedgerEntry({ reason: "itemPurchase", coinsDelta: 0, itemId, itemDelta: 1 });
  }
  return result;
}
