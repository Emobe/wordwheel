import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../useTheme";
import { useAppState } from "../state/AppState";
import { useTranslation } from "../i18n/i18n";
import { GridBoard } from "../components/Grid";
import { WordPreview } from "../components/WordPreview";
import { Wheel } from "../components/Wheel";
import { ShuffleButton } from "../components/ShuffleButton";
import { GameHeader } from "../components/GameHeader";
import { HintButtons } from "../components/HintButtons";
import { gridCells } from "../gridGeometry";
import { pickCurrentLevel, completeLevel } from "../game/progression";
import { REVEAL_LETTER_ITEM, REVEAL_WORD_ITEM, awardLevelComplete, hintPrice, spendOnHint } from "../economy/wallet";
import { playSound } from "../sound";
import { hapticWordFound, hapticWrong } from "../haptics";

/** Cosmetic wheel-circle shuffle only — not level generation, so this is
 * fine to be non-seeded unlike anything in packages/core. */
function shuffled(letters: string[]): string[] {
  const arr = [...letters];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export function GameScreen() {
  const theme = useTheme();
  const t = useTranslation();
  const {
    goTo,
    back,
    settings,
    coins,
    refreshCoins,
    currentLevel,
    setCurrentLevel,
    foundWords,
    setFoundWords,
    foundBonusWords,
    setFoundBonusWords,
    setLastCoinsEarned,
    wheelArrangement: arrangement,
    setWheelArrangement: setArrangement,
    hintedCells,
    setHintedCells,
  } = useAppState();

  const [previewWord, setPreviewWord] = useState("");
  const [shakeToken, setShakeToken] = useState(0);
  const [gridArea, setGridArea] = useState({ width: 0, height: 0 });

  // Picks a level only when there isn't one already (first entry, or right
  // after startNewLevelRun() cleared it in AppState on level completion) —
  // NOT on every mount. Navigating away (e.g. to Settings) and back remounts
  // this component; a first attempt at this fix used a GameScreen-local
  // useRef to track "already picked", which doesn't work because a ref is
  // just as fresh on remount as useState is — it only survives re-renders of
  // the SAME mounted instance, not an unmount+remount. The actual fix has to
  // live in state that outlives the component, which is exactly why
  // currentLevel (and now the "should I pick a new one" decision derived
  // from it) lives in AppState rather than here.
  useEffect(() => {
    if (currentLevel) return;
    const next = pickCurrentLevel(settings.wordLanguage);
    setCurrentLevel(next);
    setArrangement(next ? [...next.level.wheel] : []);
    setPreviewWord("");
    setFoundWords(new Set());
    setFoundBonusWords(new Set());
    setHintedCells(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevel, settings.wordLanguage]);

  const level = currentLevel?.level ?? null;
  const bonusWords = currentLevel?.bonusWords ?? [];

  const gridWordSet = useMemo(() => new Set(level?.grid.words.map((w) => w.w) ?? []), [level]);
  const bonusWordSet = useMemo(() => new Set(bonusWords), [bonusWords]);
  const cellsByWordIndex = useMemo(() => {
    if (!level) return new Map<string, number[]>();
    const map = new Map<string, number[]>();
    for (const cell of gridCells(level.grid).values()) {
      map.set(`${cell.x},${cell.y}`, cell.wordIndices);
    }
    return map;
  }, [level]);

  function handleSubmit(word: string) {
    if (!level) return;
    if (word.length < 3) {
      setShakeToken((n) => n + 1);
      hapticWrong();
      return;
    }
    if (gridWordSet.has(word) && !foundWords.has(word)) {
      const next = new Set(foundWords);
      next.add(word);
      setFoundWords(next);
      playSound("wordFound");
      hapticWordFound();
      if (next.size === level.grid.words.length) {
        finishLevel();
      }
      return;
    }
    if (bonusWordSet.has(word) && !foundBonusWords.has(word)) {
      const next = new Set(foundBonusWords);
      next.add(word);
      setFoundBonusWords(next);
      playSound("wordFound");
      hapticWordFound();
      return;
    }
    setShakeToken((n) => n + 1);
    hapticWrong();
  }

  function finishLevel() {
    if (!level || !currentLevel) return;
    awardLevelComplete();
    refreshCoins();
    setLastCoinsEarned(10); // DEFAULT_ECONOMY_CONFIG.earningRules.levelComplete, see wallet.ts
    completeLevel(settings.wordLanguage, currentLevel);
    goTo("levelComplete");
  }

  function handleRevealLetter() {
    if (!level) return;
    if (!spendOnHint(REVEAL_LETTER_ITEM)) return;
    refreshCoins();
    const candidates: string[] = [];
    for (const [key, wordIndices] of cellsByWordIndex) {
      const alreadyFilled = wordIndices.some((i) => foundWords.has(level.grid.words[i]!.w));
      if (!alreadyFilled && !hintedCells.has(key)) candidates.push(key);
    }
    if (candidates.length === 0) return;
    const pick = candidates[Math.floor(Math.random() * candidates.length)]!;
    setHintedCells(new Set(hintedCells).add(pick));
  }

  function handleRevealWord() {
    if (!level) return;
    const unfound = level.grid.words.filter((w) => !foundWords.has(w.w));
    if (unfound.length === 0) return;
    if (!spendOnHint(REVEAL_WORD_ITEM)) return;
    refreshCoins();
    const pick = unfound[Math.floor(Math.random() * unfound.length)]!;
    const next = new Set(foundWords);
    next.add(pick.w);
    setFoundWords(next);
    if (next.size === level.grid.words.length) finishLevel();
  }

  const allFound = level ? foundWords.size === level.grid.words.length : false;
  const headerTitle = currentLevel
    ? `${t("chapter.name", { number: Math.ceil(currentLevel.levelNumber / 25) })} · ${currentLevel.levelNumber}`
    : "";

  if (!level || !currentLevel) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
        <Text style={{ color: theme.textMuted, textAlign: "center", marginTop: 40 }}>No level available.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
      <GameHeader
        theme={theme}
        title={headerTitle}
        coins={coins}
        onBack={back}
        onSettings={() => goTo("settings")}
        onBonusWords={() => goTo("bonusWords")}
        onShop={() => goTo("shop")}
      />

      <Text style={[styles.subLabel, { color: theme.textMuted }]}>
        {foundWords.size}/{level.grid.words.length} words{allFound ? ` ${t("game.solved")}` : ""}
      </Text>

      <View style={styles.gridArea} onLayout={(e: LayoutChangeEvent) => setGridArea(e.nativeEvent.layout)}>
        {gridArea.width > 0 && (
          <GridBoard
            grid={level.grid}
            foundWords={foundWords}
            hintedCells={hintedCells}
            theme={theme}
            availableWidth={gridArea.width}
            availableHeight={gridArea.height}
          />
        )}
      </View>

      <Text style={[styles.bonusLine, { color: theme.accent }]}>{t("game.bonusWordsFound", { count: foundBonusWords.size })}</Text>

      <HintButtons
        theme={theme}
        letterLabel={t("game.hintLetter")}
        wordLabel={t("game.hintWord")}
        letterCost={hintPrice(REVEAL_LETTER_ITEM)}
        wordCost={hintPrice(REVEAL_WORD_ITEM)}
        onRevealLetter={handleRevealLetter}
        onRevealWord={handleRevealWord}
        disabled={allFound}
      />

      <WordPreview word={previewWord} theme={theme} shakeToken={shakeToken} />

      <View style={styles.wheelArea}>
        <Wheel letters={arrangement} theme={theme} onSubmit={handleSubmit} onSelectionChange={setPreviewWord} />
      </View>

      <ShuffleButton theme={theme} onPress={() => setArrangement(shuffled(arrangement))} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  subLabel: {
    textAlign: "center",
    fontSize: 11,
    marginBottom: 2,
  },
  gridArea: {
    flex: 3,
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  bonusLine: {
    textAlign: "center",
    fontSize: 12,
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  wheelArea: {
    flex: 2,
    minHeight: 140,
    width: "100%",
    marginTop: 4,
    marginBottom: 12,
  },
});
