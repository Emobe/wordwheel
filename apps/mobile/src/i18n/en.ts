/**
 * English UI strings. Plan.md section 5: "all UI text goes through a
 * translation layer from day one. No hardcoded strings in screens." This is
 * the only translation file that exists yet ("English only at launch");
 * adding a UI language means adding a sibling file with the same keys and
 * registering it in `i18n.ts`.
 */
const en = {
  "common.back": "Back",
  "common.settings": "Settings",
  "common.continue": "Continue",
  "common.close": "Close",
  "common.play": "Play",

  "home.title": "Word Wheel",
  "home.continueLevel": "Continue — Level {level}",
  "home.language": "Word language",
  "home.settings": "Settings",

  "languagePicker.title": "Word language",
  "languagePicker.subtitle": "Pick the language the wheel and grid use. Menus stay in {uiLanguage}.",

  "game.tryAnotherLevel": "tap to try another level",
  "game.bonusWordsFound": "Bonus words found: {count}",
  "game.bonusWordsButton": "Bonus words",
  "game.shuffle": "Shuffle",
  "game.hintLetter": "Reveal letter",
  "game.hintWord": "Reveal word",
  "game.solved": "— solved!",

  "bonusWords.title": "Bonus words",
  "bonusWords.thisLevel": "Found this level",
  "bonusWords.empty": "None found yet — spell a word that isn't in the grid.",

  "shop.title": "Shop",
  "shop.coins": "{count} coins",
  "shop.buy": "Get",
  "shop.owned": "Owned: {count}",
  "shop.free": "Free",
  "shop.watchAd": "Watch ad for {count} coins",
  "shop.watchAdLoading": "Ad not ready yet",

  "settings.title": "Settings",
  "settings.uiLanguage": "App language",
  "settings.sound": "Sound",
  "settings.haptics": "Haptics",
  "settings.reduceMotion": "Reduce motion",
  "settings.credits": "Credits",
  "settings.creditsBody": "Word list from SCOWL (Kevin Atkinson et al.). See the pack's license field for full credits.",

  "levelComplete.title": "Level complete!",
  "levelComplete.coinsEarned": "+{count} coins",
  "levelComplete.continue": "Continue",

  "tutorial.step1": "Swipe across letters to spell a word.",
  "tutorial.step2": "Words in the grid fill in when you find them.",
  "tutorial.step3": "Words not in the grid still count as bonus words.",
  "tutorial.step4": "Shuffle rearranges the wheel if you're stuck.",
  "tutorial.skip": "Skip",
  "tutorial.next": "Next",
  "tutorial.done": "Let's play",

  "chapter.name": "Chapter {number}",
};

export default en;
export type TranslationKey = keyof typeof en;
