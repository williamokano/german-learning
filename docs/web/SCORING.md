# SCORING.md — grading engine, scoring & progress

Defines how answers are checked, how scores aggregate, the pass gates, the exam
grids, and how progress persists. All grading logic is **pure TypeScript in
`core/`** with no UI imports, so it is unit-tested in plain Node (Vitest).

---

## 1. The reveal-at-end flow (school test)

The cardinal rule: **correctness is never shown until the learner submits.**

```
learner fills the page  →  presses „Auswerten" (one button, page-level)
   → BlockRunner calls widget.check() for every exercise
   → GradingEngine returns ItemResult[] per exercise (pure)
   → widgets flip to `graded` and render ✓/✗ + expected answers
   → ScoringService aggregates → score panel (per block, per skill, total)
   → ProgressService.persist(lesson, result)
   → verdict + next-lesson affordance
```

Mistakes are first-class: wrong items reveal the correct answer so the learner
learns from them. A **„Nochmal"** action resets to ungraded (whole page or a single
exercise) and clears that exercise's saved answers.

---

## 2. `GradingEngine` (pure)

`web/src/core/engine/grading.ts`. One pure checker per gradeable shape; widgets call
these and only render the result (`COMPONENTS.md §0.1`).

```ts
type Flags = { caseSensitive?: boolean; strictUmlaut?: boolean; keepPunctuation?: boolean };

function normalize(s: string, f: Flags): string {
  let t = s.trim().replace(/\s+/g, ' ');
  if (!f.keepPunctuation) t = t.replace(/[.?!,;:]+$/u, '');
  if (!f.caseSensitive)   t = t.toLowerCase();
  if (!f.strictUmlaut)    t = foldUmlautAndEszett(t); // ä→ae ö→oe ü→ue ß→ss
  return t;
}

// free-text gap: accept any listed alternative
function checkText(expected: string | string[], given: string, f: Flags): boolean {
  const alts = (Array.isArray(expected) ? expected : [expected]).map(a => normalize(a, f));
  return alts.includes(normalize(given, f));
}

// word-bank slot: compare placed token value to the answer (both come from `bank`)
function checkBank(expectedWord: string, placedWord: string | null): boolean {
  return placedWord != null && placedWord === expectedWord; // exact: tokens are canonical
}

// order: accept the canonical permutation or any in `alt`
function checkOrder(answer: number[], given: number[], alt?: number[][]): boolean {
  const eq = (a: number[]) => a.length === given.length && a.every((v, i) => v === given[i]);
  return eq(answer) || (alt ?? []).some(eq);
}
// single-choice / true-false / matching / categorize / odd-one-out: plain equality.
```

### Normalization defaults (the contract from `CONTENT-MODEL.md §7`)
- case-**insensitive** by default; opt into `caseSensitive` where capitalization is
  the teaching point (German nouns; language names like `Deutsch`).
- `ß`≈`ss` and umlaut≈digraph **equal by default** (keyboard fairness); opt into
  `strictUmlaut` where the umlaut is the point.
