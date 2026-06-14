# ARCHITECTURE.md — German course web app

> **Read order for implementers:** this file → `TECH-STACK.md` → `CONTENT-MODEL.md`
> → `COMPONENTS.md` → `SCORING.md` → `BUILD-PIPELINE.md` → `WEB-AUTHORING.md` →
> `ROADMAP.md`. The first four define *what we build and from what data*; the last
> four define *how we build, score, generate, and author it*.

---

## 1. The problem this solves

The repository is a complete A1→C1 self-study German course. Each topic folder
(`A1/01-erste-kontakte/`, …) holds three hand-written markdown files —
`lesson.md` (the class), `exercises.md` (the H/A/B/C/D exercise battery),
`solutions.md` (answer key) — plus pre-generated `audio/*.mp3`.

Today the only way to *use* an exercise is to read the prose, write answers on
paper, then flip to `solutions.md`. We want a **website** that:

1. **Renders each lesson** as a real page (dialogs with play buttons, vocabulary
   tables, grammar `Merkästen`, the Hörtext spoiler, inline per-word audio).
2. **Turns each exercise into an interactive widget** — draggable/clickable
   gap-fill, free-text gaps, single-choice, true/false, matching, categorize,
   odd-one-out, word-order, plus non-graded writing/speaking prompts.
3. **Behaves like a school test**: the learner may make mistakes freely;
   correctness is revealed only when they press **„Auswerten"** (Evaluate) at the
   end. Wrong items then show the correct answer so the learner learns from the
   mistake.
4. **Scores** the result and uses it to gate progression (standard lessons:
   ≥ 80 %; exam lessons: the official telc/Goethe grid).

Hard constraints from the project owner:

- **Single source of truth.** We must not maintain the same content twice. The
  markdown (`exercises.md`, `solutions.md`) must remain clean and human-readable
  because it is also the source for a **printable PDF / book**. So exercise widget
  data is **never** hand-written as a second copy and **never** embedded as weird
  syntax inside the printed markdown.
- **Host on GitHub Pages now**, self-host later. **No Next.js / no Vercel lock-in.**
- **No backend now**, but the architecture must **grow one later** (progress
  tracking across devices, paid mentoring) **without a rewrite**.
- **Answers are baked into the shipped site.** Client-side scoring is intentionally
  hackable for now — acceptable; this is a study tool, not an exam proctor.

---

## 2. The core idea: one source, generated artifacts

Two content shapes, each with **one source of truth** and **generated outputs**:

### (a) Exercises — structured source → generated markdown + widgets

A new per-lesson file **`exercises.yml`** becomes the single source of truth for
the exercise battery. A generator script (`gen-exercises`, the structural twin of
the existing `scripts/generate_audio.py`) compiles it into:

