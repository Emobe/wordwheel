/**
 * Plan.md section 16: "All native and third-party calls (ads, purchases,
 * consent, analytics, storage, time) go through a PlatformServices
 * interface, so core and tests never touch native code and each service can
 * be swapped or switched off." This file is the ads/purchases/consent slice
 * of that interface (storage/time already exist as db/repository.ts and
 * sound.ts/haptics.ts; analytics is section 18, not built yet).
 */

export interface RewardResult {
  /** False if the user closed the ad before earning the reward, or no ad was available. */
  earned: boolean;
}

export interface AdsService {
  /**
   * Initializes the ad SDK and starts loading both ad types. Must only be
   * called after ConsentService.requestConsent() has resolved (Plan.md
   * section 16: consent "before the first ad request").
   */
  initialize(): Promise<void>;
  isRewardedReady(): boolean;
  /** Shows the loaded rewarded ad. Resolves once the ad is dismissed. */
  showRewarded(): Promise<RewardResult>;
  /** Shows an interstitial if one is loaded and the session cap/cooldown (PlatformConfig) allow it. No-ops otherwise. */
  showInterstitialIfAllowed(): Promise<void>;
}

export type ConsentStatus = "unknown" | "not-required" | "required" | "obtained";

export interface ConsentService {
  /** Plan.md section 16: must resolve before the first ad request. Gathers consent info and shows the UMP form if required (EEA/UK). */
  requestConsent(): Promise<ConsentStatus>;
  canRequestAds(): boolean;
}

export interface PurchaseProduct {
  productId: string;
  priceString: string;
}

export type PurchaseResult = { success: true } | { success: false; reason: "cancelled" | "error" };

export interface PurchasesService {
  initialize(): Promise<void>;
  /** Products configured in RevenueCat that map to Plan.md section 13 catalog items via ItemCatalogEntry.productId. */
  getAvailableProducts(): Promise<PurchaseProduct[]>;
  purchase(productId: string): Promise<PurchaseResult>;
  restore(): Promise<void>;
}

export interface PlatformServices {
  ads: AdsService;
  consent: ConsentService;
  purchases: PurchasesService;
}
