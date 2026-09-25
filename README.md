# Word Wheel

A word wheel type game: spell words from a wheel of letters to fill a
crossword-style grid, plus bonus words for anything else valid you find.

See `Claude.md` for repo layout and `Plan.md` for the full product plan.

## Setup

```
bun install
```

## Core / tools (packages/core, packages/tools)

```
bun run build-pack     # build word pack
bun run generate       # generate a level pool
bun test                # run core unit tests
```

## Mobile app (apps/mobile)

```
cd apps/mobile
bun run start           # start Metro (dev client)
bun run android         # build + run on Android
```

Metro must be running (`bun run start`) for JS/TS changes to show up in the
running app — no rebuild needed for JS-only changes.
