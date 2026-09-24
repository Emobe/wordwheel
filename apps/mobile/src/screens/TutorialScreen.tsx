import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../useTheme";
import { useAppState } from "../state/AppState";
import { useTranslation, type TranslationKey } from "../i18n/i18n";

const STEPS: TranslationKey[] = ["tutorial.step1", "tutorial.step2", "tutorial.step3", "tutorial.step4"];

/** Plan.md section 12: "a few guided levels showing swiping, bonus words, shuffle and hints." A static walkthrough rather than instrumenting the real game screen with guided steps — enough for Phase 2's game-loop gate; a truly interactive tutorial is a later-polish item. */
export function TutorialScreen() {
  const theme = useTheme();
  const { goTo, setSetting } = useAppState();
  const t = useTranslation();
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;

  function finish() {
    setSetting("tutorialDone", true);
    goTo("home");
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
      <Pressable onPress={finish} style={styles.skipRow}>
        <Text style={[styles.skipText, { color: theme.textMuted }]}>{t("tutorial.skip")}</Text>
      </Pressable>

      <View style={styles.center}>
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === step ? theme.accent : theme.tileEmptyBorder },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.stepText, { color: theme.text }]}>{t(STEPS[step]!)}</Text>
      </View>

      <Pressable
        style={[styles.button, { backgroundColor: theme.tileFilledBg }]}
        onPress={() => (isLast ? finish() : setStep((s) => s + 1))}
      >
        <Text style={[styles.buttonText, { color: theme.tileFilledText }]}>
          {isLast ? t("tutorial.done") : t("tutorial.next")}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24, paddingBottom: 24 },
  skipRow: { alignItems: "flex-end", paddingVertical: 12 },
  skipText: { fontSize: 14 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  dots: { flexDirection: "row", gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  stepText: { fontSize: 20, fontWeight: "600", textAlign: "center", lineHeight: 28 },
  button: { paddingVertical: 16, borderRadius: 16, alignItems: "center" },
  buttonText: { fontSize: 16, fontWeight: "700" },
});
