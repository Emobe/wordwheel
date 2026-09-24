import { Pressable, StyleSheet, Text } from "react-native";
import type { Theme } from "../theme";

interface ShuffleButtonProps {
  theme: Theme;
  onPress: () => void;
}

export function ShuffleButton({ theme, onPress }: ShuffleButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.surface, borderColor: theme.tileEmptyBorder, opacity: pressed ? 0.7 : 1 },
      ]}
      hitSlop={8}
    >
      <Text style={[styles.label, { color: theme.text }]}>Shuffle</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
});
