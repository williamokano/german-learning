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

## Current state (live — as of 2026-06-13)

**Done & pushed (26 lessons):**
- A1/01 through A1/14 (14 lessons)
- A2/01 through A2/12 (12 lessons)

**In flight (next session picks up here):**
- A2/13 Menschen beschreiben — `lesson.md` is **complete and saved on
  disk** (uncommitted, in `A2/13-menschen-beschreiben/`). The folder has
  no `exercises.md` or `solutions.md` yet, and no audio has been
  generated. Audio links already point to the expected MP3 slugs.
- A2/14 Prüfungstraining A2 — not started. **Solo mock exam, do last.**
  This replaces the four-block structure with a full-length mock in the
  Goethe-Zertifikat A2 / telc Deutsch A2 format (Hören, Lesen, Schreiben,
  Sprechen). Use `A1/14-pruefungstraining-a1` as the closest template.

**Files to check on resume:**
- `A2/13-menschen-beschreiben/lesson.md` — already written
- `tasks/todo.md` — has the unchecked A2/13 + A2/14 boxes
- `CURRICULUM.md` and `README.md` — "Current status" already updated to
  "A2/01-A2/12 complete"

---

## Detailed handoff for A2/13

**Lesson already on disk:** `A2/13-menschen-beschreiben/lesson.md` (410
lines, 7 sections complete). Read it before writing the exercises.

**What the lesson covers:**
- Topic: describing people (appearance, character, family/relationships)
- Grammar: relative clauses with Nominativ and Akkusativ relative
  pronouns (`der/die/das/die` Nom; `den/die/das/die` Akk — only masc
  changes between cases). Verb at the end of the relative clause,
  comma before the relative clause.
- Dialog A: Anna tells Bruno about her new colleague Marko (Nom + Akk
  relatives on a single person)
- Dialog B: Frau Weber and Herr Steinmeyer discuss the new neighbour
  Klaus (Nom + Akk relatives, family member description)
- Lesetext: Mein Kollege Marko (reused in Block C, Lesen)
- Hörtext: Meine Freundin Lena (reused in Block H3 — different person
  from Lesetext, ✓ scene-different requirement)
- Audio slugs: `dialog1_a`, `dialog1_b`, `hoertext`

**What still needs to be written:**
1. `A2/13-menschen-beschreiben/exercises.md` — Block H (H1a, H1b, H3)
   + Block A (10-12 ex drilling relative pronouns in Nom/Akk) + Block
   B (8-10 ex with mixed application + Finde den Fehler) + Block C
   (Lückentext, Sprachbausteine 1+2, Lesen, Schreiben) + Block D
   (Schnelltest, Odd-one-out, Rückblick, Selbsttest).
2. `A2/13-menschen-beschreiben/solutions.md` — mirror numbering, accept
   alternates ("also fine: …"), ⚠️ notes on traps (e.g., confusing
   `der/den` based on the noun's role in the relative clause, not its
   role in the main clause).
3. Generate audio: `python3 scripts/generate_audio.py
   A2/13-menschen-beschreiben/lesson.md`.
4. Commit and push.

**Block D review sources to recycle from** (for ≥20% review content):
- A1/L2 (family vocabulary, possessive articles)
- A1/L3 (Akkusativ case, der → den change)
- A1/L9 (dative pronouns, gefallen)
- A2/L8 (adjective declension — appears inside relative clauses here)
- A2/L9 (Konjunktiv II polite)
- A2/L10 (Wechselpräpositionen — Kleidung/Aussehen sometimes uses these)
- A2/L11 (two-object verbs — useful for "den Mann, den ich kenne")
- A2/L12 (als vs. wenn — useful in the Lesetext or Hörtext)

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
