import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../useTheme";
import { useAppState } from "../state/AppState";
import { useTranslation } from "../i18n/i18n";

export function BonusWordsScreen() {
  const theme = useTheme();
  const { back, currentLevel, foundBonusWords } = useAppState();
  const t = useTranslation();
  const words = [...foundBonusWords].sort();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
      <Pressable onPress={back} style={styles.backRow}>
        <Text style={[styles.backText, { color: theme.textMuted }]}>{t("common.back")}</Text>
      </Pressable>

      <Text style={[styles.title, { color: theme.text }]}>{t("bonusWords.title")}</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>{t("bonusWords.thisLevel")}</Text>

      {words.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textMuted }]}>{t("bonusWords.empty")}</Text>
      ) : (
        <ScrollView style={styles.list}>
          <View style={styles.grid}>
            {words.map((w) => (
              <View key={w} style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.tileEmptyBorder }]}>
                <Text style={[styles.chipText, { color: theme.text }]}>{w}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {currentLevel && (
        <Text style={[styles.total, { color: theme.textMuted }]}>
          {words.length} / {currentLevel.bonusWords.length}
        </Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  backRow: { paddingVertical: 12 },
  backText: { fontSize: 14 },
  title: { fontSize: 24, fontWeight: "800" },
  subtitle: { fontSize: 13, marginTop: 4, marginBottom: 16 },
  empty: { fontSize: 14, textAlign: "center", marginTop: 40 },
  list: { flex: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  chipText: { fontSize: 14, fontWeight: "600" },
  total: { textAlign: "center", fontSize: 12, paddingVertical: 12 },
});
