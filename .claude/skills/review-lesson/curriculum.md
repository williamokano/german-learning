# Curriculum Summary

Per CEFR level, the project covers:

| Level | Lessons | Benchmark books | Instruction language |
|-------|---------|-----------------|----------------------|
| A1    | 14      | Menschen A1; Schritte international neu 1+2 | English |
| A2    | 14      | Menschen A2; Schritte international neu 3+4 | English |
| B1    | 14      | Menschen B1; Schritte international neu 5+6 | English/German mixed |
| B2    | 14      | Sicher! B2; Aspekte neu B2 | German only |
| C1    | 12 (planned, not yet authored) | Sicher! C1; Aspekte neu C1; Erkundungen C1 | German only |

**Total topics:** 68 lessons across 5 CEFR levels.

## Dependency rules (project-wide)

1. **Earlier rows only** — each lesson may use only its own row and earlier
   rows in the curriculum table (per `CURRICULUM.md`).
2. **Forward references as chunks** — a future-topic structure may appear
   *italicised as a fixed phrase* (e.g. *„Könnten Sie mir bitte sagen…"* at
   A1/13) but **never** as a conjugated form.
3. **Recycling rule** — every lesson explicitly reuses vocabulary and grammar
   from earlier lessons. Block D exercises always contain ≥20% review material
   from previous topics.
4. **One grammar anchor per lesson for A1** — pacing rule; B2/C1 may have up
   to 2 grammar anchors.
5. **Prüfungstraining (xx/14)** — exam lessons intentionally diverge from
   the Short/Full structure; their `lesson-short.md` is a grammar-review
   sheet, not a transcript.

## Grammar progression (at a glance)

```
A1:  sein, haben, articles, negation, modals (intro), separable verbs,
     Perfekt intro, accusative (intro)
A2:  Wechselpräpositionen, subordinate clauses intro, reflexive, comparative,
     adjective declension intro, Konjunktiv II polite, Futur I, relatives (intro)
B1:  Präteritum, Plusquamperfekt, alle cases (incl. Genitiv),
     Konjunktiv II real, Passive, relatives (all cases)
B2:  Konjunktiv I reported speech, Partizip I/II as adjective,
     Funktionsverbgefüge, Nominalstil, Wortbildung
C1:  Idioms, complex syntax, academic register, subtle meaning
```

## Vocabulary progression

- A1: high-frequency everyday vocabulary; numbers 0–1000; greetings
- A2: extended family, travel, work, health
- B1: abstract nouns, phrasal verbs, discourse markers, environment/society
- B2: academic vocabulary, complex compounds, professional register
- C1: idioms, proverbs, euphemisms, register-specific vocabulary

## Personas (anchor every dialog/reading)

| Character | Role | Origin | Voice key |
|-----------|------|--------|-----------|
| Anna | main female student (informal) | Russia, Jaroslawl → Berlin | Anna |
| Bruno | main male student (informal) | Brazil, Blumenau → Berlin | Bruno |
| Frau Weber | formal female interlocutor | German | Frau Weber |
| Herr Steinmeyer | formal male interlocutor | Austria, Salzburg → Berlin | Herr Steinmeyer |
| Frau Yilmaz | formal female authority (workplace) | German, Berlin | Frau Yilmaz |
| Yuki Tanaka | supporting student | Japan, Osaka → Berlin | Yuki |

When a new named character appears in a one-off context, make them a **minor**
character and document the relationship in the lesson. Do NOT add a new persona
file unless the character recurs.

## Cross-references

- Per-lesson scope rules: `guidelines-{LEVEL}.md`
- Production spec: `AUTHORING.md` and `AUTHORING-V2.md`
- Per-topic grammar anchors: `CURRICULUM.md` (the canonical source)