#!/usr/bin/env tsx
/**
 * check-answer-balance.ts — flags single-choice blocks with a skewed answer key.
 *
 * If one option letter (a/b/c/…) is correct for most items in a single-choice
 * block, the exercise is gameable by always picking that letter without
 * reading the question — this silently defeats the "corrects your answers and
 * gives you a score" guarantee the whole exercise engine exists to provide.
 *
 * Flags any single-choice block with >= 4 items where one letter accounts for
 * more than THRESHOLD of the correct answers. Fix by reordering that item's
 * `options` array (keep the texts and `why`, just change which position holds
 * the correct one) so the answer key varies roughly evenly across letters.
 *
 * Usage (from repo root):
 *   npx tsx build/check-answer-balance.ts A1/01-erste-kontakte   # single lesson
 *   npx tsx build/check-answer-balance.ts --all                  # every lesson (CI)
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

const THRESHOLD = 0.7; // a letter holding >70% of a block's answers is flagged
const MIN_ITEMS = 4;   // blocks shorter than this are too small to judge

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
    console.error('Usage: tsx build/check-answer-balance.ts <dir> | --all');
    process.exit(1);
  }

  let flagged = 0;
  for (const dir of dirs) {
    flagged += checkLesson(dir);
  }

  if (flagged > 0) {
    console.error(`\n[check-answer-balance] ${flagged} skewed single-choice block(s) found.`);
    process.exit(1);
  }
  console.log(`[check-answer-balance] OK: ${dirs.length} lesson(s) checked, no skew >= ${Math.round(THRESHOLD * 100)}%.`);
}

function findAllLessonDirs(): string[] {
  const dirs: string[] = [];
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'THEMEN', 'SITUATIONEN', 'HOEREN'];
  for (const level of levels) {
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
    console.error(`[check-answer-balance] No exercises.yml in ${dir}`);
    return 1;
  }

  const raw = parseYaml(readFileSync(ymlPath, 'utf8'));
  const result = ExerciseSet.safeParse(raw);
  if (!result.success) {
    // Schema validity is gen-exercises.ts's job; skip silently here.
    return 0;
  }

  let flagged = 0;
  for (const ex of result.data.exercises) {
    if (ex.type !== 'single-choice') continue;
    if (ex.items.length < MIN_ITEMS) continue;

    const counts = new Map<string, number>();
    for (const item of ex.items) {
      counts.set(item.answer, (counts.get(item.answer) ?? 0) + 1);
    }

    for (const [letter, count] of counts) {
      const share = count / ex.items.length;
      if (share > THRESHOLD) {
        flagged++;
        const rel = relative(REPO_ROOT, ymlPath);
        const dist = ex.items.map(i => i.answer).join(', ');
        console.error(
          `[check-answer-balance] ${rel} [${ex.id}] ${count}/${ex.items.length} answers are "${letter}" ` +
          `(${Math.round(share * 100)}%) — distribution: ${dist}`,
        );
      }
    }
  }
  return flagged;
}

main();
