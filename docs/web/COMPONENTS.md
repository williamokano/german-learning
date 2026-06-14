# COMPONENTS.md — widget & component catalog

Every exercise `type` in `CONTENT-MODEL.md` maps to exactly one **widget**. Widgets
are Svelte 5 islands holding **view state only**; all checking/scoring/persistence
is delegated to `core/` (see `ARCHITECTURE.md §3`). This file specifies each
component's **props, view state, interaction, and `check()` contract**.

---

## 0. Shared contracts

### 0.1 The exercise widget interface

Every graded widget conforms to one interface so `BlockRunner` can drive them
uniformly:

```ts
interface ExerciseWidget {
  // user-entered state, serializable for persistence (ProgressService)
  getState(): unknown;
  setState(s: unknown): void;
  // grade the current state; returns per-item results. Called ONLY on "Auswerten".
  check(): ItemResult[];
  // clear answers + return to ungraded mode
  reset(): void;
}

interface ItemResult {
  ref: string;        // gap number, item index, group index, "1".."n"
  correct: boolean;
  given: string;      // what the learner entered/selected (for display)
  expected: string;   // the correct answer (shown when wrong)
  scoreable: boolean; // false for self-assessed (free-write/speaking)
}
```

Widgets do **not** compute correctness themselves — `check()` calls the matching
`GradingEngine.check<Type>(source, state)` pure function (see `SCORING.md`). The
widget's only job around grading is to **render** the returned `ItemResult[]`.

### 0.2 Three visual states (the school-test rule)

```
ungraded  ──user interacts──▶ ungraded  ──"Auswerten"──▶ graded (read-only highlight)
                                                  │
                                          "Nochmal" (reset) ─┘
```

- **ungraded**: fully interactive; **never** shows right/wrong. No green/red, no
  hints, no "correct so far." This is the core requirement — the learner must be
  able to make mistakes without being told mid-stream.
- **graded**: inputs become read-only; each item is marked ✓ (correct) or ✗
  (wrong); wrong items reveal `expected`. Triggered only by the page-level
  **„Auswerten"** in `BlockRunner`.
- Reset (`Nochmal`) returns to ungraded and clears persisted answers for that
  exercise.

`graded` is a prop pushed down by `BlockRunner` (`graded: boolean` +
`results: ItemResult[]`), not owned by the widget — so one button grades the whole
page at once.

### 0.3 Drag interaction (shared by GapBank, Categorize, Order)

A single helper `makeDraggable(node, opts)` (Pointer Events, no library) plus
click handlers implements the **dual interaction** the owner specified:

- **Drag**: press a token and drag it onto a target slot/bucket; drop places it.
- **Click-to-place**: clicking a token (no drag) places it in the **next available
  target** (left-to-right / top-to-bottom).
- **Click-to-return**: clicking an **already-placed** token returns it to the pool
  as unused (frees its slot).
- **Keyboard a11y**: tokens are `tabindex=0`; Enter/Space = place-in-next /
  pick-up; Escape = return; arrow keys move focus between tokens/slots.
- **Pointer**: works for mouse + touch (use `setPointerCapture`); show a drag
  ghost; highlight the hovered valid target.

This helper lives in the widget layer (`web/src/components/lib/dnd.ts`), not in
`core/` (it touches the DOM). Spec it once; reuse in all three widgets.

---

## 1. `GapText` — free-text gaps  *(type: `gap-text`)*

Lückentext free-fill, verb/sentence fill-ins, `Finde den Fehler`,
`Antworten mit Hinweisen`, EN→DE translation, transformation drills.

- **Props**: `text` (with `{n}`), `answers`, `cues?`, normalization flags, `graded`,
  `results`.
- **Render**: split `text` on `{n}`; render each gap as an `<input>` sized to its
  expected answer; if `cues[n]` exists, show it as faint placeholder/suffix
  (`(heißen)`). Markdown in the surrounding text is rendered.
- **View state**: `{ [n]: string }` (what the learner typed).
- **check()**: `GradingEngine.checkText(answers[n], typed, flags)` per gap →
  `ItemResult` with `ref=n`.
- **graded render**: input border green/red; on wrong, show `expected` inline (e.g.
  a small chip after the input). Multiple accepted answers: show the first as
  `expected`, note "auch richtig: …" if `answers[n]` was a list.
