# MEMORY.md — Working memory for the German Learning course

This file tracks in-flight work, decisions, and lessons learned during
the production of the A1→C1 German course. It is the **orchestrator's
short-term memory**, complementing `tasks/todo.md` (dispatch board) and
`tasks/lessons.md` (long-term conventions log).

## How to resume a session

**Read first, in this order:**
1. `MEMORY.md` (this file) — what is in flight right now, recent context
2. `tasks/todo.md` — high-level dispatch board (checkboxes show progress)
3. `tasks/lessons.md` — long-term conventions and lessons learned
4. `AUTHORING.md` — the complete lesson production spec
5. `CURRICULUM.md` — topic map

**Then check the in-flight folder** (see "In flight" section below)
for any partial work — usually `lesson.md` is written but
`exercises.md` and `solutions.md` are not.

**Workflow per lesson (one at a time, push each):**
1. Verify lesson.md is complete (look at all 7 sections + audio links)
2. Write exercises.md (Block H → A → B → C → D, 28-32 ex / 180-220+ items)
3. Write solutions.md (mirror numbering, accept alternates, ⚠️ on traps)
4. `python3 scripts/generate_audio.py <path>/lesson.md` (generates 3 MP3s)
5. `git add` → `git commit` → `git push`
6. Update MEMORY.md, then move to next lesson

## Key conventions (short recap of `tasks/lessons.md`)

- Every `exercises.md` follows the four-block architecture: A Basistraining
  (10-12 ex.) · B Vertiefung (8-10) · C Prüfungstraining (5-6) · D
  Wiederholung & Selbsttest (3-5). **Target: 28-32 exercises / 180-220+
  items per topic.** Never ship below this. The volume is the product.
- Block H (Hören) is first, not counted in the 28-32 target.
- H1 = Dialog Hör-Check (one per dialog clip; H1a/H1b if two dialogs),
  H2 = Aussprache-Check (A1/01-04 only), H3 = Hörtext-Lückentext.
- C3 Sprachbausteine Teil 2: 15-word bank, 10 gaps, 5 distractors.
  **Verify each word fits exactly one gap** (no two-gap ambiguity).
- Block D must contain ≥20% review from earlier lessons, marked `(L<n>)`.
- Dialog audio lines end with TWO trailing spaces (`  `) for CommonMark
  line-break; this is required by the audio generator.
- Audio generator (ElevenLabs) patches `🎧 **Audio:** [slug.mp3](audio/slug.mp3)`
  into lesson.md automatically. Write the source markers, the generator
  adds the link.
- `python3 scripts/generate_audio.py <path>` skips files whose MP3 exists.
  Use `--section <slug>` to force-regenerate a single block.
- Push each lesson individually as it's done — do not accumulate.

## Audio file naming (per lesson)

Every lesson ships 3 MP3s in `<lesson>/audio/`:
- `dialog1_a.mp3` — Dialog A (informal `du`)
- `dialog1_b.mp3` — Dialog B (formal `Sie`) — if the lesson has two dialogs
- `hoertext.mp3` — §6 Hörtext (single announcer voice, 1.2 s pauses)

Lesson.md uses the audio-link pattern: `🎧 **Audio:** [slug.mp3](audio/slug.mp3)`.

## Persona roles (anchor every dialog/Lesetext/Hörtext to real personas)

| Character | Role | Origin | Voice key |
|---|---|---|---|
| Anna | main female student (informal) | Russia, Jaroslawl → Berlin | `Anna` |
| Bruno | main male student (informal) | Brazil, Blumenau → Berlin | `Bruno` |
| Frau Weber | formal female interlocutor | German | `Frau Weber` |
| Herr Steinmeyer | formal male interlocutor | Austria, Salzburg → Berlin | `Herr Steinmeyer` |
| Frau Yilmaz | formal female authority (workplace) | German, Berlin | `Frau Yilmaz` |
| Yuki Tanaka | supporting student | Japan, Osaka → Berlin | `Yuki` |

When a new named character appears in a one-off context (e.g., a
colleague mentioned in a relative-clause lesson), make the new name a
**minor** character and document the relationship in the lesson. Do NOT
add a new persona file unless the character recurs.

---

## One-lesson-at-a-time rule

Work on exactly **one lesson at a time**. Do not start the next lesson
until the current one is fully done, committed, and pushed. After each
step below, **tick the checklist** and update MEMORY.md before moving on.
This makes every save a checkpoint for the next agent.

---

## Current state (live — as of 2026-06-13)

**Done & pushed (28 lessons — A2 COMPLETE + retrofit in progress):**
- A1/01 through A1/14 (14 lessons) — retrofit pending
- A2/01 through A2/14 (14 lessons) — A2/01–06 retrofitted ✅

