import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Theme } from "../theme";

interface GameHeaderProps {
  theme: Theme;
  title: string;
  coins: number;
  onBack: () => void;
  onSettings: () => void;
  onShop: () => void;
}

/**
 * Plan.md section 12: "Header: back, menu, chapter and level title,
 * settings." Built as a real flex row (back / title / settings-and-menu),
 * not an absolutely-positioned icon over full-width text — that overlap was
 * exactly what clipped the header in the Phase 1 prototype (see
 * KNOWN_ISSUES.md). `title` gets `numberOfLines={1}` and `flexShrink` so a
 * long chapter name truncates with an ellipsis instead of overlapping
 * either side button, at any screen width down to the 360dp target.
 */
export function GameHeader({ theme, title, coins, onBack, onSettings, onShop }: GameHeaderProps) {
  return (
    <View style={styles.row}>
      <Pressable onPress={onBack} hitSlop={8} style={styles.sideButton}>
        <Text style={[styles.sideButtonText, { color: theme.textMuted }]}>‹</Text>
      </Pressable>

      <Text
        style={[styles.title, { color: theme.text }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {title}
      </Text>

      <View style={styles.rightGroup}>
        <Pressable onPress={onShop} hitSlop={6} style={[styles.coinPill, { backgroundColor: theme.surface, borderColor: theme.tileEmptyBorder }]}>
          <Text style={[styles.coinText, { color: theme.accent }]}>{coins}</Text>
        </Pressable>
        <Pressable onPress={onSettings} hitSlop={6} style={styles.iconButton}>
          <Text style={[styles.iconText, { color: theme.textMuted }]}>⚙</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 6,
  },
  sideButton: {
    width: 28,
    alignItems: "flex-start",
  },
  sideButtonText: {
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 26,
  },
  title: {
    flex: 1,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconButton: {
    width: 26,
    alignItems: "center",
  },
  iconText: {
    fontSize: 16,
  },
  coinPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  coinText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
