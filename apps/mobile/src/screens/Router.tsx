import { useEffect, useRef } from "react";
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
  const { screen, goTo, settings } = useAppState();
  const didCheckTutorial = useRef(false);

  useEffect(() => {
    if (didCheckTutorial.current) return;
    didCheckTutorial.current = true;
    if (!settings.tutorialDone) goTo("tutorial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
