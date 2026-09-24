import { createAudioPlayer } from "expo-audio";

/**
 * Plan.md section 12/15: sound on word found, level complete, wrong
 * selection. Placeholder tones (packages/tools/src/gen-sounds.ts) until real
 * sound design lands. A fresh player per play() call rather than one shared
 * player, so rapid repeats (e.g. quickly finding several words) don't cut
 * each other off.
 */
const SOUND_FILES = {
  wordFound: require("../assets/sounds/word-found.wav"),
  levelComplete: require("../assets/sounds/level-complete.wav"),
  wrong: require("../assets/sounds/wrong.wav"),
} as const;

export type SoundName = keyof typeof SOUND_FILES;

let enabled = true;

export function setSoundEnabled(value: boolean) {
  enabled = value;
}

export function playSound(name: SoundName) {
  if (!enabled) return;
  try {
    const player = createAudioPlayer(SOUND_FILES[name]);
    player.play();
    // Release once playback finishes so short-lived players don't pile up.
    const sub = player.addListener("playbackStatusUpdate", (status) => {
      if (status.didJustFinish) {
        sub.remove();
        player.remove();
      }
    });
  } catch (err) {
    console.warn(`playSound(${name}) failed`, err);
  }
}
