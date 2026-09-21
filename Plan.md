# Word Wheel Game: Plan

Working title: TBD. Do not use "Wordscapes" or a lookalike name, and do not reuse its art, level data or word lists.

## 1. Goal

A mobile word-wheel crossword game: swipe letters on a wheel to fill a crossword grid. It fixes two problems in the game it is modelled on:

1. Valid words get rejected. A large, permissive dictionary must accept every real word spellable from the wheel.
2. The same words and wheels keep repeating. Level selection must track what the player has seen.

Later goals: many languages, weekend tournaments, and a light meta layer (daily gift, animals, bees).

## 2. Decisions

| Area | Decision |
|---|---|
| Platform | Android first. iOS later from the same codebase. No web target. |
| Stack | Expo (React Native) with TypeScript. Development builds, not Expo Go, because ads and purchases need native modules. |
| Repo | Bun workspaces monorepo: `packages/core`, `packages/tools`, `apps/mobile`. |
| Languages | English at launch. Everything language-specific lives in data packs. |
| Levels | Generated offline, shipped as static JSON. Seeded on-device generation only for later endless or daily modes. |
| Monetisation | Rewarded ads for hints, capped interstitials, remove-ads purchase, coin packs. AdMob for ads, RevenueCat for purchases. |
| Backend | None at launch. Nakama later for weekend tournaments. |

## 3. Repo layout

```
packages/core     Pure TypeScript. No React, no DOM. Language packs, generator, game rules, difficulty scoring.
packages/tools    Bun scripts. Word pipeline, level generation, reports. Runs offline.
apps/mobile       Expo app. UI, input, audio, PlatformServices implementations.
data/build        Generated packs and levels. Gitignored. Reproducible from tools.
docs              Short design notes, one per phase.
```

All native calls (ads, purchases, consent, storage, time) go through a `PlatformServices` interface so `core` and tests never touch native code.

## 4. Language packs

Each language has a pack:

- alphabet and normalisation rules
- target words: common, curated, used for grid placement, each with a commonness rank
- accepted words: a large permissive set, used to validate any word the player enters and to compute bonus words at runtime
- lemma map: surface form to base form, needed for repetition cooldowns
- profanity list

Bonus words are computed at runtime from the accepted set, not stored per level. That keeps level files small and guarantees no valid word is rejected.

### English sources

- SCOWL for accepted words. Its licence allows use and sale if the copyright notice is kept. Build the list from the size levels you choose, and accept both American and British spellings.
- SCOWL size levels double as commonness tiers, so no frequency corpus is needed for English.
- SCOWL ships a small taboo list. Treat it as a starting point and add your own.

### Other languages (later)

- Candidates: Hunspell dictionaries (need affix expansion to get inflected forms), Wiktionary extracts via kaikki.org (CC BY-SA), FrequencyWords (content is CC BY-SA 4.0, derived from OpenSubtitles).
- Licences differ per language. Share-alike terms may affect how derived packs can be distributed in a paid app. Get a licence review before shipping any non-English pack.
- The pipeline records the licence per pack and generates a credits screen.
- Decide per language: accent handling, casing rules (for example Turkish dotted and dotless i), ß and umlauts for German. Right-to-left scripts need their own layout work. CJK does not fit this mechanic.

## 5. Level generator

Runs in `packages/tools`, logic lives in `packages/core`. Deterministic from a seed (seeded PRNG, never `Math.random`).

1. Pick a wheel word of 3 to 7 letters from the target tier. Its letter multiset is the wheel.
2. Find every accepted word spellable from that multiset (trie walk with letter counts).
3. Choose grid words from the target tier to hit a target difficulty. All other spellable words become bonus words at runtime.
4. Lay out the grid: place the longest word first, then add crossings with backtracking. Score candidates on compactness, crossing count and aspect ratio.
5. Validate: every grid word spellable from the wheel, grid connected, no accidental adjacent words, no profanity, at most one inflected form per lemma in the grid.
6. Emit JSON and a difficulty score.

Level file shape:

```json
{
  "id": "en-000123",
  "lang": "en",
  "wheel": ["T","A","R","E","S"],
  "grid": { "w": 7, "h": 6, "words": [ { "w": "STARE", "x": 0, "y": 2, "dir": "H" } ] },
  "difficulty": 37.5,
  "tier": 3
}
```

## 6. Variety rules

The repetition problem in the reference game is a fixed pool that loops. Plurals make it worse because "cat" and "cats" look different but feel the same.

- Cooldowns apply to lemmas, not surface forms.
- Per-player history records when each wheel word and grid lemma was last seen. Candidate levels are weighted by time since last seen.
- Starting values, to be tuned: no wheel word repeats within about 500 levels, no grid lemma within about 30 levels, shorter window for 3-letter words.
- Reject near-duplicate levels: different wheels with the same letters, or grids that share most of their words.
- Never loop. Ship new packs as static JSON downloaded on demand.
- The generator CLI prints a variety report for 1,000 levels: distinct wheels, distinct grid lemmas against total slots, and the longest gap before any repeat.

## 7. Difficulty scale

Every level gets a numeric score from measurable features:

- structure: wheel size, grid word count, grid size, whether the full-wheel word is required
- word rarity: rarest required word and average rarity
- letters: rare letters (Q, Z, X, J), doubled letters, vowel-poor wheels
- crossings: fewer crossings means fewer free letters, so harder
- inflected forms required

