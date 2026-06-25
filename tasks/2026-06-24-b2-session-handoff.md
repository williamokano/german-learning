# Session Handoff — 2026-06-24 — B2 lessons review & deploy workflow

## Done this session (all pushed to `main`)

| Commit | Change |
|---|---|
| `6bf2aea` | `ci: include B2/** in deploy-pages.yml paths` |
| `d562873` | `Review: B2/02-passiv-und-alternativen — speaker labels + C3 distractor` |

Also pushed earlier in this conversation (from subagent reviews, now on `main`):
- `Review: B2/01-nominalstil-und-verbalstil — case errors in C1/B5/C3, model fix in B1`
- `Review: B2/04-indirekte-rede — C3 rendering bug`
- `Review: B2/05-partizipien-als-attribute — C3 distractor + answer ambiguity`

## Workflow change
- `.github/workflows/deploy-pages.yml` — added `- 'B2/**'` to the `paths` trigger so Pages deploys fire on B2 changes.

## B2 lessons present on remote `main`
- B2/01 Nominalstil und Verbalstil
- B2/02 Passiv und Alternativen
- B2/03 Vergangenheit der Möglichkeit
- B2/04 Indirekte Rede
- B2/05 Partizipien als Attribute
- B2/06 Modalverben subjektiv
- B2/07 Konnektoren für Profis
- B2/08 Funktionsverbgefüge

All are dual-mode (`lesson.md` Full + `lesson-short.md` Short) and ship `exercises.yml` (source) + `exercises.md` + `solutions.md`.

## Review status per B2 lesson

| Lesson | Status | Issues found & fixed |
|---|---|---|
| **B2/01** Nominalstil und Verbalstil | ✅ Reviewed & committed | 3 case errors (C1 gap 6, B5 gap 5, C3 gap 8 — Dativ→Akkusativ after *durch*; *zur der* → *zur*); 1 model fix (B1 item 2 spurious "Zug"). All other blocks clean. Drift clean. |
| **B2/02** Passiv und Alternativen | ✅ Reviewed & committed | Dialog B speaker labels: *"Dr. El-Sayed"* → *"Yusuf"*, *"Hannah El-Sayed"* → *"Hannah"* (full-name labels were falling through to wrong-gender male pool). C3 bank: MÜSSEN → HATTE (was ambiguous with SIND for gap 5). **Known minor:** MESSBAR/ERKENNBAR can each fit gaps 2 or 3 — left as known issue. Drift clean. |
| **B2/03** Vergangenheit der Möglichkeit | ⚠️ **NOT REVIEWED** | Subagent returned empty result twice. Needs fresh review. |
| **B2/04** Indirekte Rede | ✅ Reviewed & committed | C3 text had literal `(N)` markers alongside `{N}` placeholders, gapify auto-prefixed a second `(N)` → rendered as `(1) (1) ______`. Stripped literal `(N)`. All other blocks clean. Drift clean. |
| **B2/05** Partizipien als Attribute | ✅ Reviewed & committed | 1 C3 rendering bug (same as B2/04). 3 ambiguous distractors replaced (LACHENDE/GEGRUENDETE/GESTIEGENE → FLIEGENDE/BEDECKTE/ANGERECHNETE). WACHSENDEN↔STEIGENDEN overlap resolved by changing gap 10 noun from "Besucherzahlen" → "Sammlung". **Known minor:** SPIELENDEN/SCHLAFENDEN can each fit gaps 3 or 4 — left as inherent vocabulary ambiguity. Drift clean. |
| **B2/06** Modalverben subjektiv | ❌ **NOT REVIEWED** | Never dispatched. Needs fresh review. |
| **B2/07** Konnektoren für Profis | ❌ **NOT REVIEWED** | On remote but not yet reviewed. |
| **B2/08** Funktionsverbgefüge | ❌ **NOT REVIEWED** | On remote but not yet reviewed. |

## Schema validation status
After all committed fixes:
```
npx tsx build/gen-exercises.ts --all --check   # passes for every committed lesson
```

## Audio generation status
**No audio has been generated yet for any B2 lesson.** Every lesson needs:
- `dialog1_a.mp3` (Dialog A — from `lesson.md` §1 Dialog A block)
- `dialog1_b.mp3` (Dialog B — from `lesson.md` §1 Dialog B block)
- `hoertext.mp3` (from `lesson.md` Hörtext section)
- `transcript_ansage1.mp3` (from `exercises.md` H4 transcript block)

**Dedup note (important):** The audio generator (`scripts/generate_audio.py`) reads only `lesson.md`, not `lesson-short.md`. So dialog/hoertext MP3s are generated once from the Full prose version and reused by the Short version automatically (both reference the same `<audio/...>` paths). Only generate from `lesson.md` to avoid duplicate work.

## Next session — what to do

1. **Review B2/03, B2/06, B2/07, B2/08** using the same subagent pattern (one subagent per lesson). Each subagent edits `exercises.yml`, regenerates, validates, stages, reports back. **Do not commit/push** from subagent — orchestrator commits + pushes per lesson.

2. **After all 8 reviews done**, run audio generation:
   ```bash
   export ELEVEN_API_KEY=...
   python3 scripts/generate_audio.py B2/01-nominalstil-und-verbalstil/lesson.md
   python3 scripts/generate_audio.py B2/02-passiv-und-alternativen/lesson.md
   # ... etc for B2/03–08
   python3 scripts/generate_audio.py B2/*/exercises.md   # for H4 transcripts
   ```
   The generator skips files whose MP3 already exists, so this is idempotent.

3. **Update `MEMORY.md`** with B2 progress section (mirror the A2 retrofit block style).

## Important conventions / gotchas

- **Speaker labels**: must be exact voice keys from `scripts/audio_config.json:voices`. Full-name labels like `"Dr. El-Sayed"` / `"Hannah El-Sayed"` fall through to default-male pool. Use first names ("Yusuf", "Hannah", "Anna") or surnames ("Steinmeyer") that match a `voices` key. See B2/02 fix for example.
- **C3 integrity**: bank must have 15 items, 10 answers, 5 distractors. Each answer must fit EXACTLY one gap (no two-gap ambiguity). Parens hints are the conventional way to disambiguate (see B2/01 C3).
- **Dual-mode drift**: dialog turns + Hörtext transcript + Wortschatz noun articles/plurals must match between `lesson.md` and `lesson-short.md`. Always diff after edits.
- **The skill `review-exercises`** auto-loads when reviewing lessons and has the full type-specific checklist. Invoke via `skill review-exercises`.
- **Commit messages**: never include `Co-Authored-By` (per CLAUDE.md).
- **One commit per lesson**: don't batch lesson reviews into a single commit.

## Known issues carried forward

- **B2/02 C3** — MESSBAR and ERKENNBAR can each fit either gap 2 or gap 3. Acceptable for now; would require a major C3 redesign to fully fix.
- **B2/05 C3** — SPIELENDEN/SCHLAFENDEN can each fit either gap 3 or gap 4. RESTAURIERTE could marginally fit gap 1; GEKAUFTEN could marginally fit gap 2. Inherent to the vocabulary.

## File references for the next session

- Workflow: `.github/workflows/deploy-pages.yml:7-11`
- Audio generator: `scripts/generate_audio.py`
- Audio config (voices, level_speeds, contexts): `scripts/audio_config.json`
- Generator/validator: `build/gen-exercises.ts`
- Skill: `.claude/skills/review-exercises/SKILL.md`
- Personas: `personas/*.md`
- Memory: `MEMORY.md`