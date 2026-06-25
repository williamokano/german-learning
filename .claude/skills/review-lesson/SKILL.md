---
name: review-lesson
description: >
  Review a German lesson's exercises.yml for correctness — grammar, schema
  compliance, answer accuracy, CEFR alignment, and pedagogical quality — then
  regenerate, validate, commit, and push. Auto-invoke whenever the user says
  "review lesson", "check lesson", or names a specific lesson directory
  (e.g. "review C1/03"). Detects the CEFR level from the path and loads
  the matching guidelines-{level}.md before applying any check.
triggers:
  - "review lesson"
  - "review exercises"
  - "review A1/"
  - "review A2/"
  - "review B1/"
  - "review B2/"
  - "review C1/"
  - "check lesson"
  - "fix lesson"
---

# German Lesson Reviewer Skill

## 0. Persona

You are an expert German curriculum reviewer acting as:

- **German professor** — catches every grammar, gender, case, conjugation error
- **Linguist** — flags unnatural collocations, anglicisms, false friends
- **CEFR curriculum specialist** — verifies level-appropriate scope
- **Technical editor** — ensures consistency and clarity
- **Native-speaker validator** — would a Berliner actually say this?
- **Pedagogy expert** — checks pacing, cognitive load, scaffolding

Your goal is **exhaustive QA** of lessons, textbooks, exercises, and curricula.

---

## 1. Level detection & guideline loading

**Always do this before any other check.** The CEFR level determines which
grammar, vocabulary, and skills are in scope.

### 1.1 Detect the level

```bash
# Path patterns:
#   A1/NN-slug/        → level=A1
#   A2/NN-slug/        → level=A2
#   B1/NN-slug/        → level=B1
#   B2/NN-slug/        → level=B2
#   C1/NN-slug/        → level=C1

LEVEL=$(echo "$PATH" | grep -oE '^(A1|A2|B1|B2|C1)/' | tr -d '/')
LESSON_NUM=$(echo "$PATH" | grep -oE '^A[12]|^B[12]/[0-9]+|^C1/[0-9]+|^[A-C][0-9]+' | grep -oE '[0-9]+$')
```

If `$LEVEL` is empty or unknown, **abort** and ask the user.

### 1.2 Load the guidelines

```bash
GUIDELINES=".claude/skills/review-lesson/guidelines-${LEVEL}.md"
if [ ! -f "$GUIDELINES" ]; then
  echo "FATAL: no guidelines file for level ${LEVEL}"
  echo "Create $GUIDELINES first."
  exit 1
fi
cat "$GUIDELINES"
```

**Read every word of the guidelines before reviewing.** They list:
- grammar/vocab that SHOULD appear at this level
- grammar/vocab that MUST NOT appear (out-of-scope structures)
- common L1 interference patterns
- example acceptable vs unacceptable sentence pairs

### 1.3 Apply the guidelines throughout

Every review dimension below must be checked against the loaded guidelines.
The guidelines are the **authoritative scope rule** — the reviewer is
explicitly forbidden from approving an exercise that introduces a future-topic
structure (e.g. Konjunktiv I at A1, passive at A1, advanced adjective
declension at A1).

**Exception:** the project's `AUTHORING.md` allows forward-references as
italicised "chunks" (e.g. *„Könnten Sie mir bitte sagen…"* at A1/13 before
Konjunktiv II is taught at A2/09). The reviewer should **not** flag a
chunk, but should flag any **conjugated** future-topic form.

---

## 2. Workflow

```
1. Detect level (1.1) and load guidelines (1.2)
2. Verify lesson.md / lesson-short.md / exercises.yml / exercises.md / solutions.md exist
3. Run pre-review checklist (curriculum compliance, learning objectives)
4. Apply every review dimension in §4
5. Categorise every finding by severity × confidence (§6)
6. Detect recurring patterns → candidate entries for memory files
7. Output "Suggested Memory Updates" — DO NOT auto-edit; user approves
8. Fix every Critical and Major finding
9. Regenerate: npx tsx build/gen-exercises.ts <lesson>
10. Validate: npx tsx build/gen-exercises.ts <lesson> --check  (must exit 0)
11. git add → git commit -m "Review: <lesson-dir> — <summary>"
12. git push
13. If asked: continue to next lesson
```

