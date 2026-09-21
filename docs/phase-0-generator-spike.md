# Phase 0: Generator Spike

English only, Bun only. No app, no UI. Goal is to prove the generator works and the word data pipeline is trustworthy before any native code is written.

## Scope

- Bun workspace monorepo: `packages/core`, `packages/tools`, `apps/mobile` (empty placeholder), root `package.json` with `check` and `gen` scripts.
- English language pack builder (`packages/tools`): builds accepted-word set and target-word tiers from SCOWL, records SCOWL's licence in pack metadata, carries SCOWL's taboo list as the starting profanity list.
- Deterministic level generator (`packages/core`): seeded PRNG only, no `Math.random`, per PLAN.md section 5.
- ASCII grid renderer (`packages/tools`) for eyeballing individual levels.
- Variety report and difficulty histogram over 1,000 generated levels, printed by `bun run gen -- --lang en --count 1000 --report`.
- Property-based tests (`bun test`) for the invariants listed in CLAUDE.md: grid words spellable from the wheel, grid connected, no accidental adjacent words, no profanity, at most one inflected form per lemma per grid.

## Out of scope

- Any Expo/React Native code.
- Ads, purchases, PlatformServices.
- Any language other than English.
- On-device generation.

## Open questions before implementing

1. **SCOWL size levels to include** — which size cutoff(s) map to target-word tiers vs. the full accepted set. This is a word-source decision and needs a call before the pipeline is built.
2. **Seeded PRNG choice** — a small, dependency-free algorithm (e.g. mulberry32 or xoshiro128**) implemented directly in `packages/core`, so core stays free of npm dependencies.
3. **Lemma map source for English** — plan lists a lemma map as part of every pack but doesn't name a source for English inflection data. Likely a small rule-based stemmer plus an exceptions list, decided during implementation.
4. **Trie representation** — in-memory trie built at generation time from the accepted set; packed/compact on-device format is deferred to the Phase 1 mobile spike (PLAN.md section 12).

## Gate to exit Phase 0

- `bun run gen -- --lang en --count 1000 --report` completes with an acceptable success rate and time per level.
- Variety report: distinct wheels, distinct grid lemmas vs. total slots, longest gap before any repeat — numbers look sane for 1,000 levels.
- Difficulty histogram looks like a reasonable spread across the tier bands in PLAN.md section 7, not clumped at one end.
- `bun run check` (typecheck, lint, tests) passes.
