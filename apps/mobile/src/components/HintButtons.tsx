import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Theme } from "../theme";

interface HintButtonsProps {
  theme: Theme;
  letterCost: number;
  pickCost: number;
  onRevealLetter: () => void;
  onTogglePickLetter: () => void;
  pickActive: boolean;
  disabled: boolean;
}

/**
 * Icon-only hint buttons (Plan.md section 12: "hint button showing its
 * cost") — a vertical column beside the wheel instead of a labeled row
 * under the grid, so the grid gets the vertical space back. Bulb = reveal
 * letter (sequentially reveals an auto-picked word, one letter per use);
 * crosshair = pick letter (arms tap-to-reveal mode for a specific empty
 * cell). Cost only renders as a badge when non-zero — a free hint needs no
 * label to read as free.
 */
export function HintButtons({
  theme,
  letterCost,
  pickCost,
  onRevealLetter,
  onTogglePickLetter,
  pickActive,
  disabled,
}: HintButtonsProps) {
  return (
    <View style={styles.column}>
      <Pressable
        disabled={disabled}
        onPress={onRevealLetter}
        style={[styles.button, { backgroundColor: theme.surface, borderColor: theme.tileEmptyBorder, opacity: disabled ? 0.5 : 1 }]}
      >
        <Text style={styles.icon}>💡</Text>
        {letterCost > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.accent }]}>
            <Text style={[styles.badgeText, { color: theme.tileFilledText }]}>{letterCost}</Text>
          </View>
        )}
      </Pressable>
      <Pressable
        disabled={disabled}
        onPress={onTogglePickLetter}
        style={[
          styles.button,
          {
            backgroundColor: pickActive ? theme.accent : theme.surface,
            borderColor: pickActive ? theme.accent : theme.tileEmptyBorder,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Text style={styles.icon}>🎯</Text>
        {pickCost > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.accent }]}>
            <Text style={[styles.badgeText, { color: theme.tileFilledText }]}>{pickCost}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: 12, alignItems: "center" },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 22 },
  badge: {
    position: "absolute",
    bottom: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 9, fontWeight: "800" },
});
