/**
 * check-cue-equals-answer — authoring aid, deliberately NOT in CI.
 *
 * Reports every gap whose parenthetical cue is word-for-word the expected
 * answer, on a line with no other gap to carry the work:
 *
 *     „Es war teuer. {1} kauften wir es nicht." (deshalb)      → key "Deshalb"
 *     Das ist der Ort, {1} wir uns kennengelernt haben. (wo)   → key "wo"
 *     → Neue Maßnahmen {1}. (wurden eingeführt)
 *
 * Not in CI because the same shape is legitimate when the cue names a verb and
 * the gap wants a *form* of it that happens to coincide with the infinitive:
 *
 *     Falls die Daten rechtzeitig {1} (vorliegen), schaffen wir es …
 *
 * and because a cue sometimes exists to pin one of several correct answers
 * ("der Ort, wo …" vs. "der Ort, an dem …"). So every hit needs a human
 * decision: delete the cue, or reword the item. Deleting them wholesale would
 * make some gaps unanswerable.
 *
 * Usage: tsx build/check-cue-equals-answer.ts --all
 *        tsx build/check-cue-equals-answer.ts <lesson-dir> [...]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../web/node_modules/yaml/dist/index.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'THEMEN', 'SITUATIONEN'];

const args = process.argv.slice(2);
const dirs = args.includes('--all')
  ? LEVELS.flatMap((level) => {
      const dir = path.join(ROOT, level);
      if (!fs.existsSync(dir)) return [];
      return fs
        .readdirSync(dir)
        .map((e) => path.join(dir, e))
        .filter((p) => fs.existsSync(path.join(p, 'exercises.yml')));
    }).sort()
  : args.map((a) => path.resolve(ROOT, a));

let hits = 0;
for (const dir of dirs) {
  const file = path.join(dir, 'exercises.yml');
  if (!fs.existsSync(file)) continue;
  const doc = parse(fs.readFileSync(file, 'utf8')) as any;
  for (const ex of doc?.exercises ?? []) {
    if (ex.type !== 'gap-text' && ex.type !== 'gap-bank') continue;
    const lines: string[] = (ex.text ?? '').split('\n');
    for (const [key, value] of Object.entries(ex.answers ?? {})) {
      const answer = String(Array.isArray(value) ? value[0] : value).trim().toLowerCase();
      if (answer.length < 2) continue;
      const line = lines.find((l) => l.includes(`{${key}}`));
      if (!line) continue;
      if ((line.match(/\{\w+\}/g) ?? []).length > 1) continue;
      for (const m of line.matchAll(/\(([^()]{1,60})\)/g)) {
        if (m[1].trim().toLowerCase() === answer) {
          console.log(`${path.relative(ROOT, dir)} ${ex.id} answer "${key}": cue (${m[1].trim()}) is the answer`);
          console.log(`    ${line.trim()}`);
          hits++;
        }
      }
    }
  }
}
console.log(`\n[check-cue-equals-answer] ${hits} hit(s) — each needs a human decision.`);
