/**
 * Every native call (ads, purchases, consent, storage, time) goes through
 * this interface so packages/core and its tests never touch native code
 * (CLAUDE.md mobile rule). apps/mobile provides the real implementation;
 * tests and tools use a fake.
 *
 * Phase 1 only needs `clock`. The other categories are stubbed as
 * explicit "not implemented yet" so the hint/ad/purchase call sites in the
 * UI have a stable shape to code against now, and Phase 2 swaps in the
 * real ad/purchase SDKs behind the same interface without a UI rewrite.
 */

export interface PlatformClock {
  /** Milliseconds since epoch. */
  now(): number;
}

export interface PlatformStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export type NotAvailable = { available: false; reason: string };

export interface PlatformAds {
  /** Phase 2 wires this to AdMob. Phase 1 hints are free and unlimited. */
  showRewardedAd(): Promise<NotAvailable>;
}

export interface PlatformPurchases {
  /** Phase 2 wires this to RevenueCat. */
  isAdRemovalPurchased(): Promise<boolean>;
  purchaseAdRemoval(): Promise<NotAvailable>;
}

export interface PlatformConsent {
  /** Phase 2 wires this to the UMP consent flow for EEA/UK users. */
  hasPersonalisedAdsConsent(): Promise<boolean>;
}

export interface PlatformServices {
  clock: PlatformClock;
  storage: PlatformStorage;
  ads: PlatformAds;
  purchases: PlatformPurchases;
  consent: PlatformConsent;
}

const notAvailable = (reason: string): NotAvailable => ({ available: false, reason });

/** In-memory fake for tests and tools. Never persists, never touches native code. */
export function createFakePlatformServices(): PlatformServices {
  const store = new Map<string, string>();
  return {
    clock: { now: () => Date.now() },
    storage: {
      getItem: async (key) => store.get(key) ?? null,
      setItem: async (key, value) => {
        store.set(key, value);
      },
      removeItem: async (key) => {
        store.delete(key);
      },
    },
    ads: {
      showRewardedAd: async () => notAvailable('ads are not wired up until Phase 2'),
    },
    purchases: {
      isAdRemovalPurchased: async () => false,
      purchaseAdRemoval: async () => notAvailable('purchases are not wired up until Phase 2'),
    },
    consent: {
      hasPersonalisedAdsConsent: async () => false,
    },
  };
}
