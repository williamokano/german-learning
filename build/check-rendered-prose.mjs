#!/usr/bin/env node
/**
 * check-rendered-prose — scans the BUILT lesson pages (web/dist/<level>/<lesson>/
 * index.html) for markdown that failed to render and shows up as raw text in the
 * reading view (issue #477):
 *
 *   TABLE     a "|---|" separator row — a table broke (e.g. an unescaped "|")
 *   BOLD      a literal "**" — unbalanced or escaped emphasis
 *   GAP       a "{3}" placeholder — exercise syntax used in lesson prose
 *   BACKTICK  a literal "`" — unbalanced inline code
 *
 * Only text inside the lesson prose sections is checked (not scripts, styles,
 * attributes or code blocks). Run after `pnpm -C web build`:
 *
 *   node build/check-rendered-prose.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = resolve(dirname(fileURLToPath(import.meta.url)), '../web/dist');
const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1'];
const RULES = [
  ['TABLE', /\|\s*-{3,}\s*\|/],
  ['BOLD', /\*\*/],
  ['GAP', /\{\d+\}/],
  ['BACKTICK', /`/],
];

if (!existsSync(DIST)) {
  console.error('[check-rendered-prose] web/dist not found — run `pnpm -C web build` first');
  process.exit(2);
}

/** Visible text of the prose sections: drop code/pre/script/style, then tags. */
function proseText(html) {
  const sections = [...html.matchAll(/<section class="prose[^"]*"[^>]*>([\s\S]*?)<\/section>/g)].map(m => m[1]);
  return sections.join('\n')
    .replace(/<(script|style|pre|code)\b[\s\S]*?<\/\1>/g, ' ')
    .replace(/<sup class="chunk-mark"[^>]*>[\s\S]*?<\/sup>/g, ' ')  // rendered marks, not raw markdown
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

const problems = [];
let pages = 0;
for (const level of LEVELS) {
  const dir = join(DIST, level);
  if (!existsSync(dir)) continue;
  for (const lesson of readdirSync(dir)) {
    const file = join(dir, lesson, 'index.html');
    if (!existsSync(file)) continue;
    pages++;
    const text = proseText(readFileSync(file, 'utf8'));
    for (const [name, re] of RULES) {
      const m = re.exec(text);
      if (m) problems.push(`${level}/${lesson}: ${name} — …${text.slice(Math.max(0, m.index - 40), m.index + 30).replace(/\s+/g, ' ')}…`);
    }
  }
}

if (problems.length) {
  console.error(`[check-rendered-prose] FAIL: ${problems.length} problem(s)`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log(`[check-rendered-prose] OK: ${pages} lesson page(s) checked.`);
