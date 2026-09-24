/**
 * Flat-colour theme tokens per Plan.md section 15: background, tile states,
 * wheel, accent, text, light and dark. No textures or images this phase.
 */
export interface Theme {
  background: string;
  surface: string;
  tileEmptyBg: string;
  tileEmptyBorder: string;
  tileFilledBg: string;
  tileFilledText: string;
  tileHintedBg: string;
  tileHintedText: string;
  wheelBg: string;
  wheelLetterBg: string;
  wheelLetterBgSelected: string;
  wheelLetterText: string;
  wheelLetterTextSelected: string;
  swipeLine: string;
  accent: string;
  text: string;
  textMuted: string;
  error: string;
}

export const lightTheme: Theme = {
  background: "#F4F1EA",
  surface: "#FFFFFF",
  tileEmptyBg: "#E7E2D6",
  tileEmptyBorder: "#CFC8B4",
  tileFilledBg: "#4C7A5E",
  tileFilledText: "#FFFFFF",
  tileHintedBg: "#D9B34C",
  tileHintedText: "#3A2E00",
  wheelBg: "#EFEAE0",
  wheelLetterBg: "#FFFFFF",
  wheelLetterBgSelected: "#4C7A5E",
  wheelLetterText: "#2B2B26",
  wheelLetterTextSelected: "#FFFFFF",
  swipeLine: "#4C7A5E",
  accent: "#C0562C",
  text: "#2B2B26",
  textMuted: "#6E6A5E",
  error: "#B23A3A",
};

export const darkTheme: Theme = {
  background: "#1B1B18",
  surface: "#242420",
  tileEmptyBg: "#2E2E28",
  tileEmptyBorder: "#45453C",
  tileFilledBg: "#5FA37D",
  tileFilledText: "#101410",
  tileHintedBg: "#D9B34C",
  tileHintedText: "#3A2E00",
  wheelBg: "#242420",
  wheelLetterBg: "#2E2E28",
  wheelLetterBgSelected: "#5FA37D",
  wheelLetterText: "#EDEAE0",
  wheelLetterTextSelected: "#101410",
  swipeLine: "#5FA37D",
  accent: "#E08A54",
  text: "#EDEAE0",
  textMuted: "#A6A296",
  error: "#E07A7A",
};

/** Plan.md section 11: "each chapter has its own colour palette from the theme file." Keyed by chapters.ts's `paletteKey` (cycles through these 5). Backgrounds replace these later per section 11. */
export const chapterPalettes: Record<string, { light: string; dark: string }> = {
  "palette-1": { light: "#4C7A5E", dark: "#5FA37D" }, // green (matches the default accent tiles)
  "palette-2": { light: "#3E6B8A", dark: "#5B93BA" }, // blue
  "palette-3": { light: "#8A4E6B", dark: "#BA7099" }, // plum
  "palette-4": { light: "#B08A2E", dark: "#D9B34C" }, // gold
  "palette-5": { light: "#B0562C", dark: "#E08A54" }, // rust
};

export function paletteFor(paletteKey: string, scheme: "light" | "dark"): string {
  const palette = chapterPalettes[paletteKey] ?? chapterPalettes["palette-1"]!;
  return palette[scheme];
}
