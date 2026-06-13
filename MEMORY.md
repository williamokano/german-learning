# MEMORY.md — Working memory for the German Learning course

This file tracks in-flight work, decisions, and lessons learned during
the production of the A1→C1 German course. It is the **orchestrator's
short-term memory**, complementing `tasks/todo.md` (dispatch board) and
`tasks/lessons.md` (long-term conventions log).

## Reading order for a fresh session

1. `MEMORY.md` (this file) — what is in flight right now, recent context
2. `tasks/todo.md` — high-level dispatch board
3. `tasks/lessons.md` — long-term conventions and lessons learned
4. `AUTHORING.md` — the complete lesson production spec
5. `CURRICULUM.md` — topic map

## Key conventions (short recap of `tasks/lessons.md`)

- Every `exercises.md` follows the four-block architecture: A Basistraining
  (10-12 ex.) · B Vertiefung (8-10) · C Prüfungstraining (5-6) · D
  Wiederholung & Selbsttest (3-5). **Target: 28-32 exercises / 180-220+
  items per topic.** Never ship below this. The volume is the product.
- Block H (Hören) is first, not counted in the 28-32 target.
- H1 = Dialog Hör-Check, H2 = Aussprache-Check (A1/01-04 only),
  H3 = Hörtext-Lückentext.
- C3 Sprachbausteine Teil 2: 15-word bank, 10 gaps, 5 distractors. **Verify
  each word fits exactly one gap** (no two-gap ambiguity).
- Block D must contain ≥20% review from earlier lessons, marked `(L<n>)`.
- Dialog audio lines end with TWO trailing spaces (`  `) for CommonMark
  line-break; this is required by the audio generator.
- Audio generator (ElevenLabs) patches `🎧 **Audio:** [slug.mp3](audio/slug.mp3)`
  into lesson.md automatically. Write the source markers, the generator
  adds the link.
- Run `python3 scripts/generate_audio.py <path>` (or `--section` to
  regenerate a single block). Skips files whose MP3 already exists.
- Push each lesson individually as it's done — do not accumulate.

---

## Current state (live)

**Done & pushed:**
- A1/01 through A1/14 (14 lessons)
- A2/01 through A2/10 (10 lessons, A2/10 just pushed)

**In flight (as of session 2026-06-13):**
- A2/11 Geben und schenken — three files written by subagent. **Need to
  verify + generate audio + push.**
- A2/12 Pläne und Zukunft — three files written by subagent. **Need to
  verify + generate audio + push.**
- A2/13 Menschen beschreiben — only `lesson.md` written (subagent
  returned empty result before writing exercises/solutions). **Need to
  finish exercises + solutions, then audio + push.**
- A2/14 Prüfungstraining A2 — not started. **Solo mock exam, do last.**

**Session plan (one lesson at a time, push after each):**
1. Verify A2/11 subagent output (3 files) → audio → push
2. Verify A2/12 subagent output (3 files) → audio → push
3. Finish A2/13 (write missing 2 files) → audio → push
4. A2/14 mock exam — solo, full Goethe/telc A2 format
5. Final batch: tick `tasks/todo.md` checkboxes, update
   `CURRICULUM.md` + `README.md` status lines.

---

## Subagent quality observations (A2/11, A2/12)

- Both subagents reported good metrics (30 ex, 231-260 items).
- **A2/11 subagent** did careful scope discipline — removed `wird …
  Infinitiv` (Futur I, A2/12) and `lässt … Infinitiv` (causative) from
  dialog/Lesetext to avoid scope leaks. Also fixed a "Brunos Schwester
  Anna" error (Anna is a Klassenkameradin, not his sister) — good
  persona check.
- **A2/12 subagent** also did strict scope discipline — caught and
  fixed Futur II leaks, an indirect `was` content clause (B1/L09),
  subject/object confusion in a catering sentence, and a C3 word-bank
  conflict. Very thorough.
- **A2/13 subagent** did not produce exercises.md or solutions.md
  before the task result was reported as empty. Need to inspect
  `lesson.md` to see if it's complete, then write the missing two
  files (or re-dispatch a subagent).

**Key pattern:** Subagents are reliable on `lesson.md` and exercise
design IF the prompt includes a strong gold-standard reference (A2/10
worked well). Always include the file path to a recent, well-validated
lesson in the prompt and explicitly tell the agent to mirror its
density, format, and audio-link placement.

---

## Conventions introduced in this session

- Audio generator speed for A2 is 0.90× (configured in
  `scripts/audio_config.json:level_speeds`).
- `Rezeptionistin` added to `scripts/audio_config.json:speaker_gender`
  as female (new hotel role in A2/10).

## Open questions / things to revisit later

- A2/14 mock-exam structure: needs to be designed from scratch (the
  AUTHORING.md is light on details for the exam format). Reference
  A1/14-pruefungstraining-a1 for the closest template.
- `tasks/lessons.md` should be updated with any new long-term rules
  from this session.
