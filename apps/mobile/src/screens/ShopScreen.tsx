import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DEFAULT_ECONOMY_CONFIG } from "@word-wheel/core";
import { useTheme } from "../useTheme";
import { useAppState } from "../state/AppState";
import { useTranslation } from "../i18n/i18n";
import { buyItem } from "../economy/wallet";
import { getItemCount } from "../db/repository";

const ITEM_NAME_KEYS: Record<string, string> = {
  "reveal-letter": "game.hintLetter",
  "reveal-word": "game.hintWord",
};

export function ShopScreen() {
  const theme = useTheme();
  const { back, coins, refreshCoins } = useAppState();
  const t = useTranslation();
  const [, forceRerender] = useState(0);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
      <Pressable onPress={back} style={styles.backRow}>
        <Text style={[styles.backText, { color: theme.textMuted }]}>{t("common.back")}</Text>
      </Pressable>

      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>{t("shop.title")}</Text>
        <Text style={[styles.coins, { color: theme.accent }]}>{t("shop.coins", { count: coins })}</Text>
      </View>

      <View style={styles.list}>
        {DEFAULT_ECONOMY_CONFIG.itemCatalog.map((item) => {
          const owned = getItemCount(item.id);
          const nameKey = ITEM_NAME_KEYS[item.id];
          return (
            <View key={item.id} style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.tileEmptyBorder }]}>
              <View>
                <Text style={[styles.itemName, { color: theme.text }]}>
                  {nameKey ? t(nameKey as Parameters<typeof t>[0]) : item.id}
                </Text>
                <Text style={[styles.owned, { color: theme.textMuted }]}>{t("shop.owned", { count: owned })}</Text>
              </View>
              <Pressable
                style={[styles.buyButton, { backgroundColor: theme.tileFilledBg }]}
                onPress={() => {
                  buyItem(item.id);
                  refreshCoins();
                  forceRerender((n) => n + 1);
                }}
              >
                <Text style={[styles.buyButtonText, { color: theme.tileFilledText }]}>
                  {item.coinPrice === 0 ? t("shop.free") : `${item.coinPrice}`}
                </Text>
              </Pressable>
            </View>
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
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "800" },
  coins: { fontSize: 16, fontWeight: "700" },
  list: { gap: 10 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  itemName: { fontSize: 16, fontWeight: "700" },
  owned: { fontSize: 12, marginTop: 2 },
  buyButton: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12 },
  buyButtonText: { fontSize: 14, fontWeight: "700" },
});
