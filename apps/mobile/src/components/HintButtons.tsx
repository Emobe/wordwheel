import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Theme } from "../theme";

interface HintButtonsProps {
  theme: Theme;
  letterLabel: string;
  pickLabel: string;
  letterCost: number;
  pickCost: number;
  onRevealLetter: () => void;
  onTogglePickLetter: () => void;
  pickActive: boolean;
  disabled: boolean;
}

/**
 * Plan.md section 12: "hint button showing its cost." Two buttons: reveal
 * letter (sequentially reveals an auto-picked word, one letter per use) and
 * pick letter (arms tap-to-reveal mode — the next empty grid cell the
 * player taps is what gets revealed).
 */
export function HintButtons({
  theme,
  letterLabel,
  pickLabel,
  letterCost,
  pickCost,
  onRevealLetter,
  onTogglePickLetter,
  pickActive,
  disabled,
}: HintButtonsProps) {
  return (
    <View style={styles.row}>
      <Pressable
        disabled={disabled}
        onPress={onRevealLetter}
        style={[styles.button, { backgroundColor: theme.surface, borderColor: theme.tileEmptyBorder, opacity: disabled ? 0.5 : 1 }]}
      >
        <Text style={[styles.label, { color: theme.text }]}>{letterLabel}</Text>
        <Text style={[styles.cost, { color: theme.accent }]}>{letterCost === 0 ? "Free" : letterCost}</Text>
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
        <Text style={[styles.label, { color: pickActive ? theme.tileFilledText : theme.text }]}>{pickLabel}</Text>
        <Text style={[styles.cost, { color: pickActive ? theme.tileFilledText : theme.accent }]}>
          {pickCost === 0 ? "Free" : pickCost}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, justifyContent: "center" },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    minWidth: 96,
  },
  label: { fontSize: 11, fontWeight: "600" },
  cost: { fontSize: 12, fontWeight: "800", marginTop: 1 },
});
