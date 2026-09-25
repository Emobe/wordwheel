import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { getPlayerId, getSettings, updateSettings, type Settings } from "../db/repository";
import { coinBalance } from "../economy/wallet";
import { I18nContext, DEFAULT_UI_LANGUAGE } from "../i18n/i18n";
import type { CurrentLevel } from "../game/progression";

export type ScreenName =
  | "home"
  | "game"
  | "languagePicker"
  | "shop"
  | "settings"
  | "bonusWords"
  | "levelComplete"
  | "tutorial";

interface AppStateValue {
  screen: ScreenName;
  goTo: (screen: ScreenName) => void;
  back: () => void;
  settings: Settings;
  refreshSettings: () => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  coins: number;
  refreshCoins: () => void;
  playerId: string;
  /** Clears currentLevel (and the rest of the in-progress run state) so GameScreen picks a fresh level next time it needs one. Call this only when a level actually finishes — never on ordinary navigation, or it reintroduces the re-roll-on-remount bug this state shape exists to avoid. */
  startNewLevelRun: () => void;

  /** Shared across GameScreen/BonusWordsScreen/LevelCompleteScreen so they all see the same live run. */
  currentLevel: CurrentLevel | null;
  setCurrentLevel: (level: CurrentLevel | null) => void;
  foundWords: ReadonlySet<string>;
  setFoundWords: (words: ReadonlySet<string>) => void;
  foundBonusWords: ReadonlySet<string>;
  setFoundBonusWords: (words: ReadonlySet<string>) => void;
  lastCoinsEarned: number;
  setLastCoinsEarned: (n: number) => void;
  /** Wheel letter order and hinted-but-unfound cells — also local-looking state that must
   * survive a GameScreen remount (e.g. Settings and back) instead of resetting, same reason
   * currentLevel/foundWords live here rather than as GameScreen's own useState. */
  wheelArrangement: string[];
  setWheelArrangement: (letters: string[]) => void;
  hintedCells: ReadonlySet<string>;
  setHintedCells: (cells: ReadonlySet<string>) => void;
  /** Which unfound grid word the sequential reveal-letter hint is currently working through. */
  hintTargetWord: string | null;
  setHintTargetWord: (word: string | null) => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<ScreenName>("home");
  const [history, setHistory] = useState<ScreenName[]>([]);
  const [settings, setSettingsState] = useState<Settings>(() => getSettings());
  const [coins, setCoins] = useState<number>(() => coinBalance());
  const [currentLevel, setCurrentLevel] = useState<CurrentLevel | null>(null);
  const [foundWords, setFoundWords] = useState<ReadonlySet<string>>(new Set());
  const [foundBonusWords, setFoundBonusWords] = useState<ReadonlySet<string>>(new Set());
  const [lastCoinsEarned, setLastCoinsEarned] = useState(0);
  const [wheelArrangement, setWheelArrangement] = useState<string[]>([]);
  const [hintedCells, setHintedCells] = useState<ReadonlySet<string>>(new Set());
  const [hintTargetWord, setHintTargetWord] = useState<string | null>(null);
  const playerId = useMemo(() => getPlayerId(), []);

  const goTo = useCallback(
    (next: ScreenName) => {
      setHistory((h) => [...h, screen]);
      setScreen(next);
    },
    [screen],
  );

  const back = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) {
        setScreen("home");
        return h;
      }
      const copy = [...h];
      const prev = copy.pop()!;
      setScreen(prev);
      return copy;
    });
  }, []);

  const refreshSettings = useCallback(() => setSettingsState(getSettings()), []);
  const setSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    updateSettings({ [key]: value } as Partial<Settings>);
    setSettingsState(getSettings());
  }, []);
  const refreshCoins = useCallback(() => setCoins(coinBalance()), []);
  const startNewLevelRun = useCallback(() => {
    setCurrentLevel(null);
    setFoundWords(new Set());
    setFoundBonusWords(new Set());
    setWheelArrangement([]);
    setHintedCells(new Set());
    setHintTargetWord(null);
  }, []);

  const value: AppStateValue = {
    screen,
    goTo,
    back,
    settings,
    refreshSettings,
    setSetting,
    coins,
    refreshCoins,
    playerId,
    startNewLevelRun,
    currentLevel,
    setCurrentLevel,
    foundWords,
    setFoundWords,
    foundBonusWords,
    setFoundBonusWords,
    lastCoinsEarned,
    setLastCoinsEarned,
    wheelArrangement,
    setWheelArrangement,
    hintedCells,
    setHintedCells,
    hintTargetWord,
    setHintTargetWord,
  };

  return (
    <AppStateContext.Provider value={value}>
      <I18nContext.Provider value={settings.uiLanguage === "en" ? "en" : DEFAULT_UI_LANGUAGE}>
        {children}
      </I18nContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState() must be used within AppStateProvider");
  return ctx;
}
