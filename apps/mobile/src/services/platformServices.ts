import type { NotAvailable, PlatformServices } from '@wordscapes/core';

const notAvailable = (reason: string): NotAvailable => ({ available: false, reason });

/**
 * Real PlatformServices for the app. `clock` is the only real
 * implementation in Phase 1 — ads/purchases/consent are wired to their
 * native SDKs in Phase 2 (CLAUDE.md: ask first before adding those
 * dependencies). `storage` is in-memory only until Phase 3 adds saves,
 * which will need its own native dependency (e.g. AsyncStorage) and its
 * own sign-off.
 */
export function createPlatformServices(): PlatformServices {
  const memoryStore = new Map<string, string>();
  return {
    clock: { now: () => Date.now() },
    storage: {
      getItem: async (key) => memoryStore.get(key) ?? null,
      setItem: async (key, value) => {
        memoryStore.set(key, value);
      },
      removeItem: async (key) => {
        memoryStore.delete(key);
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
