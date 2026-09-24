import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useTheme } from "../useTheme";
import { useAppState } from "../state/AppState";
import { useTranslation } from "../i18n/i18n";
import { playSound } from "../sound";
import { hapticLevelComplete } from "../haptics";

export function LevelCompleteScreen() {
  const theme = useTheme();
  const { goTo, lastCoinsEarned, startNewLevelRun } = useAppState();
  const t = useTranslation();
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    playSound("levelComplete");
    hapticLevelComplete();
    scale.value = withTiming(1, { duration: 320 });
    opacity.value = withTiming(1, { duration: 320 });
  }, [opacity, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
      <View style={styles.center}>
        <Animated.View style={style}>
          <Text style={[styles.title, { color: theme.text }]}>{t("levelComplete.title")}</Text>
          <Text style={[styles.coins, { color: theme.accent }]}>
            {t("levelComplete.coinsEarned", { count: lastCoinsEarned })}
          </Text>
        </Animated.View>

        <Pressable
          style={[styles.button, { backgroundColor: theme.tileFilledBg }]}
          onPress={() => {
            startNewLevelRun();
            goTo("game");
          }}
        >
          <Text style={[styles.buttonText, { color: theme.tileFilledText }]}>{t("levelComplete.continue")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 24 },
  title: { fontSize: 28, fontWeight: "800", textAlign: "center" },
  coins: { fontSize: 20, fontWeight: "700", textAlign: "center", marginTop: 10 },
  button: { paddingVertical: 16, paddingHorizontal: 40, borderRadius: 16 },
  buttonText: { fontSize: 18, fontWeight: "700" },
});
