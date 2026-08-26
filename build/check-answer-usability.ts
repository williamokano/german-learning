/**
 * check-answer-usability — catches gap answers a learner cannot possibly type.
 *
 * Two defects, both invisible to every other gate because the YAML is
 * structurally perfect:
 *
 *   KEY-PAREN   The expected answer carries an explanation inside it, e.g.
 *               "en (einen)" or "Sie muss ins Krankenhaus (gehen)." Grading is
 *               exact match after normalize(), so writing the correct answer
 *               scores zero. A parenthesis is fine inside one of several
 *               listed alternatives — there the plain form is also accepted —
 *               so only scalar answers are flagged.
 *
 *   NO-CHANGE   An error-hunt item whose hint "(X → ?)" names the very word the
 *               answer restores, so the "corrected" sentence is the original.
 *               The learner has nothing to find.
 *
 *   DOUBLE-ART  The answer already carries the article — as a contraction
 *               ("vom", "zum") or as preposition + article ("aus dem") — and
 *               the frame repeats it, so the sentence renders "vom dem Arzt"
 *               or "aus dem dem Supermarkt". A bare article answer followed by
 *               another article is NOT flagged: that is an ordinary relative
 *               clause ("die Frau, die die beste Pasta kocht").
 *
 * Usage: tsx build/check-answer-usability.ts --all
 *        tsx build/check-answer-usability.ts <lesson-dir> [...]
 */
import fs from 'node:fs';
import path from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../web/node_modules/yaml/dist/index.js';

const ROOT = path.resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'THEMEN', 'SITUATIONEN'];

function lessonDirs(): string[] {
  const out: string[] = [];
  for (const level of LEVELS) {
    const dir = path.join(ROOT, level);
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir)) {
      const p = path.join(dir, entry);
      if (fs.existsSync(path.join(p, 'exercises.yml'))) out.push(p);
    }
  }
  return out.sort();
}

const EXPLANATION = /\s\([^)]*\p{L}[^)]*\)|^umstellen:/iu;
const ARTICLES = new Set(['der', 'die', 'das', 'den', 'dem', 'des']);
const CONTRACTION = /^(im|am|ins|ans|aufs|zum|zur|vom|beim|fürs|durchs|ums)$/i;

const args = process.argv.slice(2);
const dirs = args.includes('--all')
  ? lessonDirs()
  : args.map((a) => path.resolve(ROOT, a));

const problems: string[] = [];
let checked = 0;

for (const dir of dirs) {
  const file = path.join(dir, 'exercises.yml');
  if (!fs.existsSync(file)) continue;
  checked++;
  const doc = parse(fs.readFileSync(file, 'utf8')) as any;
  const rel = path.relative(ROOT, dir);

  for (const ex of doc?.exercises ?? []) {
    if (ex.type !== 'gap-text' && ex.type !== 'gap-bank') continue;
    const text: string = ex.text ?? '';
    for (const [key, value] of Object.entries(ex.answers ?? {})) {
      // A parenthesis inside a list is an accepted variant, not a trap.
      if (typeof value === 'string' && EXPLANATION.test(value)) {
        problems.push(`${rel} ${ex.id} answer "${key}": key contains an explanation — ${JSON.stringify(value)}`);
      }
      const first = String(Array.isArray(value) ? value[0] : value);
      const line = text.split('\n').find((l) => l.includes(`{${key}}`)) ?? '';
      const hint = line.match(/\(([^()→]{1,40})\s*→\s*\?\)/);
      if (hint && hint[1].trim().toLowerCase() === first.trim().toLowerCase()) {
        problems.push(`${rel} ${ex.id} answer "${key}": hint "${hint[1].trim()}" is the answer — nothing to correct`);
      }

      const words = first.trim().split(/\s+/);
      const tail = (words[words.length - 1] ?? '').toLowerCase();
      const next = text.match(new RegExp(`\\{${key}\\}\\s+(\\S+)`));
      const nextWord = next?.[1].replace(/[.,!?;:]$/, '').toLowerCase() ?? '';
      if (ARTICLES.has(nextWord)) {
        // a contraction always swallows the article; prep + article only counts
        // when the very same article repeats (otherwise it is a relative clause)
        const doubled =
          CONTRACTION.test(first.trim()) ||
          (words.length > 1 && ARTICLES.has(tail) && tail === nextWord);
        if (doubled) {
          problems.push(`${rel} ${ex.id} answer "${key}": key ${JSON.stringify(first)} already carries the article, but "${nextWord}" follows the gap`);
        }
      }
    }
  }
}

if (problems.length) {
  console.error('[check-answer-usability] FAIL');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log(`[check-answer-usability] OK: ${checked} lesson(s) checked.`);
