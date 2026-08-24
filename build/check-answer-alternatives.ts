#!/usr/bin/env tsx
/**
 * check-answer-alternatives.ts — flags answers that spell alternatives inline.
 *
 * Grading compares the learner's input against the expected string (or, when
 * the answer is a YAML list, against every entry). An answer written as
 *
 *     "1": "Wie heißen Sie? / Wie ist Ihr Name?"
 *
 * therefore accepts nothing but that literal slash-joined string: a learner who
 * types one of the two correct answers is marked wrong. The list form is the
 * mechanism that exists for this:
 *
 *     "1":
 *       - "Wie heißen Sie?"
 *       - "Wie ist Ihr Name?"
 *
 * Flags any typed-in answer (gap-text, gap-bank, table-fill) containing a
 * spaced slash. Spaced, so real answers that carry a slash inside a token
 * ("Bürokauffrau/-mann", "km/h") pass untouched.
 *
 * Usage (from repo root):
 *   npx tsx build/check-answer-alternatives.ts A1/01-erste-kontakte
 *   npx tsx build/check-answer-alternatives.ts --all                 # CI
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

/** " / " — a slash with space around it reads as "or", not as part of a word. */
const INLINE_ALTERNATIVE = /\s\/\s/;

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
    console.error('Usage: tsx build/check-answer-alternatives.ts <dir> | --all');
    process.exit(1);
  }

  let flagged = 0;
  for (const dir of dirs) flagged += checkLesson(dir);

  if (flagged > 0) {
    console.error(
      `\n[check-answer-alternatives] ${flagged} answer(s) spell alternatives inline. ` +
      `Write them as a YAML list so each one grades as correct.`,
    );
    process.exit(1);
  }
  console.log(`[check-answer-alternatives] OK: ${dirs.length} lesson(s) checked.`);
}

function findAllLessonDirs(): string[] {
  const dirs: string[] = [];
  for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'EXTRA']) {
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

/** Every typed-in answer in an exercise, as (ref, value) pairs. */
function typedAnswers(ex: { type: string } & Record<string, unknown>): Array<[string, string]> {
  if (ex.type !== 'gap-text' && ex.type !== 'gap-bank' && ex.type !== 'table-fill') return [];
  const answers = ex.answers as Record<string, string | string[]> | undefined;
  if (!answers) return [];
  const out: Array<[string, string]> = [];
  for (const [ref, value] of Object.entries(answers)) {
    // A list is already the alternatives form — nothing to flag.
    if (Array.isArray(value)) continue;
    out.push([ref, value]);
  }
  return out;
}

function checkLesson(dir: string): number {
  const ymlPath = join(dir, 'exercises.yml');
  if (!existsSync(ymlPath)) {
    console.error(`[check-answer-alternatives] No exercises.yml in ${dir}`);
    return 1;
  }

  const result = ExerciseSet.safeParse(parseYaml(readFileSync(ymlPath, 'utf8')));
  // Schema validity is gen-exercises.ts's job; skip silently here.
  if (!result.success) return 0;

  let flagged = 0;
  for (const ex of result.data.exercises) {
    for (const [ref, value] of typedAnswers(ex as never)) {
      if (!INLINE_ALTERNATIVE.test(value)) continue;
      flagged++;
      console.error(
        `[check-answer-alternatives] ${relative(REPO_ROOT, ymlPath)} [${ex.id}] ` +
        `answer "${ref}": ${JSON.stringify(value)}`,
      );
    }
  }
  return flagged;
}

main();
