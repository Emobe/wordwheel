import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../useTheme";
import { useAppState } from "../state/AppState";
import { useTranslation } from "../i18n/i18n";

/** Plan.md section 4: "English at launch. More added as data packs." Only one entry today, but the picker is built to list N languages, not hardcoded to one. */
const AVAILABLE_WORD_LANGUAGES = [{ code: "en", label: "English" }];

export function LanguagePickerScreen() {
  const theme = useTheme();
  const { goTo, back, settings, setSetting } = useAppState();
  const t = useTranslation();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
      <Pressable onPress={back} style={styles.backRow}>
        <Text style={[styles.backText, { color: theme.textMuted }]}>{t("common.back")}</Text>
      </Pressable>

      <Text style={[styles.title, { color: theme.text }]}>{t("languagePicker.title")}</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>
        {t("languagePicker.subtitle", { uiLanguage: settings.uiLanguage.toUpperCase() })}
      </Text>

      <View style={styles.list}>
        {AVAILABLE_WORD_LANGUAGES.map((lang) => {
          const selected = settings.wordLanguage === lang.code;
          return (
            <Pressable
              key={lang.code}
              style={[
                styles.row,
                { borderColor: selected ? theme.accent : theme.tileEmptyBorder, backgroundColor: theme.surface },
              ]}
              onPress={() => {
                setSetting("wordLanguage", lang.code);
                goTo("home");
              }}
            >
              <Text style={[styles.rowText, { color: theme.text }]}>{lang.label}</Text>
              {selected && <Text style={{ color: theme.accent, fontWeight: "700" }}>✓</Text>}
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  backRow: { paddingVertical: 12 },
  backText: { fontSize: 14 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 13, marginBottom: 20 },
  list: { gap: 10 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  rowText: { fontSize: 16, fontWeight: "600" },
});
