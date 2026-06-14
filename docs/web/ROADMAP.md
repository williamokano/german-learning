# ROADMAP.md — phased, executable build order

Build the app in phases. Each phase has a **deliverable** and **done-criteria** that
can be checked before moving on. Phases are ordered to get something visible and
correct early, then broaden. An implementing agent can execute P0→P3 to ship a
working site for hand-authored lessons, then P4→P5 to generate/migrate at scale.

> Reference the other `docs/web/` files as noted. Don't re-plan — these phases
> assume the architecture, schema, components, scoring, and pipeline already
> specified there.

---

## ✅ P0 — Scaffold & deploy skeleton

**Deliverable:** an empty but deployable Astro app.
- `web/` Astro project (`pnpm create astro`), add `@astrojs/mdx`, `@astrojs/svelte`,
  `zod`, `yaml`, `vitest`. Configure `astro.config.mjs` (`site`, `base`, `output:
  'static'`, integrations) per `TECH-STACK.md §4`.
- `web/src/core/` folders (`content/`, `engine/`, `services/`) with **interfaces and
  empty impls** (`StorageService`, `ProgressService`, `AudioService`, `GradingEngine`,
  `ScoringService`) + the `@core/*` tsconfig path alias.
- `.github/workflows/deploy-pages.yml` (`TECH-STACK.md §7`) with LFS checkout.

**Done when:** `pnpm -C web dev` serves a placeholder home page; a push to `main`
builds and publishes it to GitHub Pages at the `base` path; links resolve under
`/german-learning/`.

---

## ✅ P1 — Lesson rendering

**Deliverable:** real lesson pages with working audio.
- `lessons` content collection + `LessonFrontmatter` schema (`BUILD-PIPELINE.md §4`).
- `AudioService` (one-active-clip, base-path URL resolution) + `AudioPlay` Svelte
  island (label + bare modes).
- MDX component map (`AudioPlay`, `details`→`Spoiler`) + the lesson **enrichment**
  remark/rehype passes (dialogs, `Hör zu`, `Hörtext`, `🎧` links, `Merkasten`, vocab
  tables) reusing `generate_audio.py` regex semantics (`CONTENT-MODEL.md §6.3`).
- `Spoiler`, `Merkasten`, `DialogBlock`, `VocabTable`/`RedemittelTable` components.
- `build/mirror-audio.ts` → `web/public/audio/...`; lesson route
  `/[level]/[lesson]/index.astro`.

**Done when:** `A1/01` lesson page renders faithfully — dialogs play (`dialog1_a/b`),
`Hör zu` clips play, the Hörtext spoiler is closed by default and plays, `Merkästen`
are styled, and an inline `<AudioPlay>` (add one to A1/01 as a test) shows `label ▶`
and plays. Reading pages ship ~no JS except audio islands.

---

## ✅ P2 — Grading core + first widgets + content schema

**Deliverable:** a graded exercises page for the simplest types.
- `core/content/schema.ts` (full Zod union + `superRefine` invariants) and inferred
  types (`CONTENT-MODEL.md §3`).
- `GradingEngine` (`normalize`, `checkText`, equality checkers) + `ScoringService`
  (per-exercise/block/lesson, 80 % gate) + `LocalStorageStorage` + `ProgressService`
  (`SCORING.md §2–4, §7`). **Vitest unit tests** with real A1/01 items.
- `exercises` content collection (build-time schema validation).
- `ExerciseShell` + `BlockRunner` (the single **„Auswerten"** flow, three visual
  states) (`COMPONENTS.md §0.2, §12`).
- Widgets: **`GapText`, `SingleChoice`, `TrueFalse`**.
- Fixture data: a **hand-authored `A1/01/exercises.yml`** covering at least the H1/H3
  + a few A/C items so the page has content (full migration is P5).
- Exercises route `/[level]/[lesson]/uebungen.astro`.

**Done when:** the A1/01 exercises page renders GapText/SingleChoice/TrueFalse;
nothing shows right/wrong until „Auswerten"; then ✓/✗ + correct answers appear and a
score panel shows the % + 80 % verdict; refresh restores in-progress answers; all
`core/` unit tests pass.

---

## ✅ P3 — Remaining widgets, drag/drop, scoring panel, exams

