# German Lesson Reviewer — Architecture

This skill reviews the project's German lesson files for grammar, schema,
CEFR alignment, and pedagogical quality. **Read `SKILL.md` first** — it is the
procedure and the persona.

## File map

```
.claude/skills/review-lesson/
├── SKILL.md              ← procedure + persona (READ FIRST)
├── README.md             ← this file (architecture)
├── guidelines-A1.md      ← per-level scope rules (READ for A1 reviews)
├── guidelines-A2.md      ← per-level scope rules (READ for A2 reviews)
├── guidelines-B1.md      ← per-level scope rules (READ for B1 reviews)
├── guidelines-B2.md      ← per-level scope rules (READ for B2 reviews)
├── guidelines-C1.md      ← per-level scope rules (READ for C1 reviews)
├── review-checklist.md   ← short checklist version of SKILL.md §4
├── curriculum.md         ← CEFR progression summary
├── style-guide.md        ← terminology and formatting
│
│   ── append-only knowledge base ──
│   ── proposed after each review, user approves ──
│
├── common-pitfalls.md    ← recurring German errors, per-level
├── false-positives.md    ← acceptable constructions previously flagged
├── review-memory.md      ← recurring issues across reviews
└── decision-log.md       ← why new rules were added
```

## How to use this skill

1. The user (or another skill) names a lesson path (e.g. `review A1/03-essen-und-trinken`).
2. **Detect the CEFR level** from the path prefix (`A1`, `A2`, `B1`, `B2`, `C1`).
3. **Load `SKILL.md` + `guidelines-{LEVEL}.md`** — these together define what
   counts as correct or out-of-scope.
4. Apply the §4 review dimensions in `SKILL.md`.
5. After every review, output **Suggested Memory Updates** (per `SKILL.md` §5).
   The user approves each entry; approved entries are appended to the
   appropriate append-only file (`common-pitfalls.md`, etc.).

## Self-healing strategy

The skill has three layers:

| Layer | Files | Edit policy |
|-------|-------|-------------|
| **Procedure** (how to review) | `SKILL.md`, `README.md` | Only edit when the user explicitly asks for structural changes (e.g. adding a new review dimension). |
| **Per-level rules** (what's in/out of scope) | `guidelines-{level}.md` | Edit when the curriculum changes or a new level is added. |
| **Knowledge base** (recurring patterns, false positives) | `common-pitfalls.md`, `false-positives.md`, `review-memory.md`, `decision-log.md`, `style-guide.md`, `curriculum.md`, `review-checklist.md` | **Append-only.** Reviewer proposes entries; user approves and writes them. Prevents prompt drift. |

Why this design?

- **Procedure** changes rarely and only when the review process itself
  changes (e.g. adding a new dimension or output format).
- **Per-level rules** change with curriculum updates.
- **Knowledge base** grows continuously without ever rewriting prior content —
  the reviewer can always read the full history of what was learned.

## Suggested-memory-update format

After each review, produce a table like:

```markdown
## Suggested Memory Updates

| File | Action | Content |
|------|--------|---------|
| common-pitfalls.md | append | "**A1 H3 distractor count** — `bank.length - answers.length` must equal the 'N words not needed' claim in instructions. Example: A1/02 had bank=9, answers=6, claim=5 (wrong)." |
| false-positives.md | append | "**A1/14 dialog drift** — Prüfungstraining exam lessons intentionally skip dialogs in `lesson-short.md`. The Short is a grammar review, not a transcript." |
| review-memory.md | append | "**C3 cross-gap ambiguity** — recurring issue in A1/03 (ESSE/BRAUCHE) and A1/09 (GEFÄLLT/PASST/STEHT). Always check each bank word against all gaps." |
| decision-log.md | append | "Added §4.29 AI hallucination detection per user request 2026-06-25 — reviewer must verify invented grammar rules against Duden/Hueber." |
```

Do **not** auto-write to the memory files. Wait for user approval.
