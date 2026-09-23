/**
 * Debug-only ASCII grid printout (not shipped) — lets a human eyeball a
 * sample of generated levels for sanity: readable shape, sane crossings,
 * wheel letters used.
 */
import type { Level } from "../../core/src/types.js";

export function renderAscii(level: Level): string {
  const cells: string[][] = Array.from({ length: level.grid.rows }, () =>
    Array.from({ length: level.grid.cols }, () => "."),
  );
  for (const p of level.grid.words) {
    for (let i = 0; i < p.w.length; i++) {
      const x = p.dir === "H" ? p.x + i : p.x;
      const y = p.dir === "H" ? p.y : p.y + i;
      cells[y]![x] = p.w[i]!;
    }
  }

  const lines = cells.map((row) => row.join(" "));
  const header = `${level.id}  band ${level.band}  wheel [${level.wheel.join("")}]  difficulty ${level.difficulty}  ${level.grid.cols}x${level.grid.rows}`;
  return [header, ...lines].join("\n");
}

async function main() {
  const { loadLevelsFromArgs } = await import("./cli-shared.js");
  const { levels, sampleSize } = await loadLevelsFromArgs(process.argv.slice(2), 10);
  const sample = levels.slice(0, sampleSize);
  for (const level of sample) {
    console.log(renderAscii(level));
    console.log("");
  }
  console.log(`Printed ${sample.length} of ${levels.length} levels.`);
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