- **A11y**: each input has an `aria-label` referencing its gap number + a visually
  hidden description; graded state announced via `aria-live`.

## 2. `TableFill` — grid of gaps  *(type: `table-fill`)*

Conjugation tables (A1, A3), modal-verb tables, plural/article grids.

- **Props**: `columns`, `rows`, plus the standard `graded`/`results`.
- **Render**: an HTML `<table>`; header = `columns`; each row's `label` is the row
  header; each cell is either static (`given`) or a `GapText`-style single input
  (one `{gap}`). Reuse the GapText input + grading per cell.
- **View state**: `{ [gap]: string }` across the whole grid.
- **check()**: per gap cell, same as GapText. `ref = gap`.
- Layout note: keep tables horizontally scrollable on narrow screens; never
  truncate.

## 3. `GapBank` — word-bank gaps  *(type: `gap-bank`)*

Sprachbausteine Teil 2 (C3), Hörtext-Lückentext (H3). **The flagship drag/click
interaction.**

- **Props**: `text` (with `{n}`), `bank` (tokens incl. distractors), `answers`,
  `audio?`, `graded`, `results`.
- **Render**: the text with each `{n}` as a **drop-slot**; below it, the **pool** of
  remaining bank tokens (shuffle-stable per session). A placed token sits in its
  slot and leaves the pool.
- **Interaction** (via the shared dnd helper, §0.3):
  - drag a pool token → a slot; or **click a pool token → it fills the next empty
    slot**; or drag/click between slots to move it.
  - **click a placed token → it returns to the pool**, freeing that slot.
  - a slot already holding a token rejects a second (or swaps — pick swap; document
    it): dropping onto an occupied slot returns the occupant to the pool and seats
    the new token.
- **View state**: `{ [n]: tokenId | null }` + pool order. Token identity must be
  stable even when the same word appears twice in the bank (use index-based ids,
  not the word string).
- **check()**: `GradingEngine.checkBank(answers[n], placedToken)` per slot. Because
  the schema guarantees each `answers[n]` is a member of `bank`, comparison is by
  token value (string-equal); duplicates in the bank both count as correct for any
  slot whose answer is that word.
