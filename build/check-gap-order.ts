#!/usr/bin/env tsx
/**
 * check-gap-order.ts — flags gap placeholders that do not run 1, 2, 3 … in
 * reading order.
 *
 * gap-text, gap-bank and table-fill place their blanks with {n} markers in the
 * body text and key the answers by the same n. Nothing forces the markers to
 * appear in order, so a hand-written set can end up like
 *
 *     3. Die Garderobe ist {5} Erdgeschoss, gleich {4} dem Eingang.
 *
 * which renders fine and grades fine, but numbers the learner's inputs out of
 * order — the fourth box on screen is labelled 5. It is invisible in review and
 * has slipped through four times, so it gets a gate.
 *
 * Flags three things per exercise:
 *   - markers that are not in ascending order in the text
 *   - markers that do not start at 1 or skip a number
 *   - answer keys with no marker in the text, and markers with no answer
 *
 * Usage (from repo root):
 *   npx tsx build/check-gap-order.ts SITUATIONEN/26-im-museum-a2
 *   npx tsx build/check-gap-order.ts --all                          # CI
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// Direct path imports so this script works from the repo root without
// a root-level node_modules. yaml and zod both live in web/node_modules.
import { parse as parseYaml } from '../web/node_modules/yaml/dist/index.js';
import { ExerciseSet } from '../web/src/core/content/schema.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

/** {1}, {12} — the placeholder the widgets replace with an input. */
const GAP_MARKER = /\{(\d+)\}/g;

function main() {
  const argv = process.argv.slice(2);
  const allMode = argv.includes('--all');
  const positional = argv.filter(a => !a.startsWith('--'));

  let dirs: string[];
  if (allMode) {
    dirs = findAllLessonDirs();
  } else if (positional.length > 0) {
    dirs = positional.map(d => resolve(REPO_ROOT, d));
  } else {
    console.error('Usage: tsx build/check-gap-order.ts <dir> | --all');
    process.exit(1);
  }

  let flagged = 0;
  for (const dir of dirs) flagged += checkLesson(dir);

  if (flagged > 0) {
    console.error(
      `\n[check-gap-order] ${flagged} gap block(s) are numbered wrong. ` +
      `Renumber the {n} markers so they run 1, 2, 3 … in reading order.`,
    );
    process.exit(1);
  }
  console.log(`[check-gap-order] OK: ${dirs.length} lesson(s) checked.`);
}

function findAllLessonDirs(): string[] {
  const dirs: string[] = [];
  for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'THEMEN', 'SITUATIONEN', 'HOEREN']) {
    const levelDir = join(REPO_ROOT, level);
    if (!existsSync(levelDir)) continue;
    for (const entry of readdirSync(levelDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const d = join(levelDir, entry.name);
      if (existsSync(join(d, 'exercises.yml'))) dirs.push(d);
    }
  }
  return dirs.sort();
}

function checkLesson(dir: string): number {
  const ymlPath = join(dir, 'exercises.yml');
  if (!existsSync(ymlPath)) {
    console.error(`[check-gap-order] No exercises.yml in ${dir}`);
    return 1;
  }

  const result = ExerciseSet.safeParse(parseYaml(readFileSync(ymlPath, 'utf8')));
  // Schema validity is gen-exercises.ts's job; skip silently here.
  if (!result.success) return 0;

  let flagged = 0;
  for (const ex of result.data.exercises) {
    const e = ex as { id: string; type: string; text?: string; answers?: Record<string, unknown> };
    if (e.type !== 'gap-text' && e.type !== 'gap-bank' && e.type !== 'table-fill') continue;
    if (typeof e.text !== 'string' || !e.answers) continue;

    const where = `${relative(REPO_ROOT, ymlPath)} [${e.id}]`;
    const seen = [...e.text.matchAll(GAP_MARKER)].map(m => Number(m[1]));
    const problems: string[] = [];

    for (let i = 1; i < seen.length; i++) {
      if (seen[i] < seen[i - 1]) {
        problems.push(`{${seen[i]}} appears after {${seen[i - 1]}}`);
        break; // one report per block is enough to send someone to the file
      }
    }

    const expected = Array.from({ length: seen.length }, (_, i) => String(i + 1));
    const sorted = [...seen].map(String).sort((a, b) => Number(a) - Number(b));
    if (sorted.join(',') !== expected.join(',')) {
      problems.push(`markers are ${sorted.join(', ')} — expected 1…${seen.length}`);
    }

    const answerKeys = Object.keys(e.answers);
    const markerSet = new Set(seen.map(String));
    const orphanAnswers = answerKeys.filter(k => !markerSet.has(k));
    const orphanMarkers = [...markerSet].filter(m => !answerKeys.includes(m));
    if (orphanAnswers.length) problems.push(`answer key(s) with no marker: ${orphanAnswers.join(', ')}`);
    if (orphanMarkers.length) problems.push(`marker(s) with no answer: ${orphanMarkers.join(', ')}`);

    if (problems.length) {
      flagged++;
      console.error(`[check-gap-order] ${where} ${problems.join('; ')}`);
    }
  }
  return flagged;
}

main();
