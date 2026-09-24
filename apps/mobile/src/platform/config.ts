/**
 * Plan.md section 16: ads and purchases are "off at launch", switched by
 * config. Flip these to try the live AdMob/RevenueCat/UMP paths in dev —
 * apps/mobile/src/platform/index.ts picks the live or no-op implementation
 * per service based on this file.
 */
export interface PlatformConfig {
  adsEnabled: boolean;
  purchasesEnabled: boolean;
  /** Interstitial cap (section 16: "capped interstitials"). */
  maxInterstitialsPerSession: number;
  minSecondsBetweenInterstitials: number;
}

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  adsEnabled: false,
  purchasesEnabled: false,
  maxInterstitialsPerSession: 3,
  minSecondsBetweenInterstitials: 60,
};