### Retrofit progress — A2 regular lessons (Merkasten + vocab recall + C3 expand + writing context)

| Lesson | Status |
|---|---|
| A2/01 Erzähl mal | ✅ retrofitted (commit 4e63e88) |
| A2/02 Zusammen wohnen | ✅ retrofitted (commit fa885c8) |
| A2/03 Begründen und erklären | ✅ retrofitted + C3 redesigned (commit 44a4c0c) |
| A2/04 Arbeit und Beruf | ✅ retrofitted + C3 fixed (commit ce64301) |
| A2/05 Gesund leben | ✅ retrofitted + C3 redesigned (commit 7eef3a3) |
| A2/06 Medien und Kommunikation | ✅ retrofitted (commit 1187a51) |
| A2/07 Vergleichen | ⏳ next batch |
| A2/08 Adjektive überall | ⏳ next batch |
| A2/09 Höflichkeit und Wünsche | ⏳ next batch |
| A2/10 Stadt, Land, Reisen | 🔲 |
| A2/11 Geben und schenken | 🔲 |
| A2/12 Pläne und Zukunft | 🔲 |
| A2/13 Menschen beschreiben | ✅ done (pilot, commit 36b111f) |
| A2/14 Prüfungstraining A2 | — exam lesson, not retrofitted |

### C3 integrity issues found during retrofit

Several original C3 exercises had critical integrity flaws (answer word used in multiple gaps). Fixed:
- A2/03: WARUM+WEIL each needed twice → complete redesign
- A2/04: BEGINN (noun) where verb BEGINNT needed; WENN used twice → fixed
- A2/05: MICH needed in 4 gaps → complete redesign

**Key lesson for future retrofits:** After subagent edits C3, always verify each answer appears exactly once. Run mental simulation of student solving each gap.

**Up next — A2/07–09 retrofit batch.**

**After all A2 done: retrofit A1/01–13, then start B1/01 Früher und heute.**

**Notes for B1 (for when we get there):**
- B1 instruction language: English/German **mixed**
- Scope B1/L01: Präteritum regular + irregular, Plusquamperfekt
- TTS speed for B1: check `scripts/audio_config.json:level_speeds`

---

## Subagent quality observations (A2/11, A2/12)

When dispatching parallel subagents, include in the prompt:
- A reference to a recent, well-validated lesson (e.g., A2/10) as the
  gold standard for format, density, dialog style, audio-link placement.
- A note that the subagent should run a self-review for German
  correctness.
- A explicit instruction to use only A1-A2 grammar/vocab and to flag any
  future-topic usage as a chunk with a footnote.

**What worked well:**
- A2/11 subagent did careful scope discipline — removed `wird …
  Infinitiv` (Futur I, A2/12) and `lässt … Infinitiv` (causative) from
  dialog/Lesetext to avoid scope leaks. Also fixed a "Brunos Schwester
  Anna" error (Anna is a Klassenkameradin, not his sister) — good
  persona check.
- A2/12 subagent also did strict scope discipline — caught and fixed
  Futur II leaks, an indirect `was` content clause (B1/L09), subject/
  object confusion in a catering sentence, and a C3 word-bank conflict.
  Very thorough.

**What did not work well:**
- A2/13 subagent returned an empty result before writing
  `exercises.md` and `solutions.md`. Only the `lesson.md` was produced.
  Lesson is on disk and looks complete (410 lines, all 7 sections), so
  it can be re-used — just need to write the missing two files.

---

## Conventions introduced this session (2026-06-13)

- Audio generator speed for A2 is 0.90× (configured in
  `scripts/audio_config.json:level_speeds`).
- `Rezeptionistin` added to `scripts/audio_config.json:speaker_gender`
  as female (new hotel role in A2/10).
- `MEMORY.md` introduced as the orchestrator's working-memory file
  (alongside `tasks/todo.md` and `tasks/lessons.md`). Mentioned in
  `README.md`.
- Push each lesson individually as it's done (not in batch at the end).

## Open questions / things to revisit later

- A2/14 mock-exam structure: needs to be designed from scratch. The
  AUTHORING.md is light on details for the exam format. Reference
  `A1/14-pruefungstraining-a1` for the closest template (it has all
  four skills, a full scoring grid, and a detailed answer key).
- `tasks/lessons.md` should be updated with any new long-term rules
  from this session (e.g., the per-lesson push rule).
- The Hörtext dry-run sometimes prints `[✗FRAG]` for transcripts that
  end with a closing quote (`"`) instead of `.`/`!`/`?`. This is a
  cosmetic warning in dry-run mode, not a generation error — the
  actual TTS handles it fine.
- A2 dialog 1_b sometimes gets auto-classified as "train" context
  because the dialog mentions "Zug". This is a minor issue — the
  background noise is added but the dialog is still intelligible.
