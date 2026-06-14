# Plan — Web app + authoring docs for the German course

> **Status: docs COMPLETE** (this task was docs-only). All 8 spec files +
> README + this plan are written under `docs/web/`:
> ARCHITECTURE · TECH-STACK · CONTENT-MODEL · COMPONENTS · SCORING ·
> BUILD-PIPELINE · WEB-AUTHORING · ROADMAP · README.
> Nothing is committed yet (commit when the user asks). **Next:** implementation
> follows `ROADMAP.md` (P0→P6); none started. The canonical plan also lives at
> `~/.claude/plans/partitioned-sprouting-sifakis.md`.

## Context

The course is 26 lessons (A1/01–14, A2/01–14) of hand-written markdown:
`lesson.md` (teaching), `exercises.md` (the H/A/B/C/D battery), `solutions.md`
(answer key), plus pre-generated `audio/*.mp3`. Lessons are **not 100% plain prose**:
the teaching text needs inline interactive components — above all an inline
audio-play affordance, e.g. `<AudioPlay src="GutenTag.mp3">Guten Tag</AudioPlay>`
renders `Guten Tag ▶`, and a bare `<AudioPlay src="..." />` renders just `▶` (for
when the transcript is already shown and only a play control is wanted). We want a
**website** that renders each lesson AND turns the exercises into **interactive widgets** (drag/click gap-fill,
free-text gaps checked at the end, audio players, spoilers, odd-one-out, matching,
etc.), behaving like a **school test** — mistakes allowed, right/wrong revealed only on
"Auswerten" at the end — with a **scoring** model that gates progression (≥80% / exam
grids). No backend now, but the architecture must grow one later (progress tracking,
paid mentoring) without a rewrite, and must host on **GitHub Pages** (no Vercel).

Today the markdown is the source of truth and stays human-readable (we also want a
printable PDF/book). So we will NOT pollute markdown with widget syntax. Two source
shapes follow from this, both keeping a single source of truth with the **print
artifact generated**: (a) **exercises** become a structured source that *generates*
the clean `exercises.md`; (b) **lessons** stay markdown but may embed a small,
documented inline-component vocabulary (chiefly `<AudioPlay>`), rendered live on the
web and **stripped to text for print/PDF** (`...>Guten Tag</AudioPlay>` → `Guten Tag`;
bare → dropped). GitHub's sanitizer already drops unknown tags but keeps inner text,
so lessons stay readable when browsed on GitHub too.

**This task produces documentation only** — the `docs/web/` spec set below, complete
enough that another agent implements the app with no further planning. No app code,
no scaffold, no lesson migration is written in this task.

## Locked decisions (from user)

1. **Source model.** New per-lesson structured file **`exercises.yml`** is the single
   source of truth for exercises. A Node/TS generator `gen-exercises` compiles it into
   the existing clean **`exercises.md`** (printable) + **`solutions.md`** (printable
   answer key) AND the web consumes the same YAML for widgets. Generated md must look
   essentially identical to today's hand-written md (so PDF/print + GitHub browsing are
   unaffected). A **one-time importer** seeds `exercises.yml` from existing md.
   **Lessons** stay the source of truth for teaching content, authored as
   **MDX-capable markdown** (rendered via `@astrojs/mdx`) carrying an inline-component
   vocabulary — chiefly `<AudioPlay>` (label mode `…>Guten Tag</AudioPlay>` →
   `Guten Tag ▶`, bare mode `<AudioPlay src/>` → `▶`) plus the existing native
   `<details>` spoiler. A **print pass strips these components to text** for clean
   PDF-ready markdown. (`generate_audio.py`'s `lesson.md` glob needs a one-line
   touch-up if lessons are renamed `.mdx` — noted as a follow-up, not this docs task.)
2. **Stack.** **Astro** (content-first, markdown-native, zero-JS reading pages, build-time
   schema validation) + **Svelte islands** for interactive widgets + a **framework-free
   TypeScript `core/`** (types, grading engine, services). Static `astro build` → GitHub
   Pages now; later add the **Node adapter + `/api` routes** in the same repo (self-host
   via Docker), swapping `StorageService` from localStorage to an API impl — widgets and
   lessons unchanged. No Vercel.
3. **Deliverable.** `docs/web/*.md` only.

## Architecture the docs will encode