**Deliverable:** all 11 exercise types + full scoring incl. mock exams.
- Shared `makeDraggable` dnd helper (Pointer Events, click-to-place, click-to-return,
  keyboard a11y) (`COMPONENTS.md §0.3`).
- Widgets: **`GapBank`, `TableFill`, `Matching`, `Categorize`, `OddOneOut`, `Order`,
  `FreeWrite`, `SpeakingPrompt`**.
- `ScoringService.scoreExam` + `TestRunner` exam variant; encode A1/14 & A2/14
  `ExamGrid`s; score panel renders the per-skill grid + pass rule + remediation
  (`SCORING.md §6`).
- Self-assessed flow for FreeWrite/Speaking (model behind Spoiler, self-score).

**Done when:** every type from `COMPONENTS.md` renders and grades; the drag/click
interactions work on mouse, touch, and keyboard; A1/14 and A2/14 (hand-authored or
P5-migrated yml) produce the correct per-skill and total scores and pass verdicts.

---

## P4 — Generators (`gen-exercises`, `strip-lesson`)

**Deliverable:** print artifacts generated from source; CI drift check.
- `build/gen-exercises.ts` with **all render rules** (`BUILD-PIPELINE.md §1.1–1.2`):
  per-type `exercises.md` rendering (incl. the audio `🎧` + H4 transcript block) and
  `solutions.md` rendering; `--all`, `--check`.
- `build/strip-lesson.ts` (inline-component → text for PDF).
- Wire `gen-exercises --all --check` into CI.

**Done when:** running `gen-exercises` on the hand-authored `A1/01/exercises.yml`
reproduces the **current** `exercises.md`/`solutions.md` (diff ≈ empty), and the H4
transcript markers still satisfy `generate_audio.py`; `--check` passes in CI.

---

## P5 — Migrate A1/A2 to `exercises.yml`

**Deliverable:** all 26 existing lessons sourced from `exercises.yml`.
- `build/import-exercises.ts` (one-time): parse existing `exercises.md` +
  `solutions.md` → `exercises.yml`, **flagging low-confidence items (`needsReview`)
  rather than guessing** (`BUILD-PIPELINE.md §3`).
- Review flagged items; round-trip validate (regenerate md/solutions, diff vs
  originals); accept.
- Commit `exercises.yml` for all A1/A2 lessons; from here yml is the source.

**Done when:** all 26 lessons have a reviewed `exercises.yml`; `gen-exercises --all`
reproduces the committed md/solutions (or reviewed improvements); the site renders
every A1/A2 lesson and exercises page; no `needsReview` markers remain.

> After P5, B1+ is authored natively per `WEB-AUTHORING.md` — no importer needed.

---

## P6 — Backend seam (future; not required to launch)

**Deliverable:** cross-device progress (and the basis for paid mentoring).
- Add `@astrojs/node`, `output: 'hybrid'`; `web/src/pages/api/*` endpoints.
- `ApiStorage implements StorageService`; register it in the composition root
  (the only change outside `/api`). Optional `AuthService` for accounts/payments.

**Done when:** progress persists via the API for signed-in users; widgets, lessons,
grading, and scoring are unchanged from P3 (proves the seam). Self-host via Docker;
GitHub Pages can remain the static fallback.

---

## Dependency graph

```
P0 ─▶ P1 ─▶ P2 ─▶ P3 ─▶ (launch for hand-authored lessons)
            └────▶ P4 ─▶ P5 ─▶ (full A1/A2 live, B1+ authored natively)
P3/P5 ─────────────────▶ P6 (whenever backend features are wanted)
```

P4 may be pulled before P3 if you'd rather generate the fixture data than
hand-author it; the only hard order is **P0→P1→P2** and **P4 before P5**.

---

## Definition of done for the whole effort (v1, pre-backend)

- All 11 widget types implemented and unit/inting-tested; school-test reveal flow
  correct; drag + click + keyboard all work.
- `core/` has no framework imports; `StorageService` is the single swap seam.
- All A1/A2 lessons + exercises render on GitHub Pages; audio plays; PDFs strip
  cleanly.
- `exercises.yml` is the sole exercise source; `gen-exercises --check` green in CI.
- Scoring (80 % gate + A1/A2 exam grids) matches the existing `solutions.md`
  thresholds.