A target score is mapped from level number as a sawtooth: easier levels are mixed in after hard ones. Starting bands, all tunable:

| Tier | Levels | Wheel | Grid words | Rarest required word | Notes |
|---|---|---|---|---|---|
| 1 | 1-100 | 3-4 | 3-6 | most common tier | base forms only, no rare letters |
| 2 | 101-400 | 4-5 | 6-10 | common | some plurals |
| 3 | 401-1200 | 5-6 | 10-16 | mid | doubled letters, a few rare letters |
| 4 | 1200-3000 | 6-7 | 14-22 | uncommon | fewer crossings, anagram clusters |
| 5 | 3000+ | 7 | 18-28 | rare but valid | sparse grids, all forms in play |

Calibration:

1. Before launch: a simulated player that knows each word with a probability based on its frequency. Check that scores track its solve time and hint use.
2. After launch: log completion time, hints used and quit rate per level, and refit the weights.

Player setting (Relaxed, Standard, Hard) shifts the target score. A small adaptive nudge uses recent hint use.

## 8. Meta layer (client-only first)

All reward tables, timers and drop rates live in JSON config so they can be tuned without a release.

- Coins and hints. Rewarded ads grant coins or hints.
- Daily gift: player picks one of three boxes. Use stored timestamps. Add a server time check once a backend exists.
- Bees: a hint that reveals the first letter of a word.
- Animals: an idle loop where the player taps periodically to collect a bonus (bees, binocular-style collectible tokens, stars). Animals unlock with eggs and gems.
- Collectibles: tokens placed in grid slots at runtime. Collecting enough gives a random cosmetic piece. Duplicates fill a bonus meter. Place tokens as an overlay after level load, not inside level data.
- Randomised rewards are free-earned only. If randomised items are ever sold, Google Play and the App Store both require odds disclosure before purchase, and some countries restrict them. Keep paid currency for deterministic items (hints, ad removal, specific animals). Get legal advice before selling anything randomised.

## 9. Tournaments (later, needs a server)

- Nakama: leaderboards, tournaments, purchase validation, TypeScript server runtime.
- Weekend Star tournament first. Team tournaments last (invites, moderation, chat).
- Bucketed leaderboards: small brackets of similar players. Fill sparse brackets with simulated players, labelled as bots.
- Anti-cheat: levels have IDs, so the server rejects star counts above the level's word count and implausible completion times.
- Anonymous device auth first, linkable to an account later.
- Per-language leaderboards, since word counts differ.

## 10. Store and compliance (Android)

- Target API 36 (Android 16) is required for new apps and updates on Google Play since August 31, 2026. Check the Expo SDK's default `targetSdkVersion`. API 36 enforces edge-to-edge and changes back handling (predictive back). Test on Android 16.
- Play Console account type matters. Personal accounts created after November 13, 2023 must run a closed test with at least 12 testers opted in continuously for 14 days before applying for production access. Recruit 14 or 15 real testers so a dropout does not reset the clock. Engagement is checked, so testers must actually play.
- Consent: a UMP consent flow for EEA and UK users before the first ad request.
- Ads: test ad units in development. Never click your own production ads.
- Purchases: RevenueCat with Google Play Billing. Test with licensed test accounts on a real device.
- iOS later: needs a paid Apple Developer account, a real iPhone for purchase testing, and the UIKit scene-based life cycle for builds with the iOS 27 SDK. EAS Submit works from Windows, macOS and Linux.

## 11. Phases

Each phase ends with a gate. Write a short design note in `docs/` and get sign-off before implementing.

0. **Generator spike (Bun, English).** Language pack builder, generator, ASCII grid output, variety report, difficulty histogram over 1,000 levels. Gate: generation success rate, time per level, variety report and difficulty curve look right.
1. **Feel prototype.** Expo development build on an Android emulator and at least one real phone, ideally including a low-end device. Swipe wheel, grid fill, bonus words, shuffle, hints. Gate: smooth swipe, acceptable pack load time and memory.
2. **Monetisation pipeline spike.** One test rewarded ad, one sandbox purchase, and the consent flow working on a real device. Gate: end-to-end on device, before content investment.
3. **Game loop.** Progression, difficulty curve, roughly 1,000 levels, saves, sound, haptics.
4. **Meta layer.** Coins, daily gift, bees, animal tap loop, config-driven.
5. **Play Store launch.** Listing, data safety form, closed test with 12 or more testers for 14 days if required, then production.
6. **Backend.** Nakama, weekend Star tournament, score checks.
7. **iOS.** Same code, iOS build, IAP and consent checks on device, App Store submission.
8. **More languages.** One with diacritics first to prove the pack design.

## 12. Spike list (unverified)

Confirm these early, do not assume them:

- Bun workspaces plus Metro resolves `packages/core` correctly in the Expo app.
- Reanimated and Gesture Handler performance on a low-end Android under the New Architecture. Reanimated's docs describe regressions that need specific mitigations.
- Accepted-word set load time and memory on device. Choose a compact format (packed trie or sorted string array).
- Nakama JavaScript client works cleanly in React Native.
- Current Expo SDK version and its default `targetSdkVersion` when scaffolding.
- Licence review for every word source before shipping.