#!/usr/bin/env tsx
/**
 * strip-lesson.ts — strip inline Astro/MDX components from lesson.md(x) for PDF/print
 *
 * Transforms:
 *   <AudioPlay src="x">label</AudioPlay>  →  label
 *   <AudioPlay src="x" />                 →  (removed, or 🎧 with --keep-audio-glyph)
 *   <details>…</details>                  →  left intact
 *   everything else                       →  unchanged
 *
 * Usage (from repo root):
 *   npx tsx build/strip-lesson.ts A1/01-erste-kontakte/lesson.mdx
 *   npx tsx build/strip-lesson.ts A1/01-erste-kontakte/lesson.mdx --keep-audio-glyph
 *   npx tsx build/strip-lesson.ts A1/01-erste-kontakte/lesson.mdx -o lesson.print.md
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

function stripLesson(source: string, keepAudioGlyph: boolean): string {
  let out = source;

  // <AudioPlay src="..." ...>label</AudioPlay>  →  label
  out = out.replace(/<AudioPlay[^>]+>([^<]*)<\/AudioPlay>/g, '$1');

  // <AudioPlay src="..." ... />  →  🎧 or removed
  out = out.replace(/<AudioPlay[^/]*\/>/g, keepAudioGlyph ? '🎧' : '');

  // Clean up double-spaces left where bare AudioPlay was removed inline
  if (!keepAudioGlyph) {
    out = out.replace(/  +/g, ' ');
    out = out.replace(/ +\n/g, '\n');
    // Remove lines that became empty after stripping
    out = out.replace(/^\s*\n/gm, (m, offset, str) => {
      const prev = str[offset - 1];
      return prev === '\n' ? '' : m;
    });
  }

  return out;
}

function main() {
  const argv = process.argv.slice(2);
  const keepGlyph = argv.includes('--keep-audio-glyph');
  const outIdx = argv.indexOf('-o');
  let outFile: string | undefined;
  if (outIdx !== -1 && argv[outIdx + 1]) {
    outFile = argv[outIdx + 1];
  }
  const positional = argv.filter(a => !a.startsWith('-') && a !== argv[outIdx + 1]);

  if (positional.length === 0) {
    console.error('Usage: tsx build/strip-lesson.ts <lesson.md(x)> [--keep-audio-glyph] [-o output.md]');
    process.exit(1);
  }

  const inputPath = resolve(REPO_ROOT, positional[0]);
  const source = readFileSync(inputPath, 'utf8');
  const stripped = stripLesson(source, keepGlyph);

  if (outFile) {
    const dest = resolve(dirname(inputPath), outFile);
    writeFileSync(dest, stripped);
    console.log(`[strip-lesson] wrote: ${dest}`);
  } else {
    // Default: write to <name>.print.md in same dir
    const base = basename(inputPath).replace(/\.(md|mdx)$/, '.print.md');
    const dest = join(dirname(inputPath), base);
    writeFileSync(dest, stripped);
    console.log(`[strip-lesson] wrote: ${dest}`);
  }
}

main();
