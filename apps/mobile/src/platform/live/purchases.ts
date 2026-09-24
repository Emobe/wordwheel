import Purchases, { LOG_LEVEL } from "react-native-purchases";
import type { PurchaseProduct, PurchaseResult, PurchasesService } from "../types";

/**
 * Plan.md section 16: "Purchases (off at launch): RevenueCat, which also
 * validates purchases before our own server exists. Products map to catalog
 * items" (Plan.md section 13's ItemCatalogEntry.productId).
 *
 * UNVERIFIED end to end: there is no Play Console listing or RevenueCat
 * project yet, so there is no real API key and no real product to buy — see
 * KNOWN_ISSUES.md. `REVENUECAT_ANDROID_API_KEY` is empty until that account
 * exists; `initialize()` below refuses to configure the SDK against an empty
 * key rather than pretending to succeed.
 */
const REVENUECAT_ANDROID_API_KEY = "";

let configured = false;

export const livePurchases: PurchasesService = {
  async initialize() {
    if (!REVENUECAT_ANDROID_API_KEY) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn(
          "[purchases] REVENUECAT_ANDROID_API_KEY is empty — no RevenueCat project exists yet " +
            "(see KNOWN_ISSUES.md). Purchases stay unconfigured; offerings/purchase calls will fail.",
        );
      }
      return;
    }
    if (configured) return;
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey: REVENUECAT_ANDROID_API_KEY });
    configured = true;
  },

  async getAvailableProducts(): Promise<PurchaseProduct[]> {
    if (!configured) return [];
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return [];
    return current.availablePackages.map((pkg) => ({
      productId: pkg.product.identifier,
      priceString: pkg.product.priceString,
    }));
  },

  async purchase(productId: string): Promise<PurchaseResult> {
    if (!configured) return { success: false, reason: "error" };
    try {
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find((p) => p.product.identifier === productId);
      if (!pkg) return { success: false, reason: "error" };
      await Purchases.purchasePackage(pkg);
      return { success: true };
    } catch (e) {
      const cancelled = typeof e === "object" && e !== null && "userCancelled" in e && (e as { userCancelled: boolean }).userCancelled;
      return { success: false, reason: cancelled ? "cancelled" : "error" };
    }
  },

  async restore() {
    if (!configured) return;
    await Purchases.restorePurchases();
  },
};
