# CLAUDE.md

Android-first word wheel game. Expo (React Native), TypeScript, Bun workspaces. iOS later.
Design lives in PLAN.md. Do not import it. Read only the section the task needs.
Current phase: 0 (generator spike). Update this line when a phase gate passes.

## Commands

- `bun install`
- `bun run check`: typecheck, lint and tests. IMPORTANT: run it and fix failures before reporting any task done.
- `bun test`: unit and property tests for core and tools
- `bun run gen -- --lang en --count 1000 --report`: generate levels, print the variety and difficulty report
- `cd apps/mobile && bunx expo start --dev-client`: Metro for a development build (not yet scaffolded — Phase 1)

`check` and `gen` landed in Phase 0. `gen` downloads and caches SCOWL under `data/build/.cache` on first run (network required once; cached after).

## Layout

- `packages/core`: pure TypeScript, runs under Bun and on Hermes in the app
- `packages/tools`: offline Bun scripts (word pipeline, level generation, reports)
- `apps/mobile`: Expo app, Android first, portrait only
- `data/build`: generated output, gitignored, reproducible from tools
- `docs`: one short design note per phase

## Core rules (packages/core)

- No UI code in this package: no React, no DOM, no Node built-ins. The app itself (`apps/mobile`) is React Native and imports this package.
- Letters are tiles: Unicode strings from the language pack, never single chars and never assumed A to Z. Text is NFC.
- Generation is deterministic from a seed. Never use `Math.random`.
- Never reject a word that is in the accepted set.
- Repetition cooldowns apply to lemmas, not surface forms.
- A grid holds at most one inflected form per lemma.
- Every generator invariant has a property-based test: grid words spellable from the wheel, grid connected, no accidental adjacent words, no profanity.
- Bonus words are computed at runtime from the accepted set. Do not store them in level files.
- Unicode normalisation and casing may differ on Hermes. Test on device before relying on them for non-English packs.

## Mobile rules (apps/mobile)

- Ads and purchases need a development build. Expo Go does not work.
- The UI never imports ad or purchase SDKs directly. All native calls go through `PlatformServices`.
- Keep the `react-native-worklets/plugin` Babel plugin last in the plugins array.
- Use test ad unit IDs unless building a release.
- After any Expo SDK change, check `targetSdkVersion`. Google Play requires API 36 for new apps and updates.
- API 36 enforces edge-to-edge and changes back handling. Test on Android 16.
- Performance work is only done once it is checked on a real low-end Android phone.

## Workflow

- Before each phase in PLAN.md: write a short design note in `docs/`, wait for sign-off, then implement.
- Do not paste large word lists into context. Use scripts and print summaries.
- Record the licence of every word source in the pack metadata.
- Formatting and style are enforced by lint config, not by this file.

## Ask first

- Adding or upgrading a native dependency, or changing the Expo SDK version
- Starting a cloud build (EAS) or anything that costs money
- Adding or changing a word source, because each has its own licence
- Hand-editing anything in `data/build`. Regenerate it instead.
- Adding any art, font or audio asset. Record its source and licence in `assets/LICENSES.md`.

## Secrets and signing

- IMPORTANT: never commit keystores, `.env` files, or service and server keys. Use test ad unit IDs in development builds.

## Git

- Commit after each completed task step. Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`), with the message explaining why.
- No force pushes and no history rewriting.