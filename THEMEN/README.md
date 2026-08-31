# THEMEN — Standalone Grammar Drill Sets

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

Each topic set is served at `/themen/<dir-slug>/uebungen/` (built by the same
`[level]/[lesson]/uebungen.astro` route the curriculum lessons use — it
derives its route purely from the `exercises` content collection, so a
directory here needs nothing but `exercises.yml` to become a working page).
A landing page at `/themen/` lists every set, grouped by topic and CEFR
level. (`/extra/` was the old address and still redirects there.)

## File layout and naming

```
THEMEN/<NN>-<topic-slug>-<level>/
└── exercises.yml   # hand-authored source
└── exercises.md    # generated — npx tsx build/gen-exercises.ts THEMEN/<dir>
└── solutions.md    # generated
```

- `NN` — two-digit topic number (own numbering, independent of A1–C1's).
- `<topic-slug>` — short kebab-case name for the grammar point.
- `<level>` — the CEFR level this specific file targets (`a1`, `a2`, `b1`,
  `b2`, `c1`). A topic that spans several levels gets one directory per
  level, e.g. `01-personalpronomen-a1/`, `01-personalpronomen-a2/`,
  `01-personalpronomen-b1/`.

## `exercises.yml` fields specific to THEMEN sets

Two optional `ExerciseSet` fields exist only for this use case (curriculum
lessons never set them):

- `topic:` — a human-readable group label shared by every level-variant of
  the same theme (e.g. `"Personalpronomen (Nominativ, Akkusativ, Dativ)"`).
  The `/themen/` index groups by this string.
- `level:` — the CEFR level (`A1`…`C1`), used for the level badge and for
  sorting variants of the same topic on the index page.

`lesson:` still follows the schema's regex, but uses the `EX/<dir-slug>`
shape instead of a real `LEVEL/NN` slot (e.g. `EX/01-personalpronomen-a1`) —
this keeps the id namespace-disjoint from real lessons, so localStorage
progress/Fehlerbuch keys never collide with an actual curriculum lesson.

The prefix stayed `EX/` when the directory was renamed from `EXTRA/` to
`THEMEN/`: these ids **are** the localStorage keys, so renaming them would
silently orphan every answer and Fehlerbuch entry a learner already has.
`SIT/` is the sibling prefix used by `SITUATIONEN/`.

## Workflow for adding a new set

Same discipline as a curriculum `exercises.yml`, scaled to a single topic:

1. Plan the grammar scope for this level (what's in bounds, what's the next
   level's job).
2. Write `exercises.yml` (Block A Basistraining → B Vertiefung → C
   Sprachbausteine/Prüfungstraining → D Wiederholung).
3. Review every item and its answer key by hand for correctness.
4. `npx tsx build/gen-exercises.ts THEMEN/<dir>` to generate the `.md` files.
5. `npx tsx build/gen-exercises.ts --all --check` to confirm no drift.
6. Commit and push before moving to the next set.

## Themen 08–20 (zweiter Batch, abgeschlossen)

Built the same way as 01–07, one file per CEFR level each topic reasonably
spans, same A/B/C/D block workflow:

- **08 — Perfekt: sein oder haben?** (A1/A2) — which auxiliary a verb takes
  and the Partizip II pattern (ge-…-t/ge-…-en, no ge- for -ieren verbs and
  inseparable prefixes).
- **09 — Präteritum der starken und schwachen Verben** (B1) — the written/
  narrative past tense, strong-verb stem changes memorized as their own set.
- **10 — Trennbare und untrennbare Verben** (A1/A2) — separable prefixes
  that jump to the end vs. inseparable ones that never split, plus the
  dual-meaning prefixes (umfahren, übersetzen).
- **11 — Wechselpräpositionen: Wo? vs. Wohin?** (A2/B1) — the nine two-way
  prepositions, Dativ/Akkusativ by location vs. direction, stellen/legen
  vs. stehen/liegen, contractions, and da(r)-/wo(r)-compounds for things.
- **12 — Modalverben: Präsens, Präteritum, subjektive Bedeutung** (A1/A2/B2)
  — present and simple-past conjugation, then the subjective/epistemic use
  for guesses and hearsay (er muss/soll/dürfte/mag/will reich sein).
- **13 — Passiv: Vorgang, Zustand, Passiv mit Modalverben, Passiversatz**
  (B1/B2) — Vorgangspassiv vs. Zustandspassiv, passive with a modal, and
  the four everyday alternatives (man, sich lassen, sein + zu, -bar).
- **14 — Konjunktiv II: Gegenwart und Vergangenheit** (A2/B1/B2) — polite
  requests and wishes, irreale Bedingungssätze, then the past form (hätte
  gemacht / wäre gegangen) for regrets and missed chances.
- **15 — Komparativ und Superlativ** (A2) — regular endings, umlaut-taking
  adjectives, irregulars, attributive vs. predicative position.
- **16 — Reflexive Verben: Akkusativ- und Dativ-reflexiv** (A2/B1) — echte
  vs. unechte reflexive Verben, and the Akkusativ/Dativ-reflexiv contrast
  on the same verb (ich wasche MICH vs. ich wasche MIR die Hände).
- **17 — Zweiteilige Konnektoren** (B1) — nicht nur…sondern auch, sowohl…als
  auch, entweder…oder, weder…noch, zwar…aber, and the inversion weder…noch
  triggers that the others don't.
- **18 — Futur I und Futur II** (A2/B1) — werden + Infinitiv for
  predictions vs. werden + Partizip II + haben/sein for completed-by-a-
  future-point actions, both against the everyday Präsens + time marker.
- **19 — Indirekte Rede: Konjunktiv I** (B2/C1) — reported speech's formal
  register (er sei, sie habe), and when it collides with the Indikativ and
  needs a Konjunktiv-II/würde-Ersatzform instead (mostly wir/sie-Plural).
- **20 — Nominalstil und Verbalstil** (B2) — turning a Nebensatz into a
  Präposition + Nominalisierung (weil es regnete → wegen des Regens),
  the hallmark of formal written German.
- **21 — Infinitivgruppen mit Komma** (A2/B1) — um…zu (Zweck) and
  ohne…zu (a missing action) at A2, plus (an)statt…zu and the
  same-subject rule at B1 (Er hofft, die Prüfung zu bestehen. vs. Er
  hofft, dass seine Tochter die Prüfung besteht. when the subjects
  differ); zu sits between prefix and stem for separable verbs
  (anzurufen, vorzubereiten).

## Weitere Themen (Ideen für später)

Nothing queued right now — the list above (01–21) covers pronouns, case,
adjective declension, the two-way prepositions, the whole verb-tense system
(Perfekt/Präteritum/Futur), Passiv, Konjunktiv II, indirect speech,
sentence-level connectors, and infinitive clauses. Suggest a new grammar
point here when one comes up; it'll follow the same
`THEMEN/<NN>-<topic-slug>-<level>/` layout and A/B/C/D block workflow as
everything above.
