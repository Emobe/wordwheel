/**
 * One-off generator for placeholder sound effects (word found, level
 * complete, wrong selection) as raw sine-tone WAV files, so the app has
 * real, playable audio instead of a silent stub. No audio-editing
 * dependency needed — WAV is simple enough to write by hand. Replace with
 * real sound design later (Plan.md section 18's "textures, backgrounds and
 * art" territory extends to audio too).
 *
 * Usage: bun run packages/tools/src/gen-sounds.ts
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SAMPLE_RATE = 44100;

function writeWav(samples: Float32Array): Buffer {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * bytesPerSample, 28); // byte rate
  buffer.writeUInt16LE(bytesPerSample, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]!));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * bytesPerSample);
  }
  return buffer;
}

/** A short envelope-shaped tone (or sequence of tones), to avoid clicks at start/end. */
function tone(freqs: number[], durationEach: number, gain = 0.3): Float32Array {
  const samplesPerTone = Math.floor(SAMPLE_RATE * durationEach);
  const out = new Float32Array(samplesPerTone * freqs.length);
  freqs.forEach((freq, toneIndex) => {
    for (let i = 0; i < samplesPerTone; i++) {
      const t = i / SAMPLE_RATE;
      const envelope = Math.sin((Math.PI * i) / samplesPerTone); // fade in/out, no click
      out[toneIndex * samplesPerTone + i] = Math.sin(2 * Math.PI * freq * t) * envelope * gain;
    }
  });
  return out;
}

async function main() {
  const outDir = path.resolve(import.meta.dir, "../../../apps/mobile/assets/sounds");
  await mkdir(outDir, { recursive: true });

  const sounds: Record<string, Float32Array> = {
    // Rising two-note chime for a found word.
    "word-found.wav": tone([660, 880], 0.09),
    // Bright three-note ascending run for level complete.
    "level-complete.wav": tone([523, 659, 784], 0.12),
    // Low short buzz for a wrong/invalid selection.
    "wrong.wav": tone([180], 0.15, 0.25),
  };

  for (const [name, samples] of Object.entries(sounds)) {
    const wav = writeWav(samples);
    await writeFile(path.join(outDir, name), wav);
    console.log(`Wrote ${name} (${(wav.length / 1024).toFixed(1)} KB)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
