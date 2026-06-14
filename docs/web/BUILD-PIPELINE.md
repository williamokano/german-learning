# BUILD-PIPELINE.md — generation, build & routing

How the SOURCE files (`exercises.yml`, `lesson.md(x)`) become the printable
markdown, the answer key, and the website. Covers `gen-exercises`, lesson rendering
+ print-strip, the one-time importer, Astro content wiring, audio assets, and
routing.

---

## 1. `gen-exercises` — `exercises.yml` → `exercises.md` + `solutions.md`

`build/gen-exercises.ts` (Node/TS, run with `tsx`). The **structural twin** of
`scripts/generate_audio.py`: deterministic, idempotent, per-lesson or `--all`.

```
tsx build/gen-exercises.ts A1/01-erste-kontakte        # one lesson
tsx build/gen-exercises.ts --all                       # every exercises.yml in repo
tsx build/gen-exercises.ts --all --check               # CI: fail if committed md != generated
```

- Reads `<dir>/exercises.yml`, validates with the Zod schema (`CONTENT-MODEL.md §3`)
  — invalid file aborts with a clear error (never emits broken md).
- Writes `<dir>/exercises.md` and `<dir>/solutions.md`, fully overwriting (output is
  a pure function of input → reproducible).
- `--check` regenerates into memory and diffs against the on-disk files; non-zero
  exit on drift. Wire this into CI (`TECH-STACK.md §7`) so the printable artifacts
  can never silently fall out of sync with the source.

### 1.1 Render rules — `exercises.md` (must reproduce today's format exactly)

