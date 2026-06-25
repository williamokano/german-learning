# German Lesson Reviewer — Architecture

This skill reviews a German lesson **end-to-end** — BOTH its teaching content
(`lesson.md` / `lesson-short.md`: grammar explanations, dialogs, Wortschatz,
Hörtext, reading texts, culture) AND its exercises (`exercises.yml`: schema,
answer logic, grammar), plus the consistency between them (dual-mode drift,
audio filenames, exercises-don't-outrun-the-lesson). The lesson content can be
wrong on its own, independent of any exercise. **Read `SKILL.md` first** — it is
the procedure and the persona.

It is the single, consolidated reviewer for this project. On 2026-06-25 the
short-lived `review-lesson` / `review-exercises` split was merged back into one
whole-lesson reviewer (see `decision-log.md`).

## File map

```
.claude/skills/review-lesson/
├── SKILL.md                              ← procedure + persona (READ FIRST)
├── README.md                             ← this file (architecture)
│
│   ── structural: per-level rules (edit on curriculum change) ──
├── guidelines-{A1,A2,B1,B2,C1}.md        ← grammar/vocab in/out of scope per level
├── exercise-guidelines-{A1,A2,B1,B2,C1}.md ← exercise types/distractors/block sizes per level
│
│   ── reference ──
├── review-checklist.md                   ← short checklist version of SKILL.md §4
├── curriculum.md                         ← CEFR progression + block structure per level
├── style-guide.md                        ← terminology & formatting for exercises
│
│   ── append-mostly knowledge base (grow after each review) ──
├── common-pitfalls.md                    ← recurring schema + grammar errors + reference grammar tables
├── false-positives.md                    ← acceptable constructions previously flagged (don't re-flag)
├── review-memory.md                      ← recurring issues across reviews
└── decision-log.md                       ← why review rules were added/changed
```

Only A1–B2 lessons exist in this project; C1 guidelines are present but
speculative, and there are no C2 lessons (the skill rejects `C2/…` paths).

## How to use this skill

1. The user (or another skill) names a lesson path (e.g. `review B2/03-...`).
2. **Detect the CEFR level** from the path prefix (`A1`/`A2`/`B1`/`B2`/`C1`).
3. **Load three files** before any check (all local to this dir):
   - `SKILL.md` — procedure + persona
   - `guidelines-{LEVEL}.md` — grammar/vocab scope
   - `exercise-guidelines-{LEVEL}.md` — exercise patterns
4. Apply the §4 review dimensions in `SKILL.md`.
5. Fix Critical + Major findings, regenerate, validate, commit, open a per-lesson PR.
6. If you found a new recurring pattern, propose an append to the matching
   knowledge-base file and apply it per the run's convention.

## Self-healing strategy

Three layers, by edit policy:

| Layer | Files | Edit policy |
|-------|-------|-------------|
| **Procedure** (how to review) | `SKILL.md`, `README.md` | Edit only when the user asks for a structural change. |
| **Per-level rules** (what's in/out of scope) | `guidelines-{level}.md`, `exercise-guidelines-{level}.md` | Edit when the curriculum changes or a level is added. |
| **Knowledge base** (recurring patterns, false positives) | `common-pitfalls.md`, `false-positives.md`, `review-memory.md`, `decision-log.md`, `style-guide.md`, `curriculum.md`, `review-checklist.md` | **Append-mostly.** Grow them; don't rewrite history. |

Why: procedure changes rarely, per-level rules track the curriculum, and the
knowledge base accumulates learnings so the reviewer keeps getting sharper
without prompt drift.

## Output

Default is a **concise fix-list** (the format that shipped A1–B2): the fixes
that matter, each with a severity tag, then regenerate → validate → commit → PR.
Emit the full scored audit report (executive summary, per-dimension table,
positive findings) **only** when the user asks for a "deep review" / "full audit".
See `SKILL.md` §6.
