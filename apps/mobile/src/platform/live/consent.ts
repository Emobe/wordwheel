import { AdsConsent, AdsConsentDebugGeography, AdsConsentStatus } from "react-native-google-mobile-ads";
import type { ConsentService, ConsentStatus } from "../types";

/**
 * Plan.md section 16: "a consent flow for EEA and UK users before the first
 * ad request." Uses AdMob's own UMP (User Messaging Platform) integration,
 * bundled in react-native-google-mobile-ads as `AdsConsent` — no separate
 * consent library needed.
 *
 * In development, force the debug geography to EEA so the form actually
 * shows on a device that isn't physically in the EEA/UK (real production
 * builds never set this). __DEV__ is React Native's standard dev-vs-release
 * flag, already used elsewhere in this codebase's sound/haptics modules.
 */
function debugOptions() {
  if (!__DEV__) return {};
  return {
    debugGeography: AdsConsentDebugGeography.EEA,
    // Emulator/test-device IDs AdMob logs to the console on first run in dev;
    // harmless to list here since debugGeography already forces EEA regardless.
    testDeviceIdentifiers: ["EMULATOR"],
  };
}

function mapStatus(status: AdsConsentStatus): ConsentStatus {
  switch (status) {
    case AdsConsentStatus.NOT_REQUIRED:
      return "not-required";
    case AdsConsentStatus.REQUIRED:
      return "required";
    case AdsConsentStatus.OBTAINED:
      return "obtained";
    default:
      return "unknown";
  }
}

let canRequestAdsNow = false;

export const liveConsent: ConsentService = {
  async requestConsent(): Promise<ConsentStatus> {
    const info = await AdsConsent.gatherConsent(debugOptions());
    canRequestAdsNow = info.canRequestAds;
    return mapStatus(info.status);
  },
  canRequestAds(): boolean {
    return canRequestAdsNow;
  },
};
