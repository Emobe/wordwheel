import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Theme } from "../theme";

interface HintButtonsProps {
  theme: Theme;
  letterLabel: string;
  wordLabel: string;
  letterCost: number;
  wordCost: number;
  onRevealLetter: () => void;
  onRevealWord: () => void;
  disabled: boolean;
}

/** Plan.md section 12: "hint button showing its cost." Two buttons (reveal letter / reveal word), each showing its coin price. */
export function HintButtons({
  theme,
  letterLabel,
  wordLabel,
  letterCost,
  wordCost,
  onRevealLetter,
  onRevealWord,
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
        onPress={onRevealWord}
        style={[styles.button, { backgroundColor: theme.surface, borderColor: theme.tileEmptyBorder, opacity: disabled ? 0.5 : 1 }]}
      >
        <Text style={[styles.label, { color: theme.text }]}>{wordLabel}</Text>
        <Text style={[styles.cost, { color: theme.accent }]}>{wordCost === 0 ? "Free" : wordCost}</Text>
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
