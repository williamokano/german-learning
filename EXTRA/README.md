# EXTRA — Standalone Grammar Drill Sets

This directory holds **topic-focused exercise batteries that are not part of
the A1→C1 curriculum**. They don't belong to any `lesson.md`/roadmap slot —
there's no lesson to read first, just a specific grammar point to drill,
sometimes with one version per CEFR level. Use them when you want to hammer
one structure (e.g. "personal pronouns in all three cases") without going
through a full lesson.

They reuse the exact same exercise engine as the curriculum lessons
(`exercises.yml` → generated `exercises.md`/`solutions.md`, same widget types:
`gap-text`, `gap-bank`, `single-choice`, `table-fill`, etc. — see
`docs/web/WEB-AUTHORING.md` for the per-type schema). The only structural
difference is that there is no `lesson.md`, `lesson-short.md`, `vocab.yml`,
or `audio/`.

## Where they live on the site

Each topic set is served at `/EXTRA/<dir-slug>/uebungen/` (built by the same
`[level]/[lesson]/uebungen.astro` route the curriculum lessons use — it
derives its route purely from the `exercises` content collection, so a
directory here needs nothing but `exercises.yml` to become a working page).
A landing page at `/extra/` lists every set, grouped by topic and CEFR level.

## File layout and naming

```
EXTRA/<NN>-<topic-slug>-<level>/
└── exercises.yml   # hand-authored source
└── exercises.md    # generated — npx tsx build/gen-exercises.ts EXTRA/<dir>
└── solutions.md    # generated
```

- `NN` — two-digit topic number (own numbering, independent of A1–C1's).
- `<topic-slug>` — short kebab-case name for the grammar point.
- `<level>` — the CEFR level this specific file targets (`a1`, `a2`, `b1`,
  `b2`, `c1`). A topic that spans several levels gets one directory per
  level, e.g. `01-personalpronomen-a1/`, `01-personalpronomen-a2/`,
  `01-personalpronomen-b1/`.

## `exercises.yml` fields specific to EXTRA sets

Two optional `ExerciseSet` fields exist only for this use case (curriculum
lessons never set them):

- `topic:` — a human-readable group label shared by every level-variant of
  the same theme (e.g. `"Personalpronomen (Nominativ, Akkusativ, Dativ)"`).
  The `/extra/` index groups by this string.
- `level:` — the CEFR level (`A1`…`C1`), used for the level badge and for
  sorting variants of the same topic on the index page.

`lesson:` still follows the schema's regex, but uses the `EX/<dir-slug>`
shape instead of a real `LEVEL/NN` slot (e.g. `EX/01-personalpronomen-a1`) —
this keeps the id namespace-disjoint from real lessons, so localStorage
progress/Fehlerbuch keys never collide with an actual curriculum lesson.

## Workflow for adding a new set

Same discipline as a curriculum `exercises.yml`, scaled to a single topic:

1. Plan the grammar scope for this level (what's in bounds, what's the next
   level's job).
2. Write `exercises.yml` (Block A Basistraining → B Vertiefung → C
   Sprachbausteine/Prüfungstraining → D Wiederholung).
3. Review every item and its answer key by hand for correctness.
4. `npx tsx build/gen-exercises.ts EXTRA/<dir>` to generate the `.md` files.
5. `npx tsx build/gen-exercises.ts --all --check` to confirm no drift.
6. Commit and push before moving to the next set.

## Weitere Themen (Ideen für später)

_This section is filled in as new topics are identified — see the running
list below for candidates not yet built._
