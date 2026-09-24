import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppStateProvider } from "./src/state/AppState";
import { Router } from "./src/screens/Router";
import { initializeAdsAndConsent, platformServices } from "./src/platform";

export default function App() {
  useEffect(() => {
    // Plan.md section 16: gather consent, then initialize ads — before any
    // ad request. Fire-and-forget: screens read ad readiness via
    // platformServices.ads.isRewardedReady() rather than awaiting this.
    initializeAdsAndConsent();
    // UNVERIFIED (see KNOWN_ISSUES.md): no RevenueCat project exists yet, so
    // this configures nothing when purchasesEnabled is off, and warns rather
    // than silently succeeding when it's on without an API key.
    platformServices.purchases.initialize();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppStateProvider>
          <Router />
          <StatusBar style="auto" />
        </AppStateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
