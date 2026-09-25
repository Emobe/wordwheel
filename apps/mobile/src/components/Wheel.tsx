import { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { wheelLayout } from "../wheelGeometry";
import { hapticTap } from "../haptics";
import type { Theme } from "../theme";

const LETTER_DIAMETER = 44;
const HIT_SLOP = 16;
// Not a Plan.md requirement (unlike the grid's 28dp tile floor) — just a
// reasonable lower bound, so it's the first thing to give when a small
// screen (360x640dp) can't fit both a floor-sized grid and a comfortable
// wheel. 168 keeps 7 letters at LETTER_DIAMETER apart without touching.
const MIN_WHEEL_DIAMETER = 168;
const MAX_WHEEL_DIAMETER = 320;

interface WheelProps {
  letters: string[];
  theme: Theme;
  onSubmit: (word: string) => void;
  onSelectionChange: (word: string) => void;
}

export function Wheel({ letters, theme, onSubmit, onSelectionChange }: WheelProps) {
  // Measured from the outer (flex-sized) container, not CSS aspectRatio —
  // aspectRatio derives height purely from width and ignores how much
  // vertical space is actually left after the grid, which let the wheel
  // always claim up to 320dp regardless of the grid needing more room at
  // the largest (11x10) size (see GameScreen's gridArea/wheelArea flex
  // split). Sizing the circle from the real measured box keeps the two
  // in balance instead of the wheel silently starving the grid.
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [selected, setSelected] = useState<number[]>([]);
  // Gesture callbacks need the latest selection synchronously, and calling
  // onSelectionChange/onSubmit (which set state in GameScreen) from inside
  // the setSelected updater function ran them during Wheel's render phase —
  // "Cannot update a component while rendering a different component".
  // This ref is the authoritative selection for gesture logic; setSelected
  // only mirrors it for rendering, and the parent callbacks fire as plain
  // calls in the event handler, not inside a state updater.
  const selectedRef = useRef<number[]>([]);

  const wheelSize =
    containerSize.width > 0 && containerSize.height > 0
      ? Math.max(MIN_WHEEL_DIAMETER, Math.min(MAX_WHEEL_DIAMETER, Math.min(containerSize.width, containerSize.height)))
      : 0;

  // wheelLayout returns the CENTRE of each letter circle, relative to this
  // container's top-left corner.
  const points = useMemo(
    () => (wheelSize > 0 ? wheelLayout(letters.length, wheelSize, LETTER_DIAMETER) : []),
    [letters.length, wheelSize],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  const hitTest = useCallback(
    (x: number, y: number): number | null => {
      for (let i = 0; i < points.length; i++) {
        const p = points[i]!;
        if (Math.hypot(x - p.x, y - p.y) <= LETTER_DIAMETER / 2 + HIT_SLOP) return i;
      }
      return null;
    },
    [points],
  );

  const handleTouch = useCallback(
    (x: number, y: number) => {
      const idx = hitTest(x, y);
      if (idx === null) return;
      const prev = selectedRef.current;
      let next = prev;
      let isNewLetter = false;
      if (prev.length > 0 && prev[prev.length - 1] === idx) {
        return;
      } else if (prev.length > 1 && prev[prev.length - 2] === idx) {
        // Dragging back onto the previous letter un-selects it.
        next = prev.slice(0, -1);
      } else if (prev.includes(idx)) {
        return;
      } else {
        next = [...prev, idx];
        isNewLetter = true;
      }
      selectedRef.current = next;
      setSelected(next);
      if (isNewLetter) hapticTap();
      onSelectionChange(next.map((i) => letters[i]).join(""));
    },
    [hitTest, letters, onSelectionChange],
  );

  const handleEnd = useCallback(() => {
    const prev = selectedRef.current;
    selectedRef.current = [];
    setSelected([]);
    if (prev.length > 0) onSubmit(prev.map((i) => letters[i]).join(""));
    onSelectionChange("");
  }, [letters, onSubmit, onSelectionChange]);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .shouldCancelWhenOutside(false)
        .onBegin((e) => handleTouch(e.x, e.y))
        .onUpdate((e) => handleTouch(e.x, e.y))
        .onEnd(() => handleEnd())
        .runOnJS(true),
    [handleTouch, handleEnd],
  );

  const path = useMemo(() => {
    if (selected.length === 0) return null;
    const p = Skia.Path.Make();
    selected.forEach((idx, i) => {
      const point = points[idx]!;
      if (i === 0) p.moveTo(point.x, point.y);
      else p.lineTo(point.x, point.y);
    });
    return p;
  }, [selected, points]);

  return (
    <View style={styles.measureArea} onLayout={onLayout}>
      {wheelSize > 0 && (
        <View
          style={[
            styles.wheel,
            { width: wheelSize, height: wheelSize, borderRadius: wheelSize / 2, backgroundColor: theme.wheelBg },
          ]}
        >
          <GestureDetector gesture={gesture}>
            <View style={StyleSheet.absoluteFill}>
              <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
                {path && (
                  <Path path={path} color={theme.swipeLine} style="stroke" strokeWidth={6} strokeCap="round" strokeJoin="round" />
                )}
              </Canvas>
              {letters.map((letter, i) => {
                const p = points[i];
                if (!p) return null;
                const isSelected = selected.includes(i);
                return (
                  <View
                    key={i}
                    pointerEvents="none"
                    style={[
                      styles.letter,
                      {
                        left: p.x - LETTER_DIAMETER / 2,
                        top: p.y - LETTER_DIAMETER / 2,
                        width: LETTER_DIAMETER,
                        height: LETTER_DIAMETER,
                        borderRadius: LETTER_DIAMETER / 2,
                        backgroundColor: isSelected ? theme.wheelLetterBgSelected : theme.wheelLetterBg,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: "700",
                        color: isSelected ? theme.wheelLetterTextSelected : theme.wheelLetterText,
                      }}
                    >
                      {letter}
                    </Text>
                  </View>
                );
              })}
            </View>
          </GestureDetector>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  measureArea: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  wheel: {
    maxWidth: 320,
    maxHeight: 320,
  },
  letter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
});
