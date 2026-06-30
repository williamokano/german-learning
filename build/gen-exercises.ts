#!/usr/bin/env tsx
/**
 * gen-exercises.ts — exercises.yml → exercises.md + solutions.md
 *
 * Usage (from repo root):
 *   npx tsx build/gen-exercises.ts A1/01-erste-kontakte     # single lesson
 *   npx tsx build/gen-exercises.ts --all                     # all lessons
 *   npx tsx build/gen-exercises.ts --all --check             # CI: fail on drift
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Direct path imports so this script works from the repo root without
// a root-level node_modules. yaml and zod both live in web/node_modules.
import { parse as parseYaml } from '../web/node_modules/yaml/dist/index.js';
import { ExerciseSet } from '../web/src/core/content/schema.ts';
import type {
  ExerciseSetType,
  ExerciseUnion,
  GapBankExercise,
  GapTextExercise,
  TableFillExercise,
  SingleChoiceExercise,
  TrueFalseExercise,
  MatchingExercise,
  CategorizeExercise,
  OddOneOutExercise,
  OrderExercise,
  FreeWriteExercise,
  SpeakingPromptExercise,
  ExamGridType,
} from '../web/src/core/content/schema.ts';

// ─── constants ───────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

const BLOCK_NAMES: Record<string, string> = {
  H: 'Hören',
  A: 'Basistraining',
  B: 'Vertiefung',
  C: 'Prüfungstraining',
  D: 'Wiederholung & Selbsttest',
};

const BLOCK_ORDER = ['H', 'A', 'B', 'C', 'D'];

// ─── main ────────────────────────────────────────────────────────────────────

function main() {
  const argv = process.argv.slice(2);
  const checkMode = argv.includes('--check');
  const allMode = argv.includes('--all');
  const positional = argv.filter(a => !a.startsWith('--'));

  let dirs: string[];
  if (allMode) {
    dirs = findAllLessonDirs();
  } else if (positional.length > 0) {
    dirs = positional.map(d => resolve(REPO_ROOT, d));
  } else {
    console.error('Usage: tsx build/gen-exercises.ts <dir> | --all [--check]');
    process.exit(1);
  }

  const explicit = !allMode; // named dirs are explicit; --all is not
  let failures = 0;
  for (const dir of dirs) {
    try {
      const ok = processLesson(dir, checkMode, explicit);
      if (!ok) failures++;
    } catch (e) {
      console.error(`[gen-exercises] ERROR: ${dir}: ${(e as Error).message}`);
      failures++;
    }
  }
  if (failures > 0) process.exit(1);
}

function findAllLessonDirs(): string[] {
  const dirs: string[] = [];
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];
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

function processLesson(dir: string, check: boolean, explicit = false): boolean {
  const ymlPath = join(dir, 'exercises.yml');
  if (!existsSync(ymlPath)) {
    console.error(`[gen-exercises] No exercises.yml in ${dir}`);
    return false;
  }

  const raw = parseYaml(readFileSync(ymlPath, 'utf8'));
  const result = ExerciseSet.safeParse(raw);
  if (!result.success) {
    console.error(`[gen-exercises] INVALID: ${ymlPath}`);
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    }
    return false;
  }
  const data = result.data;

  // partial: true marks a fixture-only yml (not the complete source yet).
  // --all skips it silently; direct invocation warns but continues.
  if (data.partial) {
    if (!explicit) {
      console.log(`[gen-exercises] SKIP (partial): ${dir}`);
      return true;
    }
    console.warn(`[gen-exercises] WARNING: ${dir} is marked partial — exercises.md may be incomplete.`);
  }

  const exMd = renderExercisesMd(data);
  const solMd = renderSolutionsMd(data);

  const exPath = join(dir, 'exercises.md');
  const solPath = join(dir, 'solutions.md');

  if (check) {
    let ok = true;
    if (!existsSync(exPath) || readFileSync(exPath, 'utf8') !== exMd) {
      console.error(`[gen-exercises] DRIFT: ${exPath}`);
      ok = false;
    }
    if (!existsSync(solPath) || readFileSync(solPath, 'utf8') !== solMd) {
      console.error(`[gen-exercises] DRIFT: ${solPath}`);
      ok = false;
    }
    if (ok) console.log(`[gen-exercises] OK: ${dir}`);
    return ok;
  }

  writeFileSync(exPath, exMd);
  writeFileSync(solPath, solMd);
  console.log(`[gen-exercises] wrote: ${exPath} ${solPath}`);
  return true;
}

// ─── exercises.md ────────────────────────────────────────────────────────────

function renderExercisesMd(data: ExerciseSetType): string {
  const lines: string[] = [];

  lines.push(`# ${data.title}`);
  lines.push('');

  if (data.intro) {
    lines.push(data.intro.trim());
    lines.push('');
  }

  const isExam = data.exercises.some(e => e.block === 'exam');

  if (!isExam) {
    const grouped = groupByBlock(data.exercises);
    for (const block of BLOCK_ORDER) {
      const exs = grouped.get(block);
      if (!exs) continue;
      lines.push('---');
      lines.push('');
      lines.push(`# Block ${block} — ${BLOCK_NAMES[block]}`);
      lines.push('');
      for (const ex of exs) {
        lines.push(...renderExerciseMd(ex));
      }
    }
  } else {
    lines.push('---');
    lines.push('');
    for (const ex of data.exercises) {
      lines.push(...renderExerciseMd(ex));
    }
  }

  return lines.join('\n').trimEnd() + '\n';
}

function groupByBlock(exercises: ExerciseUnion[]): Map<string, ExerciseUnion[]> {
  const map = new Map<string, ExerciseUnion[]>();
  for (const ex of exercises) {
    if (!map.has(ex.block)) map.set(ex.block, []);
    map.get(ex.block)!.push(ex);
  }
  return map;
}

function renderExerciseMd(ex: ExerciseUnion): string[] {
  const lines: string[] = [];

  const recycled = (ex as any).recycledFrom ? ` (${(ex as any).recycledFrom})` : '';
  lines.push(`## Übung ${ex.id} — ${ex.title}${recycled}`);
  lines.push('');

  if (ex.audio) {
    lines.push(`🎧 **Audio:** [${ex.audio}](audio/${ex.audio})`);
    lines.push('');
  }

  if (ex.instructions) {
    lines.push(ex.instructions);
    lines.push('');
  }

  switch (ex.type) {
    case 'gap-text':     lines.push(...renderGapTextMd(ex));     break;
    case 'table-fill':   lines.push(...renderTableFillMd(ex));   break;
    case 'gap-bank':     lines.push(...renderGapBankMd(ex));     break;
    case 'single-choice':lines.push(...renderSingleChoiceMd(ex));break;
    case 'true-false':   lines.push(...renderTrueFalseMd(ex));   break;
    case 'matching':     lines.push(...renderMatchingMd(ex));    break;
    case 'categorize':   lines.push(...renderCategorizeMd(ex));  break;
    case 'odd-one-out':  lines.push(...renderOddOneOutMd(ex));   break;
    case 'order':        lines.push(...renderOrderMd(ex));       break;
    case 'free-write':   lines.push(...renderFreeWriteMd(ex));   break;
    case 'speaking-prompt':lines.push(...renderSpeakingPromptMd(ex));break;
  }

  // H4 Kurze Ansage transcript block
  if (ex.transcript && ex.audio) {
    lines.push(...renderTranscriptBlock(ex.audio, ex.transcript));
  }

  // notes appear at the end of the exercise (e.g. D4 score tracker)
  if (ex.notes) {
    lines.push(`_${ex.notes}_`);
    lines.push('');
  }

  return lines;
}

function renderTranscriptBlock(audio: string, transcript: string): string[] {
  // Extract ansage number from filename (e.g. transcript_ansage1.mp3 → 1)
  const m = audio.match(/ansage(\d+)/i);
  const n = m ? m[1] : '1';
  return [
    '<details>',
    '<summary>📄 Transkript (erst nach dem Hören öffnen!)</summary>',
    '',
    `🎧 **Audio:** [${audio}](audio/${audio})`,
    '',
    `**Ansage ${n} — Transcript**`,
    '',
    `> ${transcript.trim().split('\n').join('\n> ')}`,
    '',
    '</details>',
    '',
  ];
}

// ── per-type exercises.md renderers ──────────────────────────────────────────

function gapify(text: string, listLayout = false): string {
  if (listLayout) return text.replace(/\{(\d+)\}/g, '______');
  return text.replace(/\{(\d+)\}/g, '($1) ______');
}

function renderGapTextMd(ex: GapTextExercise): string[] {
  const lines: string[] = [];
  const rendered = gapify(ex.text.trim(), ex.listLayout);
  lines.push(rendered);
  lines.push('');
  return lines;
}

function renderTableFillMd(ex: TableFillExercise): string[] {
  const lines: string[] = [];
  const cols = ex.columns;

  // Header row
  lines.push(`| ${cols.join(' | ')} |`);
  lines.push(`|${cols.map(() => '---').join('|')}|`);

  for (const row of ex.rows) {
    const cells = row.cells.map(cell => {
      if (cell === null) return '______';
      if (cell.given) return cell.given;
      return '______';
    });
    lines.push(`| ${row.label} | ${cells.join(' | ')} |`);
  }
  lines.push('');
  return lines;
}

function renderGapBankMd(ex: GapBankExercise): string[] {
  const lines: string[] = [];

  const textLines = ex.text.trim().split('\n');
  for (const line of textLines) {
    lines.push(`> ${gapify(line)}`);
  }
  lines.push('');

  // Bank line: C/exam block → uppercase + sorted; H/A/B/D → lowercase + parens
  if (ex.block === 'C' || ex.block === 'exam') {
    const sorted = [...ex.bank].sort((a, b) => a.localeCompare(b, 'de'));
    lines.push(`> ${sorted.map(w => w.toUpperCase()).join(' · ')}`);
    const extra = ex.bank.length - Object.keys(ex.answers).length;
    if (extra > 0) {
      const words = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen'];
      const label = extra < words.length ? words[extra] : String(extra);
      lines.push('');
      lines.push(`${label} word${extra === 1 ? '' : 's'} are not needed.`);
    }
  } else {
    lines.push(`> (${ex.bank.join(' · ')})`);
  }
  lines.push('');
  return lines;
}

function renderSingleChoiceMd(ex: SingleChoiceExercise): string[] {
  const lines: string[] = [];
  const hasPerItemAudio = ex.items.some(item => item.audio);

  for (let i = 0; i < ex.items.length; i++) {
    const item = ex.items[i];
    const n = i + 1;
    const opts = item.options.map(o => `${o.key}) ${o.text}`).join('  ');

    if (hasPerItemAudio) {
      // Block layout: question line, then options indented
      lines.push(`${n}. ${item.q}  `);
      lines.push(`   ${opts}`);
    } else {
      // Inline layout: question + options on same line
      lines.push(`${n}. ${item.q}  ${opts}`);
    }
  }
  lines.push('');
  return lines;
}

function renderTrueFalseMd(ex: TrueFalseExercise): string[] {
  const lines: string[] = [];
  for (let i = 0; i < ex.items.length; i++) {
    lines.push(`${i + 1}. ${ex.items[i].q} ( )`);
  }
  lines.push('');
  return lines;
}

function renderMatchingMd(ex: MatchingExercise): string[] {
  const lines: string[] = [];
  const maxRows = Math.max(ex.left.length, ex.right.length);

  lines.push(`| Links | | Rechts |`);
  lines.push(`|---|---|---|`);

  for (let i = 0; i < maxRows; i++) {
    const l = ex.left[i] ? `${ex.left[i].key}. ${ex.left[i].text}` : '';
    const r = ex.right[i] ? `${ex.right[i].key}) ${ex.right[i].text}` : '';
    lines.push(`| ${l} | | ${r} |`);
  }
  lines.push('');
  return lines;
}

function renderCategorizeMd(ex: CategorizeExercise): string[] {
  const lines: string[] = [];
  lines.push(`> ${ex.tokens.map(t => t.text).join(' · ')}`);
  lines.push('');
  lines.push(`| ${ex.buckets.map(b => b.label).join(' | ')} |`);
  lines.push(`|${ex.buckets.map(() => '---').join('|')}|`);
  lines.push(`| ${ex.buckets.map(() => '').join(' | ')} |`);
  lines.push('');
  return lines;
}

function renderOddOneOutMd(ex: OddOneOutExercise): string[] {
  const lines: string[] = [];
  for (let i = 0; i < ex.groups.length; i++) {
    lines.push(`${i + 1}. ${ex.groups[i].items.join(' – ')}`);
  }
  lines.push('');
  return lines;
}

function renderOrderMd(ex: OrderExercise): string[] {
  const lines: string[] = [];
  for (let i = 0; i < ex.items.length; i++) {
    const shuffled = deterministicShuffle(ex.items[i].tiles, ex.id + i);
    lines.push(`${i + 1}. ${shuffled.join(' – ')}`);
  }
  lines.push('');
  return lines;
}

function renderFreeWriteMd(ex: FreeWriteExercise): string[] {
  const lines: string[] = [];
  if (ex.genre) {
    lines.push(`**${ex.genre}**`);
    lines.push('');
  }
  if (ex.stimulus) {
    lines.push(`> ${ex.stimulus}`);
    lines.push('');
  }
  lines.push(`**Your task:** ${ex.prompt}`);
  lines.push('');
  if (ex.use && ex.use.length > 0) {
    lines.push('Use:');
    for (const item of ex.use) {
      lines.push(`- [ ] ${item}`);
    }
    lines.push('');
  }
  if (ex.selfCheck && ex.selfCheck.length > 0) {
    lines.push('Self-check:');
    for (const item of ex.selfCheck) {
      lines.push(`- [ ] ${item}`);
    }
    lines.push('');
  }
  return lines;
}

function renderSpeakingPromptMd(ex: SpeakingPromptExercise): string[] {
  const lines: string[] = [];
  for (const part of ex.parts) {
    lines.push(`**${part.label}**`);
    lines.push('');
    lines.push(part.prompt);
    lines.push('');
    if (part.bullets && part.bullets.length > 0) {
      for (const b of part.bullets) {
        lines.push(`- ${b}`);
      }
      lines.push('');
    }
  }
  if (ex.criteria && ex.criteria.length > 0) {
    lines.push('**Bewertungskriterien:**');
    for (const c of ex.criteria) {
      lines.push(`- ${c}`);
    }
    lines.push('');
  }
  return lines;
}

// Deterministic shuffle (seeded Fisher-Yates using a simple LCG)
function deterministicShuffle<T>(arr: T[], seed: string): T[] {
  const result = [...arr];
  let s = hashStr(seed);
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h;
}

// ─── solutions.md ────────────────────────────────────────────────────────────

function renderSolutionsMd(data: ExerciseSetType): string {
  const lines: string[] = [];
  const titleLabel = data.title.replace('Übungen', 'Lösungen').replace('Exercises', 'Lösungen (Answer key)');
  lines.push(`# ${titleLabel}`);
  lines.push('');

  const isExam = data.exercises.some(e => e.block === 'exam');

  if (!isExam) {
    const grouped = groupByBlock(data.exercises);
    for (const block of BLOCK_ORDER) {
      const exs = grouped.get(block);
      if (!exs) continue;
      lines.push('---');
      lines.push('');
      lines.push(`# Block ${block} — ${BLOCK_NAMES[block]}`);
      lines.push('');
      for (const ex of exs) {
        lines.push(...renderExerciseSol(ex));
      }
    }
    // Selbsttest threshold for normal lessons
    lines.push('---');
    lines.push('');
    lines.push('**16+ / 20 → go to the next Lektion.**');
    lines.push('');
  } else {
    // Exam: no block grouping
    lines.push('---');
    lines.push('');
    for (const ex of data.exercises) {
      lines.push(...renderExerciseSol(ex));
    }
    // Exam scoring grid
    if (data.exam) {
      lines.push('---');
      lines.push('');
      lines.push(...renderExamGrid(data.exam));
    }
  }

  return lines.join('\n').trimEnd() + '\n';
}

function renderExerciseSol(ex: ExerciseUnion): string[] {
  const lines: string[] = [];
  lines.push(`## Übung ${ex.id} — ${ex.title}`);
  lines.push('');

  switch (ex.type) {
    case 'gap-text':      lines.push(...renderGapTextSol(ex));      break;
    case 'table-fill':    lines.push(...renderTableFillSol(ex));    break;
    case 'gap-bank':      lines.push(...renderGapBankSol(ex));      break;
    case 'single-choice': lines.push(...renderSingleChoiceSol(ex)); break;
    case 'true-false':    lines.push(...renderTrueFalseSol(ex));    break;
    case 'matching':      lines.push(...renderMatchingSol(ex));     break;
    case 'categorize':    lines.push(...renderCategorizeSol(ex));   break;
    case 'odd-one-out':   lines.push(...renderOddOneOutSol(ex));    break;
    case 'order':         lines.push(...renderOrderSol(ex));        break;
    case 'free-write':    lines.push(...renderFreeWriteSol(ex));    break;
    case 'speaking-prompt':lines.push(...renderSpeakingPromptSol(ex));break;
  }

  return lines;
}

// ── per-type solutions.md renderers ──────────────────────────────────────────

function boldAnswer(a: string | string[]): string {
  if (Array.isArray(a)) return `**${a[0]}**${a.length > 1 ? ` (auch richtig: ${a.slice(1).map(x => `**${x}**`).join(', ')})` : ''}`;
  return `**${a}**`;
}

function renderGapTextSol(ex: GapTextExercise): string[] {
  const lines: string[] = [];
  const entries = Object.entries(ex.answers).sort((a, b) => +a[0] - +b[0]);
  const parts = entries.map(([k, v]) => `${k}. ${boldAnswer(v)}`);
  lines.push(parts.join('  '));
  lines.push('');
  return lines;
}

function renderTableFillSol(ex: TableFillExercise): string[] {
  const lines: string[] = [];
  const cols = ex.columns;
  lines.push(`| ${cols.join(' | ')} |`);
  lines.push(`|${cols.map(() => '---').join('|')}|`);

  for (const row of ex.rows) {
    const cells = row.cells.map(cell => {
      if (cell === null) return '';
      if (cell.given) return cell.given;
      return boldAnswer(cell.answer);
    });
    lines.push(`| ${row.label} | ${cells.join(' | ')} |`);
  }
  lines.push('');
  return lines;
}

function renderGapBankSol(ex: GapBankExercise): string[] {
  const lines: string[] = [];
  const entries = Object.entries(ex.answers).sort((a, b) => +a[0] - +b[0]);
  const parts = entries.map(([k, v]) => `${k}. ${boldAnswer(v)}`);
  lines.push(parts.join('  '));
  lines.push('');
  return lines;
}

function renderSingleChoiceSol(ex: SingleChoiceExercise): string[] {
  const lines: string[] = [];
  for (let i = 0; i < ex.items.length; i++) {
    const item = ex.items[i];
    const opt = item.options.find(o => o.key === item.answer);
    const answerText = opt ? `${item.answer}) ${opt.text}` : item.answer;
    const why = item.why ? ` — ${item.why}` : '';
    lines.push(`${i + 1}. **${answerText}**${why}`);
  }
  lines.push('');
  return lines;
}

function renderTrueFalseSol(ex: TrueFalseExercise): string[] {
  const lines: string[] = [];
  for (let i = 0; i < ex.items.length; i++) {
    const item = ex.items[i];
    const label = item.answer ? 'R' : 'F';
    const why = item.why ? ` — ${item.why}` : '';
    lines.push(`${i + 1}. **${label}**${why}`);
  }
  lines.push('');
  return lines;
}

function renderMatchingSol(ex: MatchingExercise): string[] {
  const lines: string[] = [];
  const parts = ex.left.map(l => `${l.key} → ${ex.answers[l.key] ?? '?'}`);
  lines.push(parts.join(' · '));
  lines.push('');
  return lines;
}

function renderCategorizeSol(ex: CategorizeExercise): string[] {
  const lines: string[] = [];
  const byBucket = new Map<string, string[]>();
  for (const b of ex.buckets) byBucket.set(b.key, []);
  for (const t of ex.tokens) byBucket.get(t.bucket)?.push(t.text);

  for (const b of ex.buckets) {
    const tokens = byBucket.get(b.key) ?? [];
    lines.push(`**${b.label}:** ${tokens.map(t => `**${t}**`).join(', ')}`);
  }
  lines.push('');
  return lines;
}

function renderOddOneOutSol(ex: OddOneOutExercise): string[] {
  const lines: string[] = [];
  for (let i = 0; i < ex.groups.length; i++) {
    const g = ex.groups[i];
    const odd = g.items[g.odd];
    const why = g.why ? ` — ${g.why}` : '';
    lines.push(`${i + 1}. ~~${odd}~~${why}`);
  }
  lines.push('');
  return lines;
}

function renderOrderSol(ex: OrderExercise): string[] {
  const lines: string[] = [];
  for (let i = 0; i < ex.items.length; i++) {
    const item = ex.items[i];
    const correct = item.answer.map(idx => item.tiles[idx]);
    lines.push(`${i + 1}. ${correct.join(' ')}`);
    if (item.alt && item.alt.length > 0) {
      const alts = item.alt.map(perm => perm.map(idx => item.tiles[idx]).join(' '));
      lines.push(`   (auch richtig: ${alts.join(' / ')})`);
    }
    if (item.note) {
      lines.push(`   _${item.note}_`);
    }
  }
  lines.push('');
  return lines;
}

function renderFreeWriteSol(ex: FreeWriteExercise): string[] {
  const lines: string[] = [];
  if (ex.model) {
    lines.push('Modellantwort:');
    lines.push('');
    lines.push(`> ${ex.model.trim().split('\n').join('\n> ')}`);
    lines.push('');
  }
  if (ex.selfCheck && ex.selfCheck.length > 0) {
    lines.push('Selbstkorrektur:');
    for (const c of ex.selfCheck) {
      lines.push(`- [ ] ${c}`);
    }
    lines.push('');
  }
  return lines;
}

function renderSpeakingPromptSol(ex: SpeakingPromptExercise): string[] {
  const lines: string[] = [];
  if (ex.criteria && ex.criteria.length > 0) {
    lines.push('Bewertungskriterien:');
    for (const c of ex.criteria) {
      lines.push(`- ${c}`);
    }
    lines.push('');
  }
  return lines;
}

function renderExamGrid(grid: ExamGridType): string[] {
  const lines: string[] = [];
  lines.push('## Bewertung');
  lines.push('');
  lines.push('| Prüfungsteil | Punkte | Schwelle |');
  lines.push('|---|---|---|');
  for (const sk of grid.skills) {
    const assessed = sk.selfAssessed ? ' _(Selbstbewertung)_' : '';
    lines.push(`| ${sk.label} | / ${sk.maxPoints}${assessed} | ≥ ${sk.passPoints} |`);
  }
  const totalMax = grid.skills.reduce((s, sk) => s + sk.maxPoints, 0);
  lines.push(`| **Gesamt** | **/ ${totalMax}** | **≥ ${grid.totalPass}** |`);
  lines.push('');
  if (grid.rule) {
    lines.push(`_${grid.rule}_`);
    lines.push('');
  }
  return lines;
}

// ─── run ─────────────────────────────────────────────────────────────────────

main();
