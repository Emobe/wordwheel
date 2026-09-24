import {
  AdEventType,
  InterstitialAd,
  MobileAds,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from "react-native-google-mobile-ads";
import { DEFAULT_PLATFORM_CONFIG } from "../config";
import type { AdsService, RewardResult } from "../types";

/**
 * Plan.md section 16: "Rewarded ads for coins or hints, capped interstitials.
 * Test ad unit IDs in development." No real AdMob account/app exists yet
 * (see KNOWN_ISSUES.md), so these stay on Google's public test unit IDs
 * unconditionally — swap in real IDs (ideally from app config, not hardcoded)
 * once an AdMob app is created.
 */
const REWARDED_UNIT_ID = TestIds.REWARDED;
const INTERSTITIAL_UNIT_ID = TestIds.INTERSTITIAL;

let rewarded: RewardedAd;
let rewardedLoaded = false;
let rewardEarned = false;

function attachRewardedListeners(ad: RewardedAd) {
  ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
    rewardedLoaded = true;
  });
  ad.addAdEventListener(AdEventType.ERROR, () => {
    rewardedLoaded = false;
  });
  ad.addAdEventListener(AdEventType.CLOSED, () => {
    // Ads are single-use: load the next one immediately so it's ready for
    // the following hint/coin request.
    rewardedLoaded = false;
    rewarded = RewardedAd.createForAdRequest(REWARDED_UNIT_ID);
    attachRewardedListeners(rewarded);
    rewarded.load();
  });
}

let interstitial: InterstitialAd;
let interstitialLoaded = false;
let interstitialsShownThisSession = 0;
let lastInterstitialAt = 0;

function attachInterstitialListeners(ad: InterstitialAd) {
  ad.addAdEventListener(AdEventType.LOADED, () => {
    interstitialLoaded = true;
  });
  ad.addAdEventListener(AdEventType.ERROR, () => {
    interstitialLoaded = false;
  });
  ad.addAdEventListener(AdEventType.CLOSED, () => {
    interstitialLoaded = false;
    interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID);
    attachInterstitialListeners(interstitial);
    interstitial.load();
  });
}

let initialized = false;

export const liveAds: AdsService = {
  async initialize() {
    if (initialized) return;
    initialized = true;
    await MobileAds().initialize();

    rewarded = RewardedAd.createForAdRequest(REWARDED_UNIT_ID);
    attachRewardedListeners(rewarded);
    rewarded.load();

    interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID);
    attachInterstitialListeners(interstitial);
    interstitial.load();
  },
  isRewardedReady() {
    return rewardedLoaded;
  },
  async showRewarded(): Promise<RewardResult> {
    if (!rewardedLoaded) return { earned: false };
    rewardEarned = false;
    return new Promise((resolve) => {
      const unsubscribe = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        rewardEarned = true;
      });
      const unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        unsubscribe();
        unsubscribeClosed();
        resolve({ earned: rewardEarned });
      });
      rewarded.show();
    });
  },
  async showInterstitialIfAllowed() {
    if (!interstitialLoaded) return;
    const cfg = DEFAULT_PLATFORM_CONFIG;
    if (interstitialsShownThisSession >= cfg.maxInterstitialsPerSession) return;
    const secondsSinceLast = (Date.now() - lastInterstitialAt) / 1000;
    if (lastInterstitialAt !== 0 && secondsSinceLast < cfg.minSecondsBetweenInterstitials) return;
    interstitialsShownThisSession += 1;
    lastInterstitialAt = Date.now();
    await interstitial.show();
  },
};
