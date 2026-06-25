# A1 Review Run — Sequential, one lesson at a time

Re-review all 14 A1 lessons via the `review-lesson` skill (some A1 lessons were
only touched during the P5 migration and have never been deeply reviewed).
One lesson → fix → regenerate → validate → commit → push → next.

After each lesson, if I learn anything new, update the skill and write a
`feedback_*.md` memory entry.

**Workflow per lesson**
1. Mark status as `[~]` (in_progress) for the lesson below
2. Read `exercises.yml` fully
3. Apply all per-type + grammar checks
4. Fix every error found
5. `npx tsx build/gen-exercises.ts <lesson>` (regenerate)
6. `npx tsx build/gen-exercises.ts <lesson> --check` (must exit 0)
7. `git add` → `git commit` → `git push` to `main`
8. Mark status as `[x]` and note any skill update in the row

**Conventions**
- Never co-author commits.
- One lesson per commit; commit message `Review: <lesson-dir> — <summary>`.
- Skill updates: edit `.claude/skills/review-lesson/SKILL.md` AND
  write `feedback_*.md` to memory.

## Queue

| # | Lesson | Status | Commit |
|---|--------|--------|--------|
| 01 | A1/01-erste-kontakte | [x] clean (no fixes — gen pass) | — |
| 02 | A1/02-familie-und-freunde | [x] done | 7156c10 |
| 03 | A1/03-essen-und-trinken | [x] done | (C3 gap 1 ambiguity) |
| 04 | A1/04-wohnen | [x] done | (dialog drift: \* escape) |
| 05 | A1/05-mein-tag | [x] clean (no fixes — gen pass; duplicate "gehe" in C1 bank is intentional for 2 gaps) | — |
| 06 | A1/06-freizeit-und-hobbys | [x] clean (no fixes — gen pass) | — |
| 07 | A1/07-lernen-und-arbeiten | [ ] pending | — |
| 08 | A1/08-unterwegs-in-der-stadt | [ ] pending | — |
| 09 | A1/09-einkaufen-und-kleidung | [ ] pending | — |
| 10 | A1/10-gesundheit-und-koerper | [x] done | (dialog drift: \* escape) |
| 11 | A1/11-vergangenheit | [ ] pending | — |
| 12 | A1/12-termine-und-feste | [ ] pending | — |
| 13 | A1/13-aemter-telefon-alltag | [ ] pending | — |
| 14 | A1/14-pruefungstraining-a1 | [ ] pending | — |
