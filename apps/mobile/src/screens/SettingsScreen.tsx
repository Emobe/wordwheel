import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../useTheme";
import { useAppState } from "../state/AppState";
import { useTranslation } from "../i18n/i18n";
import { setSoundEnabled } from "../sound";
import { setHapticsEnabled } from "../haptics";

export function SettingsScreen() {
  const theme = useTheme();
  const { back, settings, setSetting } = useAppState();
  const t = useTranslation();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
      <Pressable onPress={back} style={styles.backRow}>
        <Text style={[styles.backText, { color: theme.textMuted }]}>{t("common.back")}</Text>
      </Pressable>

      <Text style={[styles.title, { color: theme.text }]}>{t("settings.title")}</Text>

      <View style={[styles.row, { borderColor: theme.tileEmptyBorder }]}>
        <Text style={[styles.rowLabel, { color: theme.text }]}>{t("settings.uiLanguage")}</Text>
        <Text style={{ color: theme.textMuted }}>{settings.uiLanguage.toUpperCase()}</Text>
      </View>

      <View style={[styles.row, { borderColor: theme.tileEmptyBorder }]}>
        <Text style={[styles.rowLabel, { color: theme.text }]}>{t("settings.sound")}</Text>
        <Switch
          value={settings.soundEnabled}
          onValueChange={(v) => {
            setSetting("soundEnabled", v);
            setSoundEnabled(v);
          }}
        />
      </View>

      <View style={[styles.row, { borderColor: theme.tileEmptyBorder }]}>
        <Text style={[styles.rowLabel, { color: theme.text }]}>{t("settings.haptics")}</Text>
        <Switch
          value={settings.hapticsEnabled}
          onValueChange={(v) => {
            setSetting("hapticsEnabled", v);
            setHapticsEnabled(v);
          }}
        />
      </View>

      <View style={[styles.row, { borderColor: theme.tileEmptyBorder }]}>
        <Text style={[styles.rowLabel, { color: theme.text }]}>{t("settings.reduceMotion")}</Text>
        <Switch value={settings.reduceMotion} onValueChange={(v) => setSetting("reduceMotion", v)} />
      </View>

      <View style={styles.creditsBlock}>
        <Text style={[styles.rowLabel, { color: theme.text }]}>{t("settings.credits")}</Text>
        <Text style={[styles.creditsBody, { color: theme.textMuted }]}>{t("settings.creditsBody")}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  backRow: { paddingVertical: 12 },
  backText: { fontSize: 14 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowLabel: { fontSize: 16, fontWeight: "600" },
  creditsBlock: { marginTop: 24 },
  creditsBody: { fontSize: 12, marginTop: 6, lineHeight: 18 },
});