- **`exercises.md`** — the clean, printable prose battery (looks essentially
  identical to today's hand-written file), and
- **`solutions.md`** — the printable answer key with explanations.

The website's build reads the **same `exercises.yml`** (validated by a schema) to
render the interactive widgets. Because the answer key and the widget data come
from one place, **a gap and its answer can never drift out of alignment** — the
worst failure mode for a learning tool (a silently mismatched answer) is
eliminated by construction.

### (b) Lessons — MDX markdown → live page, and stripped → print

`lesson.md` stays the hand-written source of truth, but it is **not 100 % plain
prose**: it may embed a small, documented inline-component vocabulary. The web
build renders these as live components; a **print-strip pass** removes them to
produce clean PDF-ready markdown.

The primary inline component is **`<AudioPlay>`**:

```mdx
<AudioPlay src="GutenTag.mp3">Guten Tag</AudioPlay>   →  Guten Tag ▶   (label mode)
<AudioPlay src="hoertext.mp3" />                       →  ▶            (bare-icon mode)
```

Bare mode is used when the transcript is already on screen and the author only
wants a play control "somewhere." The existing native `<details>` spoiler is the
only other inline construct, and it already works on GitHub and in print.

> **Why this degrades gracefully:** GitHub's markdown sanitizer drops unknown tags
> (`<AudioPlay>`) but keeps their inner text, so a lesson still reads correctly
> when browsed on github.com. The print-strip pass makes it explicit for pandoc.

### The flow

```
                         ┌───────────────── gen-exercises (Node/TS) ─────────────────┐
 exercises.yml ──────────┤  → exercises.md (print)  → generate_audio.py → audio/*.mp3 │
   (SOURCE)              │  → solutions.md (print)                                    │
       │                 └────────────────────────────────────────────────────────────┘
       │
       └── Astro content collection (Zod schema) → typed ExerciseSet → Svelte widgets

 lesson.md(x) ───────────┬── @astrojs/mdx ──────────────→ lesson page (<AudioPlay>, …)
   (SOURCE)              └── strip pass ──→ lesson.print.md → PDF / book
```

Everything below the SOURCE files is a build product. Authors only ever touch
`exercises.yml` and `lesson.md(x)`.

---

## 3. Layered architecture (the core/UI boundary)

The single most important structural rule: **all logic lives in a framework-free
TypeScript core; the UI is a thin shell over it.** This is what makes "add a
backend later without a rewrite" true rather than aspirational.

```
┌──────────────────────────────────────────────────────────────────────┐
│  UI layer  (replaceable)                                               │
│  • Astro pages/layouts  (static reading surface, routing, SSG)          │
│  • Svelte islands       (the interactive widgets — hydrate on demand)   │
│      GapText · GapBank · SingleChoice · Matching · Categorize ·         │
│      OddOneOut · Order · FreeWrite · SpeakingPrompt · AudioPlay · …     │
└───────────────▲────────────────────────────────────────────────────────┘
                │  imports types + calls services; NEVER the reverse
┌───────────────┴────────────────────────────────────────────────────────┐
│  core/  (framework-free TypeScript — zero UI/Astro/Svelte imports)      │
│  • content/   content model types + Zod schemas (ExerciseSet, Lesson)   │
│  • engine/    GradingEngine (per-type checkers, text normalization)     │
│  •            ScoringService (per-block / per-lesson / exam-grid scoring)│
│  • services/  StorageService (iface) · ProgressService · AudioService · │
│               ContentService                                            │
└───────────────▲────────────────────────────────────────────────────────┘
                │  StorageService is an interface
┌───────────────┴────────────────────────────────────────────────────────┐
│  Persistence (swappable implementation)                                 │
│  • NOW:   LocalStorageStorage   (browser localStorage)                  │
│  • LATER: ApiStorage            (fetch → /api/* on the Node adapter)     │
└─────────────────────────────────────────────────────────────────────────┘
```

**Dependency direction is strictly one-way:** `UI → core → (storage impl)`. A
widget never reaches past `core` to localStorage directly; it asks
`ProgressService`, which asks `StorageService`. Swapping localStorage for an HTTP
backend is then a single new class registered in one composition-root file — no
widget changes.

`core/` has **no** import of Astro, Svelte, or the DOM (except `AudioService`,
which is the one allowed `window.Audio` touch-point and is itself behind an
interface so it can be no-op'd in tests/SSR). This keeps the whole domain layer
unit-testable in plain Node and extractable into its own npm package later.

---

## 4. Per-page data flow

### A lesson page (`/A1/01-erste-kontakte/`)

1. Astro loads the `lesson.md(x)` entry from the **lessons** content collection.
2. `@astrojs/mdx` renders the markdown; the component map binds `<AudioPlay>` →
   the `AudioPlay` island and `<details>` → the `Spoiler` style. Dialogs, `Hör zu`
   pronunciation lines, the `Hörtext` `<details>`, and `🎧 **Audio:**` links are
   recognized by a remark/rehype enrichment pass (reusing the exact regex
   semantics already in `scripts/generate_audio.py`) and upgraded into
   `DialogBlock` / `AudioPlay` surfaces. See `CONTENT-MODEL.md §Lesson`.
3. Output is a mostly-static HTML page; only the audio controls hydrate.

### An exercises page (`/A1/01-erste-kontakte/uebungen`)

1. Astro loads the lesson's entry from the **exercises** content collection
   (`exercises.yml`), validated against the Zod schema at build time — a malformed
   or answer-less exercise **fails the build**, never ships.
2. The page groups exercises by block (H, A, B, C, D) and renders one Svelte
   island per exercise via `ExerciseShell`, choosing the widget by `type`.
3. A page-level **`BlockRunner`** holds the collective state. Widgets report their
   state up but do **not** reveal correctness. When the learner clicks
   **„Auswerten"**, `BlockRunner` calls `GradingEngine.check()` for every exercise,
   flips all widgets to graded mode, asks `ScoringService` for the aggregate, and
   persists the result via `ProgressService`. See `SCORING.md`.

---

## 5. Repository layout (target — created during implementation, not in the docs task)

```
german-learning/
├── A1/ A2/ …                 # unchanged content; each lesson GAINS exercises.yml
│   └── NN-slug/
│       ├── lesson.md(x)      # SOURCE (hand-written, MDX-capable)
│       ├── exercises.yml     # SOURCE (new) — single source for the battery
│       ├── exercises.md      # GENERATED by gen-exercises (printable)
│       ├── solutions.md      # GENERATED by gen-exercises (printable)
│       └── audio/*.mp3       # generated by generate_audio.py (unchanged)
├── scripts/                  # existing Python audio pipeline (unchanged)
│   └── generate_audio.py
├── build/                    # new Node/TS content tooling
│   ├── gen-exercises.ts      # exercises.yml → exercises.md + solutions.md
│   └── import-exercises.ts   # ONE-TIME: existing md → exercises.yml (seed)
├── web/                      # the Astro app
│   ├── astro.config.mjs
│   ├── package.json
│   ├── src/
│   │   ├── pages/            # routing (index, level index, lesson, uebungen)
│   │   ├── layouts/
│   │   ├── components/       # .astro shells + .svelte islands (the widgets)
│   │   ├── content/          # content-collection config (Zod schemas) + loaders
│   │   └── core/             # framework-free TS: content/ engine/ services/
│   └── public/
├── docs/web/                 # ← THIS deliverable (the spec set)
└── .github/workflows/        # deploy-pages.yml (build → GitHub Pages)
```

> **Why `core/` lives under `web/src/core/` for now:** simplicity (one
> `package.json`, one `tsconfig`). It imports nothing framework-specific, so when
> a backend appears it can be lifted to `packages/core/` and shared between the
> Astro frontend and the Node API with no code changes. Document this boundary;
> do not pre-split the package.

---

## 6. The static → backend growth path

Nothing in the static phase forecloses the backend. The seam is the
`StorageService` interface plus Astro's adapter model:

| Concern | Now (static / GitHub Pages) | Later (backend, same repo) |
|---|---|---|
| Hosting | `output: 'static'`, `astro build` → `/dist` → Pages | add `@astrojs/node` adapter; `output: 'hybrid'`; self-host (Docker) |
| Progress data | `LocalStorageStorage` | `ApiStorage` → `src/pages/api/progress.ts` |
| Auth / payments (mentoring) | n/a | new `/api/*` routes + an `AuthService` in `core/services` |
| Widgets / lessons / scoring | — | **unchanged** |

Because the widgets call `ProgressService` (not storage) and `ProgressService`
calls `StorageService` (an interface), turning on the backend is: add the adapter,
add `/api` routes, register `ApiStorage` in the composition root. No widget,
lesson, or scoring code is touched. This is the concrete payoff of §3.

---

## 7. What is explicitly out of scope

- **Video.** Audio only. No video component is specified or built.
- **Server-side anything**, for the initial delivery (the path is designed, not
  built).
- **Real exam proctoring / anti-cheat.** Answers ship in the bundle by design.
- The implementation itself (scaffold, widgets, scripts, lesson migration) — this
  `docs/web/` set specifies it; `ROADMAP.md` sequences it.
