# docs/web — Web app specification

Complete spec for turning this markdown course into an interactive website
(lessons + auto-graded, school-test-style exercises) that hosts on GitHub Pages now
and can grow a backend later. **Written to be implementable without further
planning.**

## Read in this order

| # | File | What it answers |
|---|---|---|
| 1 | [ARCHITECTURE.md](ARCHITECTURE.md) | The problem, the one-source/generated-artifacts model, the core↔UI boundary, the static→backend growth path, repo layout. |
| 2 | [TECH-STACK.md](TECH-STACK.md) | Astro + Svelte islands + framework-free TS core; deps, config, GitHub Pages CI, drag/drop & audio choices; why not the alternatives. |
| 3 | [CONTENT-MODEL.md](CONTENT-MODEL.md) | The `exercises.yml` Zod schema + TS types (every exercise type), the lesson inline-component vocabulary, exam grids, text normalization. |
| 4 | [COMPONENTS.md](COMPONENTS.md) | Each widget + shared component: props, view state, exact interaction (drag/click/keyboard), `check()` contract, reveal-at-end states. |
| 5 | [SCORING.md](SCORING.md) | GradingEngine (pure checkers), ScoringService, 80 % gate, A1/A2 exam scoring, ProgressService persistence + the StorageService swap seam. |
| 6 | [BUILD-PIPELINE.md](BUILD-PIPELINE.md) | `gen-exercises` (yml→md+solutions, render rules, round-trip proof), lesson MDX render + print-strip, the one-time importer, Astro content wiring, audio, routing. |
| 7 | [WEB-AUTHORING.md](WEB-AUTHORING.md) | How to author `exercises.yml` per type (worked examples) + embed `<AudioPlay>` in lessons + the generate/audio command order. The "AUTHORING.md for the web." |
| 8 | [ROADMAP.md](ROADMAP.md) | Phased build order P0–P6 with deliverables and done-criteria. |

[PLAN.md](PLAN.md) is the approved north-star plan + a resume marker.

## The one-paragraph summary

`exercises.yml` is the single source of truth for each lesson's exercise battery; a
generator (`gen-exercises`, the twin of `generate_audio.py`) compiles it into the
clean printable `exercises.md` + `solutions.md` **and** the website reads the same
YAML to render interactive Svelte widgets — so a gap and its answer can never drift.
Lessons stay hand-authored markdown with a tiny inline-component vocabulary
(chiefly `<AudioPlay>`), rendered live and stripped to text for print. All logic
(grading, scoring, persistence, audio) lives in a framework-free TypeScript `core/`
behind service interfaces; the UI (Astro pages + Svelte islands) is a thin shell.
Exercises behave like a school test: correctness is revealed only on „Auswerten",
then scored against the 80 % gate (or the telc/Goethe exam grid). Static to GitHub
Pages today; add the Node adapter + `/api` + `ApiStorage` later with no widget
changes.
