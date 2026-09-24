import * as Haptics from "expo-haptics";

let enabled = true;

export function setHapticsEnabled(value: boolean) {
  enabled = value;
}

export function hapticWordFound() {
  if (!enabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch((err) =>
    console.warn("hapticWordFound failed", err),
  );
}

export function hapticLevelComplete() {
  if (!enabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch((err) =>
    console.warn("hapticLevelComplete failed", err),
  );
}

export function hapticWrong() {
  if (!enabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch((err) =>
    console.warn("hapticWrong failed", err),
  );
}

export function hapticTap() {
  if (!enabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch((err) => console.warn("hapticTap failed", err));
}
