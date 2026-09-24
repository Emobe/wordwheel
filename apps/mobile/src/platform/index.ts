import { DEFAULT_PLATFORM_CONFIG } from "./config";
import { noopAds, noopConsent, noopPurchases } from "./noop";
import type { PlatformServices } from "./types";

export type { PlatformServices, AdsService, ConsentService, PurchasesService, RewardResult, ConsentStatus, PurchaseProduct, PurchaseResult } from "./types";
export { DEFAULT_PLATFORM_CONFIG } from "./config";
export type { PlatformConfig } from "./config";

/**
 * Plan.md section 16: ads and purchases each go through PlatformServices and
 * are switched off by config — real (`live/*`) implementations are only
 * imported when their flag is on, so a build with both off never touches
 * the native ad/purchase SDKs at all.
 */
function buildPlatformServices(): PlatformServices {
  const cfg = DEFAULT_PLATFORM_CONFIG;
  const ads = cfg.adsEnabled ? (require("./live/ads") as typeof import("./live/ads")).liveAds : noopAds;
  const consent = cfg.adsEnabled ? (require("./live/consent") as typeof import("./live/consent")).liveConsent : noopConsent;
  // Purchases (RevenueCat) live implementation isn't wired up yet — see
  // KNOWN_ISSUES.md. Always noop until that lands.
  const purchases = noopPurchases;
  return { ads, consent, purchases };
}

export const platformServices: PlatformServices = buildPlatformServices();

/**
 * Plan.md section 16: consent must be gathered before the first ad request.
 * Call once from App.tsx on startup. No-ops harmlessly when ads are off
 * (noopConsent resolves "not-required" and noopAds.initialize() is a no-op).
 */
export async function initializeAdsAndConsent(): Promise<void> {
  const status = await platformServices.consent.requestConsent();
  if (status === "obtained" || status === "not-required") {
    await platformServices.ads.initialize();
  }
}
