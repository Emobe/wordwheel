import { useEffect, useRef } from "react";
import { BackHandler } from "react-native";
import { useAppState } from "../state/AppState";
import { HomeScreen } from "./HomeScreen";
import { GameScreen } from "./GameScreen";
import { LanguagePickerScreen } from "./LanguagePickerScreen";
import { ShopScreen } from "./ShopScreen";
import { SettingsScreen } from "./SettingsScreen";
import { BonusWordsScreen } from "./BonusWordsScreen";
import { LevelCompleteScreen } from "./LevelCompleteScreen";
import { TutorialScreen } from "./TutorialScreen";

/** Plan.md section 12: "first-run tutorial: a few guided levels..." shown once, before Home, on the very first launch. */
export function Router() {
  const { screen, goTo, back, settings } = useAppState();
  const didCheckTutorial = useRef(false);

  useEffect(() => {
    if (didCheckTutorial.current) return;
    didCheckTutorial.current = true;
    if (!settings.tutorialDone) goTo("tutorial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Android hardware back button: navigate our own screen stack instead of
  // the OS default of closing the app. On "home" there's nowhere for `back`
  // to go (it would just no-op there), so let the event fall through to the
  // default (app close/backgrounds), matching normal Android app behaviour.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (screen === "home") return false;
      back();
      return true;
    });
    return () => sub.remove();
  }, [screen, back]);

  switch (screen) {
    case "home":
      return <HomeScreen />;
    case "game":
      return <GameScreen />;
    case "languagePicker":
      return <LanguagePickerScreen />;
    case "shop":
      return <ShopScreen />;
    case "settings":
      return <SettingsScreen />;
    case "bonusWords":
      return <BonusWordsScreen />;
    case "levelComplete":
      return <LevelCompleteScreen />;
    case "tutorial":
      return <TutorialScreen />;
    default:
      return <HomeScreen />;
  }
}
