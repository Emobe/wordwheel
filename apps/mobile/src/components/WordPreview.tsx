import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import type { Theme } from "../theme";

interface WordPreviewProps {
  word: string;
  theme: Theme;
  /** Bump this to trigger a shake, e.g. on an invalid submission. */
  shakeToken: number;
}

export function WordPreview({ word, theme, shakeToken }: WordPreviewProps) {
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (shakeToken === 0) return;
    shakeX.value = withSequence(
      withTiming(-10, { duration: 45 }),
      withTiming(10, { duration: 90 }),
      withTiming(-8, { duration: 90 }),
      withTiming(8, { duration: 90 }),
      withTiming(0, { duration: 60 }),
    );
  }, [shakeToken, shakeX]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={style}>
        <Text style={[styles.word, { color: word ? theme.text : theme.textMuted }]}>{word || " "}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  word: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 4,
  },
});
