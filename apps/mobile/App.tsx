import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppStateProvider } from "./src/state/AppState";
import { Router } from "./src/screens/Router";
import { initializeAdsAndConsent } from "./src/platform";

export default function App() {
  useEffect(() => {
    // Plan.md section 16: gather consent, then initialize ads — before any
    // ad request. Fire-and-forget: screens read ad readiness via
    // platformServices.ads.isRewardedReady() rather than awaiting this.
    initializeAdsAndConsent();
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
