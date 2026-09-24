import type { AdsService, ConsentService, PurchasesService, RewardResult } from "./types";

/**
 * Do-nothing versions used when a service is switched off in config (Plan.md
 * section 16). Ads never have anything to show, consent is trivially
 * satisfied since no ad request is ever made, purchases have nothing to
 * sell.
 */
export const noopAds: AdsService = {
  async initialize() {},
  isRewardedReady: () => false,
  async showRewarded(): Promise<RewardResult> {
    return { earned: false };
  },
  async showInterstitialIfAllowed() {},
};

export const noopConsent: ConsentService = {
  async requestConsent() {
    return "not-required";
  },
  canRequestAds: () => false,
};

export const noopPurchases: PurchasesService = {
  async initialize() {},
  async getAvailableProducts() {
    return [];
  },
  async purchase() {
    return { success: false, reason: "error" };
  },
  async restore() {},
};
