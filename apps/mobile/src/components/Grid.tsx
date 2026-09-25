import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import type { Grid as GridType } from "@word-wheel/core";
import { TILE_GAP, gridCells, tileSize } from "../gridGeometry";
import type { Theme } from "../theme";

type TileState = "empty" | "hinted" | "filled";

interface AnimatedTileProps {
  size: number;
  letter: string;
  state: TileState;
  theme: Theme;
}

function AnimatedTile({ size, letter, state, theme }: AnimatedTileProps) {
  // 0 = empty, 1 = hinted, 2 = filled — a single progress value drives a
  // three-stop colour interpolation so hinted and filled both get their own
  // theme colours (Plan.md section 12: "hinted tiles" are their own state,
  // not just a stepping-stone that only ever shows on the way to filled).
  const targetProgress = state === "filled" ? 2 : state === "hinted" ? 1 : 0;
  const progress = useSharedValue(targetProgress);

  useEffect(() => {
    progress.value = withTiming(targetProgress, { duration: 260 });
  }, [targetProgress, progress]);

  const style = useAnimatedStyle(() => {
    const scale = 1 + Math.sin(Math.min(progress.value, 1) * Math.PI) * 0.12;
    return {
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1, 2],
        [theme.tileEmptyBg, theme.tileHintedBg, theme.tileFilledBg],
      ),
      borderColor: interpolateColor(
        progress.value,
        [0, 1, 2],
        [theme.tileEmptyBorder, theme.tileHintedBg, theme.tileFilledBg],
      ),
      transform: [{ scale }],
    };
  });

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1, 2],
      [theme.tileEmptyBg, theme.tileHintedText, theme.tileFilledText],
    ),
  }));

  // Letters are shown once a tile is at least hinted — filled tiles always
  // show their letter, but so does a still-unsolved hinted cell.
  const showLetter = state !== "empty";

  return (
    <Animated.View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: size * 0.16 },
        style,
      ]}
    >
      <Animated.Text style={[{ fontSize: size * 0.48, fontWeight: "700" }, textStyle]}>
        {showLetter ? letter : ""}
      </Animated.Text>
    </Animated.View>
  );
}

interface GridProps {
  grid: GridType;
  foundWords: ReadonlySet<string>;
  /** Cell keys ("x,y") revealed by a hint but not yet part of a found word. */
  hintedCells?: ReadonlySet<string>;
  theme: Theme;
  availableWidth: number;
  availableHeight: number;
  /** When set, empty cells become tappable — the pick-letter hint's "choose which cell to reveal" mode. */
  onCellPress?: (key: string) => void;
}

export function GridBoard({ grid, foundWords, hintedCells, theme, availableWidth, availableHeight, onCellPress }: GridProps) {
  const size = tileSize(grid, availableWidth, availableHeight);
  const cells = gridCells(grid);
  const gap = TILE_GAP;
  const boardWidth = grid.cols * size + (grid.cols - 1) * gap;
  const boardHeight = grid.rows * size + (grid.rows - 1) * gap;

  const cellState = (key: string, wordIndices: number[]): TileState => {
    if (wordIndices.some((i) => foundWords.has(grid.words[i]!.w))) return "filled";
    if (hintedCells?.has(key)) return "hinted";
    return "empty";
  };

  return (
    <View style={[styles.board, { width: boardWidth, height: boardHeight }]}>
      {[...cells.values()].map((cell) => {
        const key = `${cell.x},${cell.y}`;
        const state = cellState(key, cell.wordIndices);
        const tile = <AnimatedTile size={size} letter={cell.letter} state={state} theme={theme} />;
        return (
          <View
            key={key}
            style={{
              position: "absolute",
              left: cell.x * (size + gap),
              top: cell.y * (size + gap),
            }}
          >
            {onCellPress && state === "empty" ? (
              <Pressable onPress={() => onCellPress(key)}>{tile}</Pressable>
            ) : (
              tile
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    alignSelf: "center",
  },
  tile: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
});