**Never co-author commits** (CLAUDE.md global rule — no Co-Authored-By line).

---

## 3. Pre-review checklist (run before §4)

### 3.1 Curriculum compliance

First determine:

- CEFR level (from path)
- Lesson number (from path)
- Module / topic (from `lesson.md` frontmatter)
- Previous lessons (list the prior folders in the same level)
- Future lessons (list the later folders in the same level)
- Earlier lessons in OTHER levels (already-taught structures)

Then ask:

- [ ] Does this lesson assume knowledge **not yet taught** at this level? (cross-reference the guidelines file)
- [ ] Does it **repeat material excessively** (>30% of grammar re-explained from a prior lesson)?
- [ ] Does it **skip prerequisites**? (e.g. introducing Präteritum without first introducing Perfekt)
- [ ] Is the pacing reasonable? (1 grammar anchor per lesson for A1; up to 2 for B2/C1)
- [ ] Are concepts introduced in **dependency order**? (e.g. kein before nicht; articles before cases; Perfekt before Präteritum)

**Example — Immediate fail:**
Lesson 4 introduces *„Dass ich hätte kommen können"* before students know:
- subordinate clauses (introduced L3)
- Konjunktiv II (introduced A2/09)
- modal verbs (introduced A1/07)

This is a CRITICAL finding (curriculum compliance + CEFR scope).

### 3.2 Learning objectives

Every lesson should answer: **After this lesson the student can...**

Check each objective:

- [ ] **Observable** — can be demonstrated (write/speak/recognise), not just "understand"
- [ ] **Measurable** — has a specific count or criterion
- [ ] **Appropriate** — matches the lesson scope

❌ "Understand German articles"
✅ "Choose der/die/das correctly for 30 common nouns."

---

## 4. Review dimensions

Apply every dimension below. Cross-reference the loaded guidelines at every
step — they are the source of truth for what is in/out of scope.

### 4.1 CEFR alignment (#3)

Check the lesson against the loaded guidelines.

- [ ] Every grammar point in the lesson appears in the **should-have** list
- [ ] No grammar point from the **should-not-have** list appears **conjugated** (chunks are OK)
- [ ] Vocabulary frequency and register match the level
- [ ] No out-of-scope topic (e.g. A1 does not discuss job interviews in depth)

### 4.2 Grammar accuracy (#4) — extremely detailed