Heading for every exercise: `## Übung <id> — <title>` then a blank line, then
`instructions` (if any), then the body. A `recycledFrom` tag prints as `(L2)` after
the title. Block separators: `---` + `# Block H — Hören` etc., and the intro table
at the top (copy A1/03's pattern from `intro`).

| type | body render |
|---|---|
| `gap-text` (`layout: inline`, default) | the `text` with each `{n}` → `(n) ______`; markdown preserved. (C1-style paragraph) |
| `gap-text` (`layout: list`) | the `text` is a numbered list; each `{n}` → `______` (the list number is the reference). (A-block drills) |
| `table-fill` | a markdown table: `columns` header, each row `label` + cells (`given` text or `______`). |
| `gap-bank` | the gap text (as gap-text inline) + a bank line. Two presets: **C3** → `> WORD · WORD · …` (upper, sorted) with "Five words are not needed."; **H3** → `> (wort · wort · …)` (lowercase, gap order). Controlled by `bankCase`/`bankWrap`/`bankSort` flags (defaults pick the preset by block). |
| `single-choice` (`optionLayout: inline`, default) | `N. q` then `a) … b) … c) …` on one line. (C2/D) |
| `single-choice` (`optionLayout: block`) | `N. q  ` then each option on its own line, **two trailing spaces** per AUTHORING (except the last). (H1/H4 listening) |
| `true-false` | `N. statement ( )` (or `___`), one per line. |
| `matching` (`matchLayout: table`, default) | 3-column table `\| left \| \| right \|` (B4 style); right column lists all options incl. distractors. |
| `matching` (`matchLayout: list`) | each left text as a block, a `Topic: ______` / letter blank below, with the right options listed once at top (exam Anzeigen/Texte zuordnen). |
| `categorize` | a `> token · token · …` word list + an N-column empty table whose headers are the bucket labels. |
| `odd-one-out` | `N. a – b – c – d` (items joined by ` – `). |
| `order` | `N. tile – tile – tile` (shuffled tiles joined by ` – `). |
| `free-write` | the B9/C5 format: `**[Genre]**` + `> stimulus`, `**Your task:** …`, the `Use:` checklist (`- [ ] …`), the `Self-check:` checklist. (Copy AUTHORING §B9.) |
| `speaking-prompt` | each `part.label` + `prompt` + bullet cues. |

**Audio & transcript rendering (critical — preserves the audio pipeline):**
For any exercise with `audio`, gen-exercises emits the `🎧 **Audio:**
[file.mp3](audio/file.mp3)` line in the exact shape `generate_audio.py` recognizes
(`AUDIO_TAG`/`AUDIO_REF_RE`). For H4 Kurze Ansage exercises, the exercise carries a
`transcript` string (+ optional `audioContext` hints like the phone-filter trigger
"Bitte ruf mich zurück"); gen-exercises renders the `<details>` spoiler containing a
`🎧` link **and** the `**Ansage 1 — Transcript**` marker exactly as AUTHORING §H4
specifies. Because gen-exercises pre-writes the `🎧` links, `generate_audio.py` sees
them and **skips patching** (its `patch_exercises` checks 3 lines back) — it only
generates the MP3. So the new authoring order is:

```
edit exercises.yml → tsx build/gen-exercises.ts <dir> → python3 scripts/generate_audio.py <dir>/exercises.md
```

> `transcript`/`audioContext` are exercise fields; treat them as an extension of the
> `Base` schema in `CONTENT-MODEL.md §3` (add `transcript: z.string().optional()`,
> `audioContext: z.string().optional()`).

### 1.2 Render rules — `solutions.md`

Mirror every exercise id and block in order (H first, then A–D / exam parts). Per
type: print the answers, **bold** them, add a one-line explanation from `why`/`note`
where present, and list accepted alternatives ("auch richtig: …") from answer
arrays / `order.alt`. For `free-write`/`speaking-prompt`, print the `model` answer +
self-check. End the file with the Selbsttest threshold (**16+/20 → next Lektion**)
or, for exam lessons, the **full scoring grid + pass rule** from the `ExamGrid`
(`SCORING.md §6`).

### 1.3 Worked round-trip example (the fidelity proof)

Source (`A1/01/exercises.yml`, excerpt):

```yaml
- id: H3
  block: H
  type: gap-bank
  title: "Hörtext-Lückentext"
  audio: hoertext.mp3
  instructions: "Höre den Text und fülle die Lücken."
  bankWrap: paren            # H-block preset
  bankCase: as-is
  text: |
    Hallo! Ich {1} Yuki Tanaka. Ich {2} aus Japan, aus Osaka. Ich
    wohne jetzt in Berlin und {3} Deutsch. Ich {4} Japanisch,
    Englisch und ein bisschen Deutsch. Mein Deutschkurs ist {5} — wir
    sind {6} Studenten im Kurs.
  bank: [heiße, komme, lerne, spreche, super, zwanzig]
  answers: { 1: heiße, 2: komme, 3: lerne, 4: spreche, 5: super, 6: zwanzig }
```

Generated `exercises.md` (matches the current hand-written file):

```markdown
## Übung H3 — Hörtext-Lückentext

🎧 **Audio:** [hoertext.mp3](audio/hoertext.mp3)

Höre den Text und fülle die Lücken.

> Hallo! Ich (1) ______ Yuki Tanaka. Ich (2) ______ aus Japan, aus Osaka. Ich
> wohne jetzt in Berlin und (3) ______ Deutsch. Ich (4) ______ Japanisch,
> Englisch und ein bisschen Deutsch. Mein Deutschkurs ist (5) ______ — wir
> sind (6) ______ Studenten im Kurs.

> (heiße · komme · lerne · spreche · super · zwanzig)
```

Generated `solutions.md`:

```markdown
## Übung H3 — Hörtext-Lückentext

1. **heiße** 2. **komme** 3. **lerne** 4. **spreche** 5. **super** 6. **zwanzig**
```

> The web build, meanwhile, reads the **same `exercises.yml`** and renders the
> `GapBank` widget with `{1..6}` as drop-slots and `[heiße…zwanzig]` as the pool.
> One source, three outputs, no possible drift.

---

## 2. Lesson rendering & print-strip

### 2.1 Web rendering
Lessons render through `@astrojs/mdx` with:
- a **component map**: `AudioPlay` → the Svelte island; `details`/`summary` →
  `Spoiler` styling.
- **enrichment plugins** (remark/rehype) that recognize the existing markdown
  conventions and upgrade them — dialogs, `Hör zu` lines, the `Hörtext` `<details>`,
  `🎧 **Audio:**` links, `📌 Merkasten` blockquotes, vocab/Redemittel tables — into
  `DialogBlock` / `AudioPlay` / `Spoiler` / `Merkasten` / `VocabTable`. The plugins
  reuse the **exact regex semantics from `scripts/generate_audio.py`** so the page
  references the same audio filenames the script produced. Mapping table:
  `CONTENT-MODEL.md §6.3`.

### 2.2 Print-strip (for the PDF/book)
`build/strip-lesson.ts` turns `lesson.md(x)` → `lesson.print.md`:
- `<AudioPlay src="x">label</AudioPlay>` → `label`
- `<AudioPlay src="x" />` → removed (or a `🎧` glyph if `--keep-audio-glyph`)
- `<details>…</details>` → left intact (native; pandoc renders it fine)
- everything else passes through unchanged.
Then a PDF step (e.g. `pandoc`) consumes the stripped markdown. The PDF tooling
itself is a follow-up; **`strip-lesson` is the contract** this docs set guarantees.

---

## 3. `import-exercises` — ONE-TIME seed of `exercises.yml`

`build/import-exercises.ts`. Converts each existing `exercises.md` + `solutions.md`
into `exercises.yml`, so the 26 A1/A2 lessons get a source without re-authoring.

- Parses keyed on the **fixed H/A/B/C/D ids and known formats** (AUTHORING mandates
  them), pairing each exercise's gaps/options with the matching `solutions.md`
  entries by id and position.
- **Never silently guesses.** When confidence is low (ambiguous gap, an answer it
  can't align, a non-standard format), it emits the exercise with a
  `needsReview: true` marker + a comment and logs it, rather than inventing an
  answer. A human/LLM reviews flagged items before the yml is accepted as source.
- **Validation (round-trip):** after producing yml, run `gen-exercises` on it and
  `diff` the regenerated `exercises.md`/`solutions.md` against the originals. A small
  diff ⇒ high-confidence import; a large diff ⇒ review. This makes the migration
  self-checking.
- This tool is **scaffolding for migration only** (used in ROADMAP P5); it is not
  part of the steady-state pipeline. After migration, `exercises.yml` is authoritative
  and `import-exercises` is retired.

---

## 4. Astro content collections

`web/src/content.config.ts` defines two collections loaded from the repo content
dirs (which sit **outside** `web/`):

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { LessonFrontmatter, ExerciseSet } from './core/content/schema';

const lessons = defineCollection({
  loader: glob({ pattern: '*/*/lesson.{md,mdx}', base: '../' }),  // ../A1/01/lesson.md …
  schema: LessonFrontmatter,
});
const exercises = defineCollection({
  loader: glob({ pattern: '*/*/exercises.yml', base: '../' }),
  schema: ExerciseSet,                                            // validates at build
});
export const collections = { lessons, exercises };
```

- `base: '../'` resolves to the repo root so the globs pick up `A1/**`, `A2/**`,
  `B1/**`, … as they appear. (Confirm the relative base during scaffold; adjust if
  `web/` nesting differs.)
- The `exercises` schema validation means a bad `exercises.yml` **fails
  `astro build`** — the strongest possible guarantee against shipping a broken or
  answer-less exercise.

---

## 5. Audio assets

Lesson audio lives at `<level>/<nn>/audio/*.mp3` (Git LFS). To serve it statically:

- A small **prebuild mirror** (`build/mirror-audio.ts`, or an npm `prebuild`
  script) copies/symlinks `A*/**/audio/*.mp3` → `web/public/audio/<level>/<nn>/…`.
- `AudioService.resolve(lessonId, src)` builds the URL:
  `${import.meta.env.BASE_URL}audio/<level>/<nn>/<src>` (base-path correct for the
  `/german-learning/` project Pages site).
- In CI, the LFS pull (`TECH-STACK.md §7`) must run **before** the mirror so real
  MP3s (not LFS pointer files) are copied.

---

## 6. Routing & pages

Static routes generated from the collections via `getStaticPaths()`:

| Route | Page | Source |
|---|---|---|
| `/` | course index (levels, overall progress) | CURRICULUM + ProgressService |
| `/<level>/` | level index (lesson list + per-lesson status) | lessons collection |
| `/<level>/<nn-slug>/` | **lesson page** | lessons collection (MDX render) |
| `/<level>/<nn-slug>/uebungen/` | **exercises page** | exercises collection → widgets + `BlockRunner` |

Files: `web/src/pages/[level]/[lesson]/index.astro` and
`web/src/pages/[level]/[lesson]/uebungen.astro`, both pulling `getStaticPaths()` from
the matching collection. Lesson ↔ exercises cross-link in the layout (a tab/segmented
control: **Lektion | Übungen**). Respect `import.meta.env.BASE_URL` on every link.

---

## 7. End-to-end build order (summary)

```
# content authoring/build (per lesson)
edit exercises.yml
  → tsx build/gen-exercises.ts <dir>             # → exercises.md + solutions.md
  → python3 scripts/generate_audio.py <dir>/exercises.md   # H4 Ansage audio
edit lesson.md(x)
  → python3 scripts/generate_audio.py <dir>/lesson.md      # dialog/hoerzu/hoertext audio

# site build (CI)
git lfs pull
  → tsx build/mirror-audio.ts                    # audio → web/public
  → (optional) tsx build/gen-exercises.ts --all --check    # assert no drift
  → pnpm -C web build                            # Astro: validate yml + render → dist
  → deploy dist to GitHub Pages
```
