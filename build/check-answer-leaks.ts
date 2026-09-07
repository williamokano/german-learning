#!/usr/bin/env tsx
/**
 * check-answer-leaks.ts — finds exercises that hand the learner the answer.
 *
 * Two ways a gap can leak, both of which the other gates pass happily:
 *
 *   1. A gap-bank answer already stands in the same line as its own gap:
 *        — Ich buche Sie auf den Flug um 18:40 {4}.        answer 4: UM
 *      The learner reads "um" two words earlier and fills it in without
 *      understanding the separable verb the item is drilling.
 *
 *   2. A gap-text hint names the answer:
 *        4. Ich habe eine {4} gegen Nüsse. (Allergie)      answer 4: Allergie
 *      Nothing is being retrieved. This is distinct from a legitimate
 *      conjugation cue — "(müssen, wir-Form)" for the answer "müssen" is the
 *      whole point of that item, so hints naming a grammatical form are
 *      skipped.
 *
 * NOT wired into CI, deliberately. Over the older A1–C1 lessons the same-line
 * check fires on hundreds of short function words (ein, und, mit, die) that
 * are harmless inside a long dialogue line, so as a blocking gate it would be
 * noise. It earns its keep run over a directory while writing a set:
 *
 *   npx tsx build/check-answer-leaks.ts SITUATIONEN/33-am-flughafen-b1
 *   npx tsx build/check-answer-leaks.ts --all         # report only, exits 0
 *
 * Read every hit before acting on it — some are the exercise working as
 * intended (an inseparable verb whose Partizip equals its infinitive, for
 * instance, is exactly what `belaufen → belaufen` is teaching).
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse as parseYaml } from '../web/node_modules/yaml/dist/index.js';
import { ExerciseSet } from '../web/src/core/content/schema.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

/** A hint naming a grammatical form is a cue, not a leak. */
const FORM_HINT =
  /-?Form|Präsens|Präteritum|Perfekt|Partizip|Infinitiv|Plural|Singular|Passiv|Konjunktiv|Imperativ|Akkusativ|Dativ|Nominativ|Genitiv|trennbar|Vorsilbe|Hilfsverb|reflexiv|verneint|Komparativ|Superlativ/i;

/** Short words carry no information in a long dialogue line — pure noise. */
const MIN_SAME_LINE = 4;
/** Below this a hint match says nothing either. */
const MIN_HINT = 3;

const word = (w: string) =>
  new RegExp(`(?<![\\wÄÖÜäöüß])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\wÄÖÜäöüß])`, 'i');

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
    console.error('Usage: tsx build/check-answer-leaks.ts <dir> | --all');
    process.exit(1);
  }

  let found = 0;
  for (const dir of dirs) found += checkLesson(dir);
  console.log(`\n[check-answer-leaks] ${found} possible leak(s) across ${dirs.length} lesson(s) — review each by hand.`);
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
  if (!existsSync(ymlPath)) return 0;

  const result = ExerciseSet.safeParse(parseYaml(readFileSync(ymlPath, 'utf8')));
  if (!result.success) return 0; // schema is gen-exercises.ts's job

  let found = 0;
  for (const ex of result.data.exercises) {
    const e = ex as { id: string; type: string; text?: string; answers?: Record<string, unknown> };
    if (typeof e.text !== 'string' || !e.answers) continue;
    const where = `${relative(REPO_ROOT, ymlPath)} [${e.id}]`;

    for (const line of e.text.split('\n')) {
      const gaps = [...line.matchAll(/\{(\d+)\}/g)].map(m => m[1]);
      if (gaps.length === 0) continue;

      if (e.type === 'gap-bank') {
        const visible = line.replace(/\{\d+\}/g, ' ');
        for (const n of gaps) {
          const ans = e.answers[n];
          if (typeof ans !== 'string' || ans.length < MIN_SAME_LINE) continue;
          if (word(ans).test(visible)) {
            found++;
            console.log(`[check-answer-leaks] ${where} gap ${n}: ${JSON.stringify(ans)} already stands in the same line`);
          }
        }
      }

      if (e.type === 'gap-text' || e.type === 'table-fill') {
        const hint = line.trim().match(/\(([^)]*)\)\s*$/)?.[1];
        if (!hint || FORM_HINT.test(hint)) continue;
        for (const n of gaps) {
          const ans = e.answers[n];
          if (typeof ans !== 'string' || ans.length < MIN_HINT) continue;
          if (word(ans).test(hint)) {
            found++;
            console.log(`[check-answer-leaks] ${where} gap ${n}: hint "(${hint})" names the answer ${JSON.stringify(ans)}`);
          }
        }
      }
    }
  }
  return found;
}

main();
