#!/usr/bin/env tsx
/**
 * import-vocab.ts — lesson.md Wortschatz → draft vocab.yml, plus the CI validator.
 *
 * The F1 keystone (issue #337): turn the heterogeneous Wortschatz markdown into a
 * structured, per-lesson vocab.yml. This is a DRAFT generator — it flags uncertain
 * rows `needsReview: true` rather than guessing; a human pass fills the gaps.
 *
 * Usage (from repo root):
 *   npx tsx build/import-vocab.ts A1/03-essen-und-trinken     # draft one lesson
 *   npx tsx build/import-vocab.ts --all                        # draft every lesson
 *   npx tsx build/import-vocab.ts --all --force                # overwrite existing drafts
 *   npx tsx build/import-vocab.ts --all --check                # CI: validate committed vocab.yml
 *
 * Import mode skips a lesson that already has a vocab.yml (protecting reviewed files)
 * unless --force is given. Check mode validates only the vocab.yml files that exist,
 * and FAILS if any is schema-invalid, mislabeled, or still carries a needsReview flag.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

// Direct path imports so this script runs from the repo root without a root node_modules.
import { parse as parseYaml, stringify as stringifyYaml } from '../web/node_modules/yaml/dist/index.js';
import { CommittedVocabSet } from '../web/src/core/content/vocab.ts';
import { parseWortschatz } from '../web/src/core/content/wortschatz-parser.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

function main() {
  const argv = process.argv.slice(2);
  const checkMode = argv.includes('--check');
  const allMode = argv.includes('--all');
  const force = argv.includes('--force');
  const positional = argv.filter(a => !a.startsWith('--'));

  let dirs: string[];
  if (allMode) {
    dirs = findAllLessonDirs();
  } else if (positional.length > 0) {
    dirs = positional.map(d => resolve(REPO_ROOT, d));
  } else {
    console.error('Usage: tsx build/import-vocab.ts <dir> | --all [--check] [--force]');
    process.exit(1);
  }

  let failures = 0;
  let checked = 0; // vocab.yml files actually validated in --check mode
  for (const dir of dirs) {
    try {
      if (checkMode) {
        const res = checkLesson(dir);
        if (res === null) continue; // no vocab.yml in this dir
        checked++;
        if (!res) failures++;
      } else if (!importLesson(dir, force)) {
        failures++;
      }
    } catch (e) {
      console.error(`[import-vocab] ERROR: ${dir}: ${(e as Error).message}`);
      failures++;
    }
  }
  // A green --check that validated nothing is a false pass (broken discovery, wrong cwd,
  // LEVELS typo). Fail loudly rather than silently certify zero files.
  if (checkMode && allMode && checked === 0) {
    console.error('[import-vocab] --check validated 0 vocab.yml files — directory discovery is likely broken');
    process.exit(1);
  }
  if (failures > 0) process.exit(1);
}

/** Every subdirectory under each level (A1..C1). The lesson.md / vocab.yml gate is
 *  applied per-dir downstream by importLesson / checkLesson. */
function findAllLessonDirs(): string[] {
  const dirs: string[] = [];
  for (const level of LEVELS) {
    const levelDir = join(REPO_ROOT, level);
    if (!existsSync(levelDir)) continue;
    for (const entry of readdirSync(levelDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      dirs.push(join(levelDir, entry.name));
    }
  }
  return dirs.sort();
}

/** Derive the canonical lesson id (e.g. "A1/03") from a lesson directory path. */
function lessonIdForDir(dir: string): string {
  const level = basename(dirname(dir));
  const num = basename(dir).slice(0, 2);
  return `${level}/${num}`;
}

// ─── import ────────────────────────────────────────────────────────────────

function importLesson(dir: string, force: boolean): boolean {
  const lessonPath = join(dir, 'lesson.md');
  if (!existsSync(lessonPath)) return true; // not a lesson dir; skip silently

  const vocabPath = join(dir, 'vocab.yml');
  if (existsSync(vocabPath) && !force) {
    console.log(`[import-vocab] SKIP (exists): ${vocabPath}`);
    return true;
  }

  const lesson = lessonIdForDir(dir);
  const md = readFileSync(lessonPath, 'utf8');
  const { entries, warnings, sectionFound } = parseWortschatz(md, lesson);
  for (const w of warnings) console.warn(`[import-vocab] WARN ${dir}: ${w}`);

  if (entries.length === 0) {
    // Distinguish "this lesson genuinely has no Wortschatz" from "we couldn't parse it",
    // so an unrecognized markdown shape doesn't masquerade as an empty lesson.
    if (!sectionFound) {
      console.warn(`[import-vocab] no Wortschatz section, skipping: ${dir}`);
    } else {
      console.warn(`[import-vocab] Wortschatz section present but 0 entries extracted (unrecognized markdown), skipping: ${dir}`);
    }
    return true;
  }

  writeFileSync(vocabPath, renderYaml({ lesson, entries }));
  const flagged = entries.filter(e => e.needsReview).length;
  const warnSuffix = warnings.length ? `, ${warnings.length} warning(s)` : '';
  console.log(`[import-vocab] wrote: ${vocabPath} (${entries.length} entries, ${flagged} needsReview${warnSuffix})`);
  return true;
}

function renderYaml(set: { lesson: string; entries: unknown[] }): string {
  const header = '# Draft generated by build/import-vocab.ts — review every entry and remove all needsReview flags.\n';
  return header + stringifyYaml(set, { lineWidth: 0 });
}

// ─── check (CI gate) ─────────────────────────────────────────────────────────

// Returns true (valid), false (invalid), or null (no vocab.yml — nothing to check).
function checkLesson(dir: string): boolean | null {
  const vocabPath = join(dir, 'vocab.yml');
  if (!existsSync(vocabPath)) return null; // vocab is optional per lesson

  // CommittedVocabSet carries every data invariant (structural + review-quality: no
  // needsReview, gloss present, no stale reviewNote). Only the lesson-id-vs-path check
  // is path-dependent, so it stays here.
  const raw = parseYaml(readFileSync(vocabPath, 'utf8'));
  const result = CommittedVocabSet.safeParse(raw);
  if (!result.success) {
    console.error(`[import-vocab] INVALID: ${vocabPath}`);
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    }
    return false;
  }

  const data = result.data;
  const expected = lessonIdForDir(dir);
  if (data.lesson !== expected) {
    console.error(`[import-vocab] LESSON MISMATCH: ${vocabPath} has "${data.lesson}", expected "${expected}"`);
    return false;
  }

  console.log(`[import-vocab] OK: ${vocabPath} (${data.entries.length} entries)`);
  return true;
}

main();