- trailing sentence punctuation ignored by default.
- These are the **only** knobs. No per-gap regexes. Document the defaults in the UI
  ("answers are checked leniently for case and umlauts unless the exercise says
  otherwise") so learners trust the grader.

> Keep `GradingEngine` deterministic and side-effect-free. Every checker has unit
> tests with real items pulled from A1/01 (e.g. `heißt` vs `heisst`, `Deutsch` vs
> `deutsch` with `caseSensitive`).

---

## 3. `ScoringService` (pure)

`web/src/core/engine/scoring.ts`. Turns `ItemResult[]` into scores.

```ts
interface ExerciseScore { id: string; block: Block; correct: number; scoreable: number; }
interface BlockScore    { block: Block; correct: number; scoreable: number; pct: number; }
interface LessonScore {
  lesson: string;
  byExercise: ExerciseScore[];
  byBlock: BlockScore[];
  correct: number; scoreable: number; pct: number;
  passed: boolean;            // see §4
}
```

- **Scoreable items** exclude `free-write`/`speaking-prompt` (they're self-assessed)
  unless a `maxScore`/self-score is provided (§5).
- `pct = correct / scoreable` (guard divide-by-zero → 0 scoreable ⇒ not counted).
- Aggregation is per exercise → per block → per lesson.

---

## 4. Pass gates (standard lessons)

The course rule today: **self-score ≥ 80 % to advance**, and the D4 Selbsttest has
its own `16/20` threshold. Encode both:

- **Lesson gate**: `LessonScore.pct ≥ 0.80` → lesson "passed" → next lesson
  unlocked by `ProgressService`.
- **D4 Selbsttest**: if the lesson has an exercise `id` in the D-block that is the
  scored self-test (20 items), surface its own `≥16/20` verdict in the score panel
  in addition to the lesson %. (The 80 % lesson gate and the 16/20 self-test gate
  are both shown; advancing uses the lesson gate.)
- The gate is **advisory, not enforced** — the learner can always navigate to any
  lesson (answers ship in the bundle; this is a study tool). "Unlock" is a
  progress/UX signal, not a lock. Document this so no one builds hard gating.

The score panel shows: total %, per-block bars, the verdict
(`≥80 % → bereit für die nächste Lektion` / else `wiederhole Block A …`), and the
retry advice already written in each `solutions.md` D-block.

---

## 5. Self-assessed items (FreeWrite / SpeakingPrompt)

These can't be auto-graded. Two modes:

- **Standard lessons** (B9, C5): not part of the auto % (they're `scoreable:false`).
  The widget shows the `use[]`/`selfCheck[]` checklists and the model answer behind
  a `Spoiler`; the learner self-reflects. No points enter the lesson %.
- **Exam lessons** (Schreiben/Sprechen Aufgaben with `maxScore`): the learner reads
  the model + criteria, then sets a **self-score** (0..`maxScore`) via a stepper.
  That value feeds the exam grid (§6). The UI labels it clearly as self-assessment.

---

## 6. Exam scoring (`NN/14`)

Exam lessons carry an `ExamGrid` (`CONTENT-MODEL.md §5`). `TestRunner` +
`ScoringService.scoreExam(grid, results, selfScores)`:

1. For each `skill`, sum points over its `exerciseIds`:
   - auto-graded exercises contribute `correct` (1 pt/item unless the grid weights
     them — keep 1 pt/item; the grids were authored to total correctly).
   - `selfAssessed` skills (Schreiben/Sprechen) contribute the learner's self-score.
2. Compute each skill's `points` vs `maxPoints` and whether it meets `passPoints`.
3. Compute the total vs `totalPass` and evaluate `rule`.

Encoded grids:

| Lesson | Skills (max / sub-pass) | Total pass | Rule |
|---|---|---|---|
| **A1/14** | Hören 15/8 · Lesen 18/10 · Schreiben 12/6 (self) · Sprechen 10/5 (self) | **29/55** | ≥29/55 **and** sub-threshold in ≥3 of 4 skills |
| **A2/14** | Hören 15/9 · Lesen 20/12 · Schreiben 10/6 (self) | **27/45** (written) | ≥27/45 **and** adequate Sprechen (assessed separately) |

The exam score panel renders the same grid the `solutions.md` prints (a per-skill
table with the learner's points, the sub-threshold, and the pass/fail verdict), plus
the "if you scored < X in <skill>" remediation advice from the solutions.

> The grid values are **data**, not code. Future exam lessons (B1/14, B2/14, C1/12)
> add their own `ExamGrid` in `exercises.yml`; `ScoringService` needs no change.

---

## 7. `ProgressService` & persistence

`web/src/core/services/progress.ts`, backed by `StorageService` (interface).

```ts
interface StorageService {                 // the swap seam for a future backend
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}
class LocalStorageStorage implements StorageService { /* JSON in window.localStorage */ }
// LATER: class ApiStorage implements StorageService { /* fetch /api/* */ }

interface ProgressService {
  loadAnswers(lesson: string, exerciseId: string): unknown | null;   // resume in-progress
  saveAnswers(lesson: string, exerciseId: string, state: unknown): void;
  clearAnswers(lesson: string, exerciseId: string): void;
  recordResult(lesson: string, score: LessonScore | ExamResult): void;
  getProgress(): CourseProgress;   // per-lesson best %, passed flag, last attempt
  isUnlocked(lesson: string): boolean; // advisory (prev lesson passed) — see §4
}
```

- **Keys**: namespaced, e.g. `gl:v1:answers:A1/01:C3`, `gl:v1:result:A1/01`. Include
  a schema version (`v1`) so a format change can migrate/clear cleanly.
- **What persists**: in-progress widget state (so a refresh doesn't lose work) and
  the best result per lesson. Persisted state is the widget's `getState()` output.
- **Composition root**: one module (`web/src/core/index.ts` or a small DI factory)
  constructs `LocalStorageStorage` and injects it into `ProgressService` and
  `AudioService`. Swapping to `ApiStorage` later changes only this file.
- Persistence is **best-effort and hackable** (per the owner): localStorage is
  user-editable; that's acceptable now. The interface is the point — it makes the
  future backend a drop-in.

---

## 8. What an implementer must unit-test (P2 done-criteria)

- `normalize` + `checkText`: case/umlaut/punctuation folding, alternatives,
  `caseSensitive`/`strictUmlaut` opt-ins (use real A1/01 items).
- `checkBank`: duplicate bank words, distractors, empty slot.
- `checkOrder`: canonical + `alt` permutations.
- equality checkers: single-choice/true-false/matching/categorize/odd-one-out.
- `ScoringService`: per-block/lesson aggregation, 80 % gate, 16/20 self-test.
- `scoreExam`: A1/14 and A2/14 grids — including the "≥3 of 4 skills" rule and the
  self-assessed contributions.