- **graded render**: each slot green/red; wrong slots reveal the correct word.
- **Distractors**: bank length > number of gaps; leftover tokens remain in the pool
  (that's expected). Do not hint that they're unused.

## 4. `SingleChoice` — one correct option  *(type: `single-choice`)*

Sprachbausteine Teil 1 (C2), H1/H4 multiple-choice, C4 second text, many Block-D
items.

- **Props**: `items[].{q, options, answer, why}`, `audio?`, `graded`, `results`.
- **Render**: per item, the question then a radio group of `options` (`a) … b) …
  c) …`). One selectable per item.
- **View state**: `{ [itemIndex]: optionKey }`.
- **check()**: equality `selected === answer`. `ref = itemIndex`. `expected` = the
  correct option's text; `why` shown alongside when present.
- **graded render**: chosen option green if right / red if wrong; the correct option
  always highlighted green so the learner sees the right answer.

## 5. `TrueFalse` — Richtig/Falsch  *(type: `true-false`)*

Dialog Hör-Check (H1), C4 first text. A 2-state specialization of SingleChoice with
nicer affordance.

- **Props**: `items[].{q, answer, why}`, `positiveLabel`/`negativeLabel`, `audio?`,
  `graded`, `results`.
- **Render**: per item, the statement + an R/F segmented toggle (or two buttons).
- **View state**: `{ [itemIndex]: boolean | null }`.
- **check()**: `selected === answer`. graded render as SingleChoice.

## 6. `Matching` — connect two columns  *(type: `matching`)*

Frage↔Antwort (B4), Zuordnen, Paare finden, and exam `Anzeigen/Kurze Texte
zuordnen` (with **distractor** right-options).

- **Props**: `left[]`, `right[]` (may exceed `left` ⇒ distractors), `answers`,
  `graded`, `results`.
- **Interaction**: **click-left-then-right** to connect (primary, simplest on
  touch); optionally drag a connector line. Selecting a left item highlights it;
  clicking a right item links them; clicking an existing link clears it. Each left
  maps to exactly one right; a right may be reused only if the data says so
  (default: one-to-one; extra rights stay unused).
- **Render**: two columns; draw a connector (SVG line or a matched-pair list on
  narrow screens — provide a non-line fallback: show chosen letter next to each
  left item, like the print format `1 → d`).
- **View state**: `{ [leftKey]: rightKey | null }`.
- **check()**: `state[leftKey] === answers[leftKey]` per left item. `ref = leftKey`.
- **graded render**: each pair green/red; wrong ones show the correct right-key.

## 7. `Categorize` — sort into buckets  *(type: `categorize`)*

Begrüßung/Abschied (B7), `Kategorien`, der/die/das sorting.

- **Props**: `buckets[]`, `tokens[].{text, bucket, tag}`, `graded`, `results`.
- **Interaction**: same dnd helper (§0.3) — drag a token into a bucket; or click a
  token to drop it into the **currently focused** bucket (or cycle); click a placed
  token to return it to the pool. Buckets are columns/zones.
- **Render**: a pool of tokens + N labeled bucket zones. `tag` (e.g. `(F/I)`) is
  shown after grading, not before.
- **View state**: `{ [tokenIndex]: bucketKey | null }`.
- **check()**: `state[tokenIndex] === tokens[tokenIndex].bucket`. `ref = tokenIndex`.
- **graded render**: tokens turn green/red in place; wrong tokens show their correct
  bucket label.

## 8. `OddOneOut` — pick the outlier  *(type: `odd-one-out`)*

Odd one out / `Was passt nicht?` (D2).

- **Props**: `groups[].{items, odd, why}`, `graded`, `results`.
- **Interaction**: each group is a row of **clickable chips**; clicking one selects
  it (single-select per group); clicking again deselects.
- **View state**: `{ [groupIndex]: selectedItemIndex | null }`.
- **check()**: `selected === group.odd`. `ref = groupIndex`. `why` shown on grade.
- **graded render**: selected chip green if it equals `odd`, red otherwise; the true
  outlier always highlighted.

## 9. `Order` — arrange tiles  *(type: `order`)*

Satzbau / word order (B5), `Zeitkonnektoren ordnen`.

- **Props**: `items[].{tiles, answer, alt, note}`, `graded`, `results`.
- **Interaction**: per item, a row of word/chunk **tiles** (displayed shuffled).
  Reorder by drag (dnd helper) **or** by click-in-sequence (click tiles in order to
  build the sentence into a slot strip; click a placed tile to send it back). Both
  supported.
- **Render**: a "build strip" (the sentence being formed) + the remaining tiles.
- **View state**: `{ [itemIndex]: number[] }` — the current tile-index order.
- **check()**: `GradingEngine.checkOrder(answer, state, alt)` — accept `answer` or
  any permutation in `alt` (German V2 means several orders can be right; the data
  lists them). `ref = itemIndex`. `expected` = the canonical sentence.
- **graded render**: whole item green/red; on wrong, show a correct ordering.

## 10. `FreeWrite` — writing task  *(type: `free-write`, NOT auto-graded)*

Schreiben (C5), B9, exam Schreiben Aufgaben.

- **Props**: `prompt`, `genre?`, `stimulus?`, `minSentences?`, `use[]`,
  `selfCheck[]`, `model?`, `maxScore?`, `graded`.
- **Render**: the `stimulus` (a received message, styled as a quote) if present, the
  `prompt`, a textarea (autosaved), the **`use[]`** checklist (the required
  structures) and, after submit, the **`selfCheck[]`** checklist + a `Spoiler`
  revealing the `model` answer. The learner self-marks.
- **View state**: `{ text: string, selfMarks: boolean[], selfScore?: number }`.
- **check()**: returns `ItemResult`s with `scoreable:false` (no auto-grade). If
  `maxScore` is set (exam), expose a self-score stepper (0..maxScore) the learner
  sets after comparing to `model`; that value flows into exam scoring
  (`SCORING.md §Self-assessed items`).
- The model answer is **always behind a closed `Spoiler`** so it isn't seen before
  the learner writes.

## 11. `SpeakingPrompt` — speaking task  *(type: `speaking-prompt`, NOT auto-graded)*

Exam Sprechen (Teil 4a–c).

- **Props**: `parts[].{label, prompt, bullets}`, `criteria[]`, `maxScore?`, `graded`.
- **Render**: prompt cards (one per part) with bullet cues; a `criteria` rubric; a
  self-score control. Optional (future) "record your voice" via `MediaRecorder` —
  out of scope for v1, leave a clearly-marked extension point.
- **check()**: `scoreable:false`; self-score feeds exam scoring if `maxScore` set.

---

## 12. Shared / lesson components

### `AudioPlay`  *(the inline audio control + the player surface everywhere)*
- **Props**: `src` (lesson-relative mp3), `label?` (children). Two render modes:
  **label** (`<AudioPlay src>Guten Tag</AudioPlay>` → `Guten Tag ▶`) and **bare**
  (`<AudioPlay src/>` → `▶`).
- Thin view over `core/services/AudioService`: click → `AudioService.toggle(src)`;
  reflects `playing`. Enforces the **one-active-clip** policy globally (starting one
  stops others). Resolves `src` against the lesson's `audio/` dir + the site base
  path. Keyboard-activatable; `aria-label="Play: <label or filename>"`; shows a
  pause affordance while playing.
- Used in: lesson inline text, `DialogBlock`, `Hörtext`, and any exercise with an
  `audio` field (rendered in the `ExerciseShell` header).

### `Spoiler`  *(`<details>`/summary, **closed by default**)*
- Wraps native `<details>`; styled. Used for Hörtext & Ansage transcripts, hints,
  and FreeWrite model answers. **Always starts closed** (the owner's rule: it's a
  learning aid, fine to peek, but never pre-revealed).

### `Merkasten`  *(grammar callout)*
- Renders a `> 📌 **Merkasten — …**` blockquote (and its inner table) as a boxed,
  emphasized callout. Content-only; no interaction.

### `DialogBlock`  *(dialogue with audio)*
- Renders speaker turns (`> **Speaker:** …`) as a styled dialogue + an `AudioPlay`
  for the dialog clip (`dialog{n}[_x].mp3`). Built by the lesson enrichment pass
  (`CONTENT-MODEL.md §6.3`), not authored directly.

### `VocabTable` / `RedemittelTable`
- Styling wrappers over the markdown vocab / Redemittel tables (sticky header,
  zebra rows, optional "cover the German column" self-test toggle echoing the
  lesson's `✏️ Selbsttest Wortschatz` note). Content-only.

### `ExerciseShell`  *(per-exercise wrapper)*
- Renders the heading (`Übung <id> — <title>`), the `instructions`, the `audio`
  player if present, the `recycledFrom` tag, then the type-specific widget. Owns the
  per-exercise persistence wiring (load/save via `ProgressService`) and forwards
  `graded`/`results` from `BlockRunner`.

### `BlockRunner` / `TestRunner`  *(page orchestrator — the school-test brain)*
- Holds all exercises for a page (or a block). Subscribes to each widget's state.
- Renders the single **„Auswerten"** button. On click: calls every widget's
  `check()`, sets each to `graded` with its `results`, asks `ScoringService` for the
  block/lesson aggregate, shows the score panel, and persists via `ProgressService`.
- Renders **„Nochmal"** (reset all / reset one) and, for the score panel, the
  pass/fail verdict + next-lesson affordance (`SCORING.md`).
- For exam lessons, `TestRunner` is the variant that uses the `ExamGrid`
  (per-skill sub-scores, self-assessed parts, overall rule).

---

## 13. Component → engine mapping (summary)

| Widget | `GradingEngine` call | scoreable |
|---|---|---|
| GapText / TableFill | `checkText` per gap | ✓ |
| GapBank | `checkBank` per slot | ✓ |
| SingleChoice / TrueFalse | equality per item | ✓ |
| Matching | equality per left item | ✓ |
| Categorize | equality per token | ✓ |
| OddOneOut | equality per group | ✓ |
| Order | `checkOrder` (answer ∪ alt) per item | ✓ |
| FreeWrite / SpeakingPrompt | none (self-score) | ✗ |

All comparisons run **only** inside `GradingEngine` (pure, unit-tested). Widgets
render results; they never decide correctness. This keeps grading consistent across
widgets and testable without a browser.
