# Known issues

One line each. Not exhaustive — just things flagged during work and not yet resolved or verified.

- ~~Header text is clipped by the settings gear icon on the game screen~~ — **fixed and confirmed in Phase 2**: the header was rebuilt as a real flex row (`GameHeader.tsx`) instead of an absolutely-positioned icon over full-width text; verified on a real device with no overlap at "Chapter 1 · 2" and longer titles.
- Retry rate isn't instrumented in the generator: `gen.ts` only records overall success/failure per level, not how many of the up-to-200 attempts inside `generateLevel` were consumed per success.
- No property-based testing library is installed; the section 7 validation "tests" in `generator.test.ts` are a fixed-seed loop of 20 samples, not real property tests with shrinking.
- Section 14's "downloaded level pools go in a folder excluded from Android auto-backup" isn't implemented: Phase 2 still bundles fixed level data in the app, there's no pool-download flow yet, so there's no downloaded-pools folder to exclude. Revisit when pool downloading exists.
- `GameScreen` picks a fresh level via `pickCurrentLevel()` on every mount, so navigating away from an in-progress level (e.g. to Settings or Shop) and back re-rolls a new level instead of resuming the one in progress. Only completing a level or the very first entry should advance; needs an explicit "in-progress level" persisted in state (or SQLite) rather than re-picking on remount.
- The first-run tutorial (`TutorialScreen.tsx`) is a static 4-step text walkthrough, not the "guided levels" Plan.md section 12 describes (actual swiping/shuffling/hints inside a real level). Scoped down for the Phase 2 gate; revisit for a truly interactive tutorial.
- Sound effects (`packages/tools/src/gen-sounds.ts`) are synthesized placeholder sine tones, not real sound design.
- The word-language picker only ever lists English, since only one word pack (`en`) exists — untested with more than one language.
