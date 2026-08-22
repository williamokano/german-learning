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

Candidates for the next batch of standalone sets, in the same format as
01–07 above (`EXTRA/<NN>-<topic-slug>-<level>/`) — one grammar point per
topic, one file per CEFR level it reasonably spans, same A/B/C/D block
workflow. Not commitments, just the next-in-line list.

- **08 — Perfekt: sein oder haben?** (A1/A2) — which auxiliary a verb takes
  (motion/change-of-state verbs → sein; everything else → haben) and the
  Partizip II pattern (ge-…-t for regular, ge-…-en for irregular, no ge-
  for -ieren verbs and inseparable prefixes be-/ge-/er-/ver-/zer-/ent-/miss-).
  The exact case the user asked about explicitly as a future topic.
- **09 — Präteritum der starken und schwachen Verben** (B1) — the written/
  narrative past tense as a companion to 08's spoken-register Perfekt;
  strong-verb stem changes (kommen → kam, gehen → ging) drilled as their own
  set, since they don't follow a rule and just have to be memorized.
- **10 — Trennbare und untrennbare Verben** (A1/A2) — separable prefixes that
  jump to the end in main clauses (aufstehen → Ich stehe früh auf) vs.
  inseparable prefixes that never split (verstehen → Ich verstehe das),
  plus the handful of prefixes that go either way with a meaning change
  (umfahren: separable = drive around something, inseparable = run over it).
- **11 — Wechselpräpositionen: Wo? vs. Wohin?** (A2/B1) — the nine two-way
  prepositions (in, an, auf, über, unter, vor, hinter, neben, zwischen)
  taking Dativ for location vs. Akkusativ for direction, paired with
  stellen/legen/hängen/setzen (Akk, causing movement) vs.
  stehen/liegen/hängen/sitzen (Dat, describing a resulting state).
- **12 — Modalverben: Präsens, Präteritum, subjektive Bedeutung** (A1/A2 →
  B2) — the six modals' present and simple-past conjugation first, then a
  B2-level set on their subjective/epistemic use for guesses and hearsay
  (er muss reich sein = "he must be rich", er soll reich sein = "he's said
  to be rich" — same modal, different meaning, no object case involved).
- **13 — Passiv: Vorgang, Zustand, Passiv mit Modalverben, Passiversatz**
  (B1/B2) — Vorgangspassiv (wird gebaut) vs. Zustandspassiv (ist gebaut),
  passive with a modal in the Satzklammer (muss gebaut werden), and the
  everyday alternatives to passive (man, sich lassen + Infinitiv, -bar
  adjectives, sein + zu + Infinitiv).
- **14 — Konjunktiv II: Gegenwart und Vergangenheit** (A2/B1 → B2) — polite
  requests and wishes (würde/könnte/hätte/wäre) first, then irreale
  Bedingungssätze (Wenn ich Zeit hätte, würde ich …), then the B2 past
  form (hätte gemacht / wäre gegangen) for regrets and missed chances.
- **15 — Komparativ und Superlativ** (A2) — regular endings, the small set
  of umlaut-taking adjectives (groß → größer, jung → jünger), irregulars
  (gut/besser/best-, viel/mehr/meist-), and attributive vs. predicative
  position (der schnellere Wagen vs. der Wagen ist schneller).
- **16 — Reflexive Verben: Akkusativ- und Dativ-reflexiv** (A2/B1) — echte
  reflexive Verben (sich freuen — only ever reflexive) vs. verbs that are
  reflexive only some of the time, and the Akkusativ/Dativ-reflexive
  contrast on the same verb (ich wasche MICH vs. ich wasche MIR die Hände).
- **17 — Zweiteilige Konnektoren** (B1) — nicht nur … sondern auch, sowohl
  … als auch, entweder … oder, weder … noch, zwar … aber — each with its
  own word-order quirk (weder…noch triggers inversion after weder; the
  others don't).
- **18 — Futur I und Futur II** (A2/B1) — werden + Infinitiv for predictions
  and intentions (Futur I), and werden + Partizip II + haben/sein for
  completed-by-a-future-point actions (Futur II) — both contrasted against
  simply using the present tense with a time marker, the far more common
  everyday choice.
- **19 — Indirekte Rede: Konjunktiv I** (B2/C1) — reported speech in its
  formal written register (er sagte, er SEI müde / er HABE keine Zeit),
  including when Konjunktiv I is indistinguishable from the indicative and
  Konjunktiv II substitutes in (sie sagten, sie HÄTTEN — not haben — Zeit).
- **20 — Nominalstil und Verbalstil** (B2) — turning a Nebensatz into a
  Präposition + Nominalisierung and back (weil es regnete → wegen des
  Regens; während er arbeitete → bei der Arbeit), the hallmark of formal
  written German.