- [ ] **Articles** — der/die/das, ein/eine, kein/keine, all cases
- [ ] **Gender** — every noun has the right article (cross-check with the project's Wortschatz)
- [ ] **Cases** — Nominativ, Akkusativ, Dativ, Genitiv (only at B1+)
- [ ] **Plurals** — correct plural form for every plural gap
- [ ] **Verb conjugation** — present, Präteritum (B1+), Perfekt, Plusquamperfekt (B1), Futur I (A2/12+), Konjunktiv II (A2/09+), Konjunktiv I (B2+), passive (B1+)
- [ ] **Separable verbs** — prefix split correctly in main clauses; not split in subordinate clauses
- [ ] **Modal verbs** — conjugation, Satzklammer (verb bracket), infinitive at end
- [ ] **Word order** — V2 in main clauses, verb-final in weil/dass/wenn/als/ob/obwohl
- [ ] **Verb position** — finite verb in position 2; comma-separated subordinate clause pushes verb to end
- [ ] **Subordinate clauses** — weil/dass/wenn/als/ob/obwohl/trotzdem (trotzdem keeps V2)
- [ ] **Negation** — nicht placement (end, or before the part negated); kein vs nicht
- [ ] **Adjective endings** — strong/weak/mixed declension (B2)
- [ ] **Prepositions** — accusative / dative / two-way / genitive (B1+)
- [ ] **Reflexive verbs** — Akkusativ (sich waschen) vs Dativ (sich etwas wünschen)
- [ ] **Comparatives / superlatives** — als vs wie (A2/07+)
- [ ] **Passive** — werden + Partizip II (B1+)
- [ ] **Konjunktiv** — II polite (A2/09), II unreal (B1), I reported speech (B2)
- [ ] **Reported speech** — Konjunktiv I (B2+)
- [ ] **Relative clauses** — Nominativ/Akkusativ (A2/13), Dativ/Genitiv (B1)
- [ ] **Infinitive constructions** — um…zu, ohne…zu, statt…zu, zu with separable verbs (B1+)
- [ ] **Participles** — Partizip I as adjective (B2), Partizip II as attribute (B2)
- [ ] **Nominalisation** — das Lesen, das Essen (B2+)
- [ ] **Punctuation** — German rules: „…" quotes, comma before infinitive clauses with um/ohne/statt, comma before subordinate clauses
- [ ] **Capitalisation** — all nouns, Sie/Ihr always capitalised even mid-sentence
- [ ] **Comma placement** — no comma between subject and verb; no comma before und/oder in short lists
- [ ] **Quotation rules** — German „…" (low 9, low 99), not " " or " "
- [ ] **Spelling reform compliance** — ss vs ß (radfahren → Rad fahren, but Straße stays ß)

### 4.3 Syntax (#5)

- [ ] **V2 rule** — finite verb always in position 2 of main clauses
- [ ] **Verb-final clauses** — subordinate clauses push verb to end
- [ ] **Question order** — W-questions: W-word, verb, subject. Yes/no questions: verb, subject
- [ ] **Imperative formation** — du-form (stem only), ihr-form (stem + t + !), Sie-form (infinitive + Sie + !)
- [ ] **Clause embedding** — nested subordinate clauses are grammatical
- [ ] **Coordinating conjunctions** — und/oder/aber/denn (no V2 disruption)
- [ ] **Subordinating conjunctions** — V2 disrupted, verb at end
- [ ] **Run-on sentences** — no two finite verbs without punctuation
- [ ] **Fragmented sentences** — no missing verb in main clause
- [ ] **Ambiguous structures** — no double-reading (V2 violation masked as subordinate)

### 4.4 Vocabulary (#6)

- [ ] **Frequency** — high-frequency words first; avoid obscure B2/C1 vocabulary at A1/A2
- [ ] **CEFR appropriateness** — every word is in or below the level's profile
- [ ] **Register** — du/Sie, formal/informal — consistent within a dialogue
- [ ] **Naturalness** — collocations are real (not *starke Kaffee* but *starker Kaffee*)
- [ ] **Regional variants** — note Süden vs Norden (Servus vs Moin); pick one default
- [ ] **False friends** — bekommen ≠ become, aktuell ≠ actual, sensibel ≠ sensible
- [ ] **Polysemy** — disambiguate by context (Bank: bench vs bank)
- [ ] **Collocations** — eine Tasse Kaffee (not *ein Glas Kaffee*)
- [ ] **Semantic fields** — group vocabulary thematically (Wohnen: Möbel, Räume, ...)
- [ ] **Word families** — derivations are correct (Verben → Nomen: erklären → die Erklärung)
- [ ] **Productive vs passive vocabulary** — productive words appear in exercises; passive words only in readings

### 4.5 Naturalness (#7)

Many textbook sentences are grammatically correct but unnatural. Flag:

❌ „Ich konsumiere Brot." → ✅ „Ich esse Brot."
❌ „Ich begebe mich zur Schule." → ✅ „Ich gehe zur Schule."
❌ „Das Auto ist von mir." → ✅ „Das ist mein Auto."

### 4.6 Native-speaker validation (#8)

Would a native speaker (Berlin/Hamburg/Munich/Cologne) actually say this?

If not:
- mark as Major or Critical
- provide explanation (what's wrong, why)
- provide 2–3 ranked alternatives
- cite register (formal/informal/regional)

### 4.7 Idiomatic language (#9)

- [ ] **Idioms** — Guten Appetit, das macht nichts, keine Ahnung
- [ ] **Common expressions** — Tschüss, bitte sehr, gern geschehen
- [ ] **Fixed phrases** — Redemittel from §3 of lesson.md
- [ ] **Greetings / farewells** — context-appropriate (morning vs evening)
- [ ] **Spoken shortcuts** — 'ne (eine), 's (es) at A2+ only

### 4.8 Register (#10)

- [ ] Formal (Sie) vs informal (du) — consistent
- [ ] Business vs academic vs spoken vs written — appropriate for context
- [ ] No mixed register in one dialogue (no „Hey, ich gehe zur Arbeit, ich bin Student" in the same scene)
- [ ] Youth language only at B1+

### 4.9 Pronunciation support (#11) — A1–A2 mostly

- [ ] IPA used where helpful (minimal pairs)
- [ ] Stress indicated for non-obvious words
- [ ] Vowel length (Bett vs baten; subtle at A1, mandatory at A2+)
- [ ] Umlauts (ö, ü, ä) — when to round lips
- [ ] Minimal pairs (schon vs schön; war vs wahr)
- [ ] Intonation (statements vs questions)

### 4.10 Listening material (#12)

- [ ] **Speech rate** — A1: slow (~150 wpm); B1: medium (~180 wpm); C1: natural (~220 wpm)
- [ ] **Accent** — standard German (Hochdeutsch) unless teaching regional
- [ ] **Clarity** — minimal background noise unless teaching real-world comprehension
- [ ] **Authenticity** — dialogues sound natural, not textbook-stilted
- [ ] **Script accuracy** — the audio transcript matches the actual audio file (cross-reference)

### 4.11 Reading material (#13)

- [ ] Difficulty matches level
- [ ] Sentence length (A1: 8–12 words; C1: 25+)
- [ ] Vocabulary density (A1: ≤3 unknown words per 100; C1: ≤15)
- [ ] Grammar density (A1: mostly Präsens + Perfekt; C1: complex syntax)
- [ ] Cohesion (pronouns, connectors, paragraph structure)

### 4.12 Exercises (#14) — most error-prone section

Every exercise must test **exactly what it claims**.

- [ ] **Ambiguity** — no two valid answers from the bank (use `alts:` for borderline cases)
- [ ] **Multiple correct answers** — every gap has one canonical answer
- [ ] **Incorrect answer keys** — verify every `answer:` against the gap text
- [ ] **Insufficient context** — gap sentences give enough surrounding words to disambiguate
- [ ] **Guessability** — a student who skipped the lesson shouldn't get it right by elimination
- [ ] **Rote memorization** — exercises test comprehension, not just pattern-matching

For `gap-bank` specifically:
- [ ] Every answer value MUST appear in `bank` (Zod enforces)
- [ ] Distractor count = `bank.length - Object.keys(answers).length`; instruction must say "**N words are not needed.**" where N is the count
- [ ] No two gaps share the same unique answer
- [ ] No bank word fits a gap other than its assigned one (cross-gap ambiguity)
- [ ] Duplicate bank entries are allowed when a word is needed in 2 gaps

For `order`:
- [ ] `answer.map(i => tiles[i])` reconstructs the target sentence
- [ ] `tiles.length === answer.length`
- [ ] Separable verbs split (aufstehen → [stehe, auf])
- [ ] All verbs conjugated (no infinitive tiles except for Futur I / Modalverb / Perfekt)
- [ ] No reflexive pronoun bundled with verb (split *sich fühlen* into [fühle, mich])

For `single-choice`:
- [ ] `answer` value is one of the option keys
- [ ] H4 single-choice requires `transcript:` field and `audio: transcript_ansage1.mp3`

For `true-false`:
- [ ] `answer` is boolean `true`/`false`, not string
- [ ] One exercise per audio clip

For `matching`:
- [ ] Left/right items use `{key, text}` objects (not bare strings)
- [ ] Every left key has an answer; every answer references a right key

For `odd-one-out`:
- [ ] `odd` is 0-indexed into `items`
- [ ] `items[odd]` matches the word described by `why`

### 4.13 Progression (#15)

Each exercise should increase in difficulty:

1. Recognition (multiple choice)
2. ↓ Controlled production (gap-fill with bank)
3. ↓ Guided production (gap-fill without bank, free-write with cues)
4. ↓ Free production (essay, dialogue)

Block H (Hören) is first — listening before production.

### 4.14 Error anticipation (#16)

Predict common learner mistakes for this level. Build a list specific to the
grammar topic being taught. Examples for A1:

- *ich gehe* (correct) vs *ich gehen* (English-speaker pattern)
- *ich bin müde* (correct) vs *ich habe müde* (Spanish-speaker pattern)
- *Wohin gehst du?* (correct) vs *Wo gehst du?* (mixing wo/wohin)
- *der Stuhl* (correct) vs *das Stuhl* (gender confusion)

The reviewer should automatically list likely student errors for the lesson's
specific grammar point and check that the exercises don't accidentally reinforce
the wrong pattern.

### 4.15 Cross-language interference (#17)

Adjust by learner L1:

- **English speakers** — word order (V2), articles (English has none), Perfekt vs Simple Past, false friends (bekommen, aktuell)
- **Portuguese speakers** — gender (both languages have grammatical gender but the genders differ), verb-final subordinate clauses
- **Spanish speakers** — Perfekt (Spanish uses Present Perfect differently), cases
- **French speakers** — gender agreement, compound nouns

The project's primary persona is Bruno from Blumenau, Brazil — Portuguese L1
errors are most common. Adjust weighting accordingly.

### 4.16 Consistency (#18)

Across the lesson and across the level:

- [ ] Terminology (Wortschatz = vocabulary, not lexicon)
- [ ] Formatting (markdown, headers, emoji)
- [ ] Vocabulary (same word = same meaning; no Lehrbuch vs Fibel drift)
- [ ] Grammar names (V2 rule, not "verb position")
- [ ] Exercise numbering (A1, A2, … not Exercise 1.1)
- [ ] Icons (🎧 for audio, ✅/❌ only in solutions.md, never in lesson.md)
- [ ] Colors (no inline color; rely on syntax highlighting)
- [ ] Translations (English is consistent)

### 4.17 Translation quality (#19)

- [ ] Literal translations (where they mislead)
- [ ] Natural translations (preferred where the literal doesn't help)
- [ ] Missing nuance (false equivalence)
- [ ] Register match (formal German ↔ formal English)

❌ Literal: „Ich habe Hunger." → "I have hunger."
✅ Natural: „Ich habe Hunger." → "I am hungry."

### 4.18 Cultural accuracy (#20)

- [ ] Currency (€ since 2002; pre-2002 content is historical)
- [ ] Holidays (Oktoberfest, Karneval, Tag der Deutschen Einheit)
- [ ] Food (Brötchen, Brezel, not American „Pretzel")
- [ ] Etiquette (Sie before du; Pünktlichkeit)
- [ ] Formal address (Sie, Herr/Frau + surname)
- [ ] Regional customs (Süden: Grüß Gott; Norden: Moin)

### 4.19 Inclusivity (#21)

- [ ] Names from diverse origins (project uses Anna/Russia, Bruno/Brazil, Yuki/Japan, Frau Weber/Germany, Herr Steinmeyer/Austria, Akin Yilmaz/Turkey — keep this mix)
- [ ] Occupations across genders (not all chefs = male)
- [ ] Family structures (single parents, same-sex, multigenerational)
- [ ] No stereotypes (the lazy Italian, the strict German — never)
- [ ] Disability access (when relevant)

### 4.20 Visual references (#22)

If images exist in `lesson.md` or `audio/`:

- [ ] Caption matches the image
- [ ] Grammar in caption matches the lesson's grammar
- [ ] Vocabulary in caption is in the lesson's Wortschatz
- [ ] No misleading illustrations (e.g. showing a „Brötchen" that looks like a hamburger bun)

### 4.21 Cognitive load (#23)

- [ ] ≤ 10 new words per A1 lesson (≤ 15 at A2, ≤ 20 at B1)
- [ ] ≤ 2 grammar points per A1 lesson (≤ 3 at B1, ≤ 4 at B2)
- [ ] ≤ 1 exception per grammar point (no stacking oddities in one lesson)
- [ ] Long explanations broken up with examples

### 4.22 Memory reinforcement (#24)

- [ ] Recycles vocabulary from prior lessons (D recurrence: ≥20% review)
- [ ] Recycles grammar structures (e.g. Perfekt reappears in B1 reading)
- [ ] Spaced repetition in Block D exercises

### 4.23 Assessment quality (#25)

- [ ] Coverage — every learning objective has ≥1 exercise
- [ ] Difficulty — matches the lesson level
- [ ] Balance — even distribution across types
- [ ] Distractors — plausible but clearly wrong

### 4.24 Teacher notes (#26)

Check (if `teacher-notes.md` exists or notes in lesson.md):

- [ ] Clarity (no jargon without explanation)
- [ ] Timing (realistic minute-per-block estimates)
- [ ] Alternative explanations (for harder grammar)
- [ ] Anticipated questions (FAQ)

### 4.25 Internal contradictions (#27)

Search the lesson for contradictions:

- [ ] Page X says "nicht goes after the verb" → Page Y says "nicht goes before"
- [ ] Word table says plural „die Äpfel" → Exercise uses „die Apfel"
- [ ] Dialog says „du" → Later text uses „Sie" without transition

Immediate contradiction = Critical finding.

### 4.26 Technical writing (#28)

- [ ] Grammar (English/German in instructions)
- [ ] Spelling (no typos)
- [ ] Punctuation (consistent German commas, periods, no Oxford-comma in German)
- [ ] Typography („..." quotes, em-dash —, en-dash –, no curly quotes unless inside German text)
- [ ] Lists (numbered vs bulleted consistently)
- [ ] References (consistent style)
- [ ] Links (audio links work; cross-file references exist)

### 4.27 Pedagogical quality (#29)

Each explanation:

- [ ] Starts simple, builds complexity
- [ ] Gives intuition (why, not just what)
- [ ] Provides examples (≥3 per rule)
- [ ] Provides counterexamples (when the rule might trip students up)
- [ ] Connects to prior lessons (explicit cross-references)

### 4.28 German-specific pitfalls (#30) — exhaustive list

Cross-reference `common-pitfalls.md` for the full per-level table. Top items:

- der/den/dem (case by role in clause, not by noun's case)
- ein/einen/einem (only masculine changes in Akkusativ and Dativ)
- Word order after weil/dass (verb to end)
- nicht placement (typically end, but before participles/adjectives it negates)
- kein vs nicht (kein negates nouns without article; nicht negates everything else)
- doch (German "yes" to a negative question)
- mal (softening particle; „Komm mal her!")
- ja (signals known info; „Du weißt ja, dass…")
- eben/halt (resignation particles)
- Modal particles (denn, doch, mal, schon, vielleicht, ja, halt, eben) — A2+
- da-compounds (damit, dazu, dafür — A2+)
- wo-compounds (womit, wofür, worauf — A2+)
- es gibt (+ Akkusativ, never Dativ)
- werden vs bekommen (passive vs „get passive")
- kennen vs wissen (acquaintance vs knowledge)
- wann vs wenn (time vs condition/repeated)
- als vs wenn (single past vs repeated past/future)
- seit vs vor (since vs ago)
- zu vs nach (direction: to a place vs to a place already there)
- liegen vs legen (state vs action, position)
- stehen vs stellen (state vs action, upright)
- sitzen vs setzen (state vs action, sitting)
- fahren vs gehen (vehicle vs foot)
- haben vs sein (Perfekt auxiliary)
- Strong vs weak vs mixed verbs (Perfekt formation: ge-…-en / ge-…-t / irregular)
- Adjective declension (only after B2; for B1 it's preview)
- Genitive alternatives (von + Dativ at A2; aus + Dativ; or preposition + Genitiv at B1)
- Two-way prepositions (Wechselpräpositionen: in, an, auf, über, unter, vor, hinter, neben, zwischen)
- Time-Manner-Place word order (when multiple adverbials in one clause)

### 4.29 AI hallucination detection (#31) — critical

Detect:

- **Invented grammar rules** (e.g. "the third plural form takes -en")
- **Fake etymologies** (e.g. "from Old High German *burg* meaning 'protection'")
- **Fake exceptions** (e.g. listing *sein* as taking ge- in Perfekt — it doesn't)
- **Incorrect frequency claims** ("this is the most common German verb" — verify)
- **Non-existent words** (*„gegensprächlich"*)
- **Machine-translated examples** (English word order smuggled into German)
- **Hallucinated grammar explanations** that don't match standard references (Hueber, Duden)

**Verification protocol:** for any rule or example that feels off, cross-check
against:
- Duden online
- A standard grammar (Hueber Schritte, Menschen)
- The project's `AUTHORING.md` and `CURRICULUM.md`

If no source can be cited, treat as a hallucination and flag Critical.

### 4.30 Reviewer confidence (#32)

Every finding must be rated:

- **Severity:** Critical · Major · Minor · Suggestion
- **Confidence:** High · Medium · Low
- **Evidence:** quote the offending text with `file:line`

```
| Severity   | Definition                                                          |
|------------|---------------------------------------------------------------------|
| Critical   | Blocks shipping. Grammar error, schema violation, hallucination.   |
| Major      | Fix before next lesson. CEFR violation, ambiguous answer, drift.   |
| Minor      | Fix in next batch. Typo, inconsistent formatting.                  |
| Suggestion | Nice-to-have. Style improvement.                                   |

| Confidence | Definition                                                          |
|------------|---------------------------------------------------------------------|
| High       | Verified against a source (Duden, AUTHORING.md, guidelines).       |
| Medium     | Likely correct but not verified; would benefit from a second look.  |
| Low        | Subjective judgment; reviewer is uncertain.                         |
```

---

## 5. Output format

Every review produces:

```markdown
# Review: <lesson-path>

## 1. Executive Summary
- Level: <A1|A2|B1|B2|C1>
- Lesson: <number + title>
- Files reviewed: <list>
- Score: <X>/100
- Verdict: <ship / fix-blockers / needs-major-work>

## 2. Review Table
| # | Dimension | Findings | Severity |
|---|-----------|----------|----------|
| 1 | Curriculum compliance | 0 | — |
| 2 | Learning objectives | 0 | — |
| ... |

## 3. Critical Issues
- file:line — description — fix
- ...

## 4. Major Issues
- ...

## 5. Minor Issues
- ...

## 6. Suggestions
- ...

## 7. Positive Findings
- ...

## 8. Recurring Patterns
- pattern description — lessons affected — propose memory entry

## 9. Suggested Memory Updates
| File | Action | Content |
|------|--------|---------|
| common-pitfalls.md | append | "..." |
| false-positives.md | append | "..." |
| review-memory.md | append | "..." |
| decision-log.md | append | "..." |

DO NOT auto-edit memory files. Wait for user approval.

## 10. Final Recommendation
- ship / fix-blockers / needs-major-work
- if "fix-blockers", list the exact changes
```

---

## 6. Severity definitions

- **Critical** — blocks shipping. Examples: wrong answer key, schema violation,
  grammar error in a solution, hallucinated rule, CEFR scope violation.
- **Major** — fix before the next lesson ships. Examples: ambiguous bank
  word, dialog drift, distractor-count mismatch, register inconsistency.
- **Minor** — fix in the next batch. Examples: typo, formatting, missing
  cross-reference.
- **Suggestion** — nice-to-have. Examples: alternative phrasing, additional
  example, expanded Redemittel.

---

## 7. Self-healing protocol

After every review, propose **memory updates** (§5 #9). The user approves
each one. Approved entries are appended to the appropriate file:

- `common-pitfalls.md` — recurring German errors (e.g. "V2 violation after *jedoch*")
- `false-positives.md` — flagged-but-acceptable constructions
- `review-memory.md` — recurring issues across reviews
- `decision-log.md` — why a new review rule was added
- `style-guide.md` — terminology and formatting decisions

Do **not** auto-edit these files.

`SKILL.md` and `guidelines-*.md` are **structural** — only edit when the user
explicitly asks for a structural change.

---

## 8. Skill files

```
.claude/skills/review-lesson/
├── SKILL.md              ← this file (procedure)
├── README.md             ← architecture map
├── guidelines-A1.md      ← level-specific scope rules
├── guidelines-A2.md
├── guidelines-B1.md
├── guidelines-B2.md
├── guidelines-C1.md
├── review-checklist.md   ← short checklist version of §4
├── common-pitfalls.md    ← per-level pitfall table (append-only)
├── false-positives.md    ← acceptable constructions (append-only)
├── review-memory.md      ← recurring issues (append-only)
├── decision-log.md       ← why rules were added (append-only)
├── curriculum.md         ← CEFR progression summary
└── style-guide.md        ← terminology and formatting
```

Always read `SKILL.md` + the matching `guidelines-{level}.md` before reviewing.

---

## 9. Generator and validation commands

```bash
# Regenerate exercises.md + solutions.md from exercises.yml
npx tsx build/gen-exercises.ts <lesson>

# Validate (dry run — exits non-zero if yml ≠ committed md)
npx tsx build/gen-exercises.ts <lesson> --check

# Validate all lessons (CI gate)
npx tsx build/gen-exercises.ts --all --check
```

Always run the lesson-level check before committing. Run `--all --check` before
pushing if touching multiple lessons.

---

## 10. Dual-mode drift checks (v2)

When a lesson ships both `lesson.md` (v2 Full) and `lesson-short.md` (v1 Short):

1. **Dialog turns** — word-for-word identical (after stripping trailing `  `)
2. **Hörtext transcript** — blockquote inside the `<details>` spoiler must match
3. **Wortschatz nouns** — every Short noun appears in Full with the same article + plural

```bash
diff <(grep -E '^> \*\*[A-Z][a-z]+(\s\([a-zäöü]+\))?:\*\*' <lesson>/lesson.md \
  | sed -E 's/  $//') \
  <(grep -E '^> \*\*[A-Z][a-z]+(\s\([a-zäöü]+\))?:\*\*' <lesson>/lesson-short.md \
  | sed -E 's/  $//')
```

**Drift false-positives to skip:**
- Footnote-marker asterisks: `\*` (escaped, lesson.md) vs `*` (unescaped, lesson-short.md) at end of speaker line. The asterisk is a footnote reference. Fix by escaping with `\*` in BOTH files.
- **Prüfungstraining exam lessons** (`xx/14`) — the Short is intentionally a compact grammar review and does NOT include dialogs. Skip the dialog drift check.