### Source & generation flow
```
exercises.yml  ──gen-exercises──▶  exercises.md (print)  ──generate_audio.py──▶ audio/*.mp3
   (source)        (Node/TS)    └─▶  solutions.md (print)
       │
       └──Astro content collection (Zod) ──▶ typed model ──▶ Svelte island widgets
lesson.md(x) (hand-authored)  ──@astrojs/mdx──▶ lesson page (<AudioPlay>, <details>, …)
   (single source)            ──strip pass──▶ lesson.print.md ──▶ PDF/book
```
- `gen-exercises` is idempotent (per-lesson or `--all`), the structural twin of
  `generate_audio.py`. It renders `{1}`-style gaps → `______`, options → `a) b) c)`
  with AUTHORING's trailing-two-spaces rule, word banks → `> (w · w · …)`, and the
  Ansage transcript into the exact `**Ansage 1 — Transcript**` + `🎧` shape the audio
  generator already expects. **Authoring order going forward:** write `exercises.yml`
  → `gen-exercises` → `generate_audio.py exercises.md`.
- `import-exercises` (one-time): parses existing `exercises.md` + `solutions.md` keyed
  on the fixed H/A/B/C/D ids into `exercises.yml`. It **never silently guesses** — low
  confidence items are flagged for human/LLM review. Validation: regenerate md from the
  produced yml and diff against the original; small diff = high-confidence import.

### Exercise type → widget coverage (built from the actual A1/A2 corpus)
| `type` | Covers (existing exercises) | Interaction |
|---|---|---|
| `gap-text` | Lückentext free-fill (C1), verb/sentence fill (A2,A4–6,B1–2), transforms, EN→DE | free-text inputs, normalized compare, check at end |
| `table-fill` | conjugation tables (A1,A3), modal tables, plural/article grids | grid of `gap-text` inputs |
| `gap-bank` | Sprachbausteine 2 (C3), Hörtext-Lückentext (H3) | word-bank tokens: **drag**, or **click→next gap**, **click placed token→return to pool**; distractors in bank |
| `single-choice` | Sprachbausteine 1 (C2), H1/H4 MC, C4 text 2, many D | radio per item, reveal at end |
| `true-false` | Dialog Hör-Check (H1), C4 text 1 (R/F) | 2-state toggle (variant of single-choice) |
| `matching` | Frage↔Antwort (B4), Zuordnen, Paare finden, exam Aufgabe 6 | click-left-then-right or drag a connector |
| `categorize` | Begrüßung/Abschied (B7), Kategorien, der/die/das sort | drag tokens into N labeled buckets |
| `odd-one-out` | Odd one out / Was passt nicht? (D2) | groups of clickable items, select the outlier |
| `order` | Satzbau / word order (B5), Zeitkonnektoren ordnen | drag-reorder / click-in-sequence tiles |
| `free-write` | Schreiben (C5), B9, exam Schreiben | textarea, **not auto-scored**; reveal shows model answer + self-check checklist |
| `speaking-prompt` | exam Sprechen (Teil 4a–c) | prompt card(s), self-assessed vs criteria; optional voice record later |

Audio is a per-exercise `audio:` field, not a type (H1/H4 = choice/true-false + audio).
**No video** (explicitly out of scope).

### Shared components
`AudioPlayer`/`<AudioPlay>` — inline, two modes: **label** (`<AudioPlay src>Guten
Tag</AudioPlay>` → `Guten Tag ▶`) and **bare icon** (`<AudioPlay src/>` → `▶`); also
the player surface for dialogs/Hörtext/Hören clips; one-active-clip policy · `Spoiler`
(details/summary, **closed by default** — Hörtext & Ansage transcripts, hints, model
answers) · `Merkasten` callout · `DialogBlock` (speaker turns + audio) ·
`VocabTable`/`RedemittelTable` · `ExerciseShell` (title, instructions, body, per-exercise
state) · `BlockRunner`/`TestRunner` (collects all exercises on a page; the single
**"Auswerten"** action flips everything to show right/wrong + correct answers, then
computes the score — the school-test behavior).

### Grading & scoring
- Each widget exposes `getState/setState/check()/reset()`. **Nothing reveals correctness
  until "Auswerten."** Wrong items then surface the correct answer (learn from mistakes).
- `GradingEngine` (pure TS): per-type checkers + text normalization (case, umlaut/ß
  folding options, whitespace, accepted-alternatives list from `why`/`alt`).
- `ScoringService`: per-exercise `correct/scoreable`, per-block and per-lesson %.
  Standard lessons gate at **≥80%** (and D4 Selbsttest 16/20). **Exam lessons (NN/14)**
  use the official grid encoded in the yml (e.g. A2: Hören 15 / Lesen 20 / Schreiben 10
  = /45, pass ≥27; Sprechen self-assessed). Answers are baked into dist; client-side
  scoring is intentionally hackable for now.

### Services (framework-free `core/`, zero UI imports)
`StorageService` (iface → `LocalStorageStorage` now, `ApiStorage` later) ·
`ProgressService` (completion, scores, next-lesson unlock) · `AudioService` ·
`ContentService` (load typed model) · `GradingEngine`/`ScoringService`. Widgets depend
on core; core depends on nothing. This is the seam the future backend plugs into.

### Repo layout (documented target; not created in this task)
```
web/            Astro app — src/pages, layouts, components (.svelte islands + .astro)
web/src/core/   framework-free TS: types, grading engine, services (extractable later)
build/          gen-exercises.ts, import-exercises.ts
docs/web/       ← THE DELIVERABLE
A1/.. A2/..     unchanged; each lesson gains exercises.yml over time
```

### `exercises.yml` shape (illustrative; full schema in CONTENT-MODEL.md)
```yaml
lesson: A1/01
exercises:
  - { id: H1a, block: H, type: true-false, title: "Dialog Hör-Check: Dialog A",
      audio: dialog1_a.mp3, instructions: "Richtig (R) oder Falsch (F)?",
      items: [ { q: "Anna kommt aus Russland.", answer: true, why: "aus Jaroslawl." } ] }
  - { id: H3, block: H, type: gap-bank, title: "Hörtext-Lückentext", audio: hoertext.mp3,
      text: "Ich {1} Yuki. Ich {2} aus Japan ...",
      bank: [heiße, komme, lerne, spreche, super, zwanzig, wohne, bin],
      answers: { 1: heiße, 2: komme } }
```
`{n}` placeholders round-trip to `______` in print and to gap slots in the widget.

## Deliverable: `docs/web/` (8 files)

1. **ARCHITECTURE.md** — problem, source/generation flow diagram, repo layout,
   core-vs-UI boundary, the static→backend growth path, data flow per page.
2. **TECH-STACK.md** — Astro + Svelte islands + TS core rationale, GitHub Pages deploy
   (Actions workflow), the Node-adapter/`/api` future, dependency list & versions,
   why not Next/SvelteKit/etc. (1 paragraph).
3. **COMPONENTS.md** — full widget catalog: for each `type` and shared component →
   purpose, props, state shape, exact interaction spec (esp. gap-bank drag + click-to-place
   + click-to-return; reveal-at-end; spoilers closed by default; odd-one-out click-select),
   and `check()` contract. Includes the coverage table above.
4. **CONTENT-MODEL.md** — the `exercises.yml` Zod schema + TS types (discriminated union
   by `type`); the **lesson inline-component vocabulary** (`<AudioPlay>` label/bare props,
   `<details>` spoiler) + the auto-enrichment model for dialogs/Merkasten/Hörtext/audio
   refs reusing `generate_audio.py` regex semantics; normalization/alternatives rules.
5. **WEB-AUTHORING.md** — how to author `exercises.yml` per exercise type (one worked
   example each) **and how to embed `<AudioPlay>` in lessons** (label vs bare, when to
   use vs the auto `🎧` enrichment), the generation/audio command order, and a cross-link
   stub to add to `AUTHORING.md`. This is the "AUTHORING.md for the web" the user asked for.
6. **BUILD-PIPELINE.md** — `gen-exercises` spec (yml→md+solutions render rules,
   idempotency, `--all`); the **lesson MDX render + print-strip pass** (components →
   text for PDF); `import-exercises` spec (one-time, flag-don't-guess, round-trip diff
   validation); Astro content-collection wiring, audio-asset handling, routing.
7. **SCORING.md** — reveal-at-end flow, GradingEngine per-type checkers, normalization,
   per-block/lesson %, ≥80% gate, exam grids (A1 & A2 encoded), ProgressService persistence.
8. **ROADMAP.md** — phased, executable build order: P0 scaffold (Astro+Svelte+core,
   CI to Pages) → P1 lesson rendering → P2 grading engine + core widgets → P3 remaining
   widgets + scoring → P4 `gen-exercises` + importer → P5 migrate A1/A2 → P6 backend seam.
   Each phase: deliverable + done-criteria.

## Verification (of the docs)
- **Coverage:** every distinct exercise title in the A1/A2 corpus maps to exactly one
  documented `type` (the table above was derived by grepping all `## Übung` headings).
- **Round-trip fidelity:** docs include a worked A1/01 H-block `exercises.yml` → the
  `exercises.md`/`solutions.md` it must regenerate, demonstrating print output is
  unchanged.
- **Audio interplay preserved:** generated `exercises.md` keeps the exact Ansage
  transcript markers `generate_audio.py` depends on.
- **Self-containedness:** an implementing agent can build P0–P3 from the docs without
  re-reading the lessons.

## Out of scope (follow-ups, not this task)
App scaffold, widget implementation, the generator/importer scripts, A1/A2 migration,
the future backend. All are specified by the docs but built later.
