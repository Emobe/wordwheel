import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../useTheme";
import { useAppState } from "../state/AppState";
import { useTranslation } from "../i18n/i18n";
import { getProgress } from "../db/repository";

export function HomeScreen() {
  const theme = useTheme();
  const { goTo, settings, coins } = useAppState();
  const t = useTranslation();
  const progress = getProgress(settings.wordLanguage);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={[styles.coins, { color: theme.accent }]}>{t("shop.coins", { count: coins })}</Text>
      </View>

      <View style={styles.center}>
        <Text style={[styles.title, { color: theme.text }]}>{t("home.title")}</Text>

        <Pressable
          style={[styles.primaryButton, { backgroundColor: theme.tileFilledBg }]}
          onPress={() => goTo("game")}
        >
          <Text style={[styles.primaryButtonText, { color: theme.tileFilledText }]}>
            {t("home.continueLevel", { level: progress.level })}
          </Text>
        </Pressable>

        <Pressable style={[styles.secondaryButton, { borderColor: theme.tileEmptyBorder }]} onPress={() => goTo("languagePicker")}>
          <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
            {t("home.language")}: {settings.wordLanguage.toUpperCase()}
          </Text>
        </Pressable>

        <Pressable style={[styles.secondaryButton, { borderColor: theme.tileEmptyBorder }]} onPress={() => goTo("shop")}>
          <Text style={[styles.secondaryButtonText, { color: theme.text }]}>{t("shop.title")}</Text>
        </Pressable>

        <Pressable style={[styles.secondaryButton, { borderColor: theme.tileEmptyBorder }]} onPress={() => goTo("settings")}>
          <Text style={[styles.secondaryButtonText, { color: theme.text }]}>{t("home.settings")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24 },
  header: { alignItems: "flex-end", paddingVertical: 12 },
  coins: { fontSize: 16, fontWeight: "700" },
  center: { flex: 1, justifyContent: "center", gap: 14 },
  title: { fontSize: 32, fontWeight: "800", textAlign: "center", marginBottom: 24 },
  primaryButton: { paddingVertical: 16, borderRadius: 16, alignItems: "center" },
  primaryButtonText: { fontSize: 18, fontWeight: "700" },
  secondaryButton: { paddingVertical: 14, borderRadius: 16, borderWidth: 1, alignItems: "center" },
  secondaryButtonText: { fontSize: 16, fontWeight: "600" },
});
