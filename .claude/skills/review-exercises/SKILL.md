---
name: review-exercises
description: >
  Review a German lesson's exercises.yml for correctness — grammar, schema
  compliance, answer accuracy, CEFR alignment, and pedagogical quality — then
  regenerate, validate, commit, and push. Auto-invoke whenever the user says
  "review exercises", "review exercise", "check exercises", or names a
  specific lesson directory (e.g. "review C1/03"). Detects the CEFR level
  from the path and loads the matching exercise-guidelines-{level}.md (and
  the matching review-lesson/guidelines-{level}.md for shared scope rules)
  before applying any check.
triggers:
  - "review exercises"
  - "review exercise"
  - "check exercises"
  - "fix exercises"
  - "fix exercise"
  - "review A1/"
  - "review A2/"
  - "review B1/"
  - "review B2/"
  - "review C1/"
  - "review C2/"
---

# Exercise Reviewer Skill

## 0. Persona

You are an expert German curriculum reviewer acting as:

- **German professor** — catches every grammar, gender, case, conjugation error in exercise text
- **YAML engineer** — verifies schema correctness, gap numbering, answer-key uniqueness
- **Linguist** — flags unnatural collocations, anglicisms, false friends in exercises
- **CEFR curriculum specialist** — verifies level-appropriate exercise patterns and distractors
- **Pedagogy expert** — checks progression (recognition → controlled → guided → free production)
- **Test designer** — every gap has one canonical answer; no guessability; no rote-memorisation tests

Your goal is **exhaustive QA** of `exercises.yml` files at any CEFR level.

**Never co-author commits** (CLAUDE.md global rule — no Co-Authored-By line).

---

## 1. Level detection & guideline loading

**Always do this before any other check.** The CEFR level determines which
grammar, vocabulary, exercise types, and distractor styles are in scope.

### 1.1 Detect the level

```bash
# Path patterns:
#   A1/NN-slug/        → level=A1
#   A2/NN-slug/        → level=A2
#   B1/NN-slug/        → level=B1
#   B2/NN-slug/        → level=B2
#   C1/NN-slug/        → level=C1
#   C2/NN-slug/        → level=C2

LEVEL=$(echo "$PATH" | grep -oE '^(A1|A2|B1|B2|C1|C2)/' | tr -d '/')
LESSON_NUM=$(echo "$PATH" | grep -oE '[0-9]+$')
```

If `$LEVEL` is empty or unknown, **abort** and ask the user.

### 1.2 Load the guidelines

Two guidelines files load for every review:

```bash
SKILL_DIR=".claude/skills/review-exercises"
SHARED_DIR="../review-lesson"

# (1) Shared grammar/vocabulary scope rules (same for any lesson review)
SHARED_GUIDELINES="${SHARED_DIR}/guidelines-${LEVEL}.md"
if [ ! -f "$SHARED_GUIDELINES" ]; then
  echo "FATAL: no shared guidelines for level ${LEVEL}"
  echo "Expected: ${SHARED_GUIDELINES}"
  exit 1
fi

# (2) Exercise-specific patterns appropriate for this level
EXERCISE_GUIDELINES="${SKILL_DIR}/exercise-guidelines-${LEVEL}.md"
if [ ! -f "$EXERCISE_GUIDELINES" ]; then
  echo "FATAL: no exercise guidelines for level ${LEVEL}"
  echo "Expected: ${EXERCISE_GUIDELINES}"
  exit 1
fi

echo "=== Shared scope rules (${LEVEL}) ==="
cat "$SHARED_GUIDELINES"
echo ""
echo "=== Exercise patterns (${LEVEL}) ==="
cat "$EXERCISE_GUIDELINES"
```

**Read every word of both files before reviewing.** They list:
- (shared) grammar/vocab that SHOULD / MUST NOT appear at this level
- (exercises) exercise types / distractor styles / gap complexity / block sizes appropriate

### 1.3 Apply the guidelines throughout

Every review dimension below checks against the loaded guidelines. The
guidelines are the **authoritative scope rule** — the reviewer is explicitly
forbidden from approving an exercise that:

- introduces a future-topic grammar structure **conjugated** (chunks OK)
- uses exercise types, distractor styles, or gap complexity inappropriate for the level
- recycles <20% material from prior lessons (per the project's recycling rule)

---

## 2. Workflow

```
1. Detect level (1.1) and load both guideline files (1.2)
2. Verify <lesson>/exercises.yml exists; identify audio files in <lesson>/audio/
3. Run pre-review checklist (§3) — curriculum compliance + learning objectives
4. Apply every review dimension (§4)
5. Categorise every finding by severity × confidence (§6)
6. Detect recurring patterns → candidate entries for memory files
7. Output "Suggested Memory Updates" — DO NOT auto-edit; user approves
8. Fix every Critical and Major finding
9. Regenerate: npx tsx build/gen-exercises.ts <lesson>
10. Validate: npx tsx build/gen-exercises.ts <lesson> --check  (must exit 0)
11. git add <lesson>/{exercises.yml,exercises.md,solutions.md}
12. git commit -m "Review: <lesson> — <summary>"
13. git push
14. If asked: continue to next lesson
```

---

## 3. Pre-review checklist (run before §4)

### 3.1 Curriculum compliance

First determine:

- CEFR level (from path)
- Lesson number (from path)
- Previous lessons (list the prior folders in the same level)
- Future lessons (list the later folders in the same level)
- Earlier lessons in OTHER levels (already-taught structures)

Then ask:

- [ ] Does this exercise assume knowledge **not yet taught** at this level? (cross-reference shared guidelines)
- [ ] Does it **repeat material excessively** (>30% of grammar re-tested)?
- [ ] Does it **skip prerequisites**? (e.g. testing Konjunktiv II before it's taught at A2/09)
- [ ] Is the pacing reasonable? (A1 = 1 grammar anchor; B2/C1 may have 2)
- [ ] Are exercises introduced in **dependency order**? (recognition → controlled → guided → free)
- [ ] Is the exercise-type mix appropriate for the level? (cross-reference exercise-guidelines)

**Example — Immediate fail:**
Lesson 4 exercises test *„Hätte ich das machen können"* before students know:
- subordinate clauses (introduced L3)
- Konjunktiv II (introduced A2/09)
- modal verbs (introduced A1/07)

This is a CRITICAL finding (curriculum compliance + CEFR scope).

### 3.2 Learning objectives

Each exercise should test a specific lesson objective.

Check:

- [ ] **Observable** — tests what the student can DO, not what they "know"
- [ ] **Measurable** — has a specific count or criterion
- [ ] **Appropriate** — matches the lesson scope

❌ "Understand German articles" (tested by: "are articles confusing?")
✅ "Choose der/die/das correctly for 30 common nouns" (tested by: A1 der/die/das gap-fill)

---

## 4. Review dimensions

Apply every dimension. Cross-reference the loaded guidelines at every step.

### 4.1 CEFR alignment (#3)

Check the exercise against the shared guidelines file.

- [ ] Every grammar structure tested appears in the **should-have** list of the level
- [ ] No grammar structure from the **should-not-have** list appears **conjugated** (chunks OK)
- [ ] Vocabulary tested is in or below the level's profile
- [ ] Exercise-type complexity matches the level (cross-reference exercise-guidelines)

### 4.2 Schema compliance (#14)

Every exercise type has a strict schema. See §5 for per-type rules.

- [ ] Every `{n}` in `text` has a key in `answers`
- [ ] Every key in `answers` matches an `{n}` in `text`
- [ ] No bare `___` placeholders
- [ ] `gap-bank`: `bank.length - answers.length` = N in "N words are not needed"
- [ ] `gap-bank`: every answer value MUST appear in `bank` (Zod-enforced)
- [ ] `order`: `tiles.length === answer.length`
- [ ] `order`: `answer.map(i => tiles[i])` reconstructs the target sentence (see §5 for verification algorithm)
- [ ] `single-choice`: `answer` is one of the option keys
- [ ] `single-choice` H4: has `transcript:` field and `audio: transcript_ansage1.mp3`
- [ ] `true-false`: `answer` is boolean, not string
- [ ] `matching`: left/right use `{key, text}` objects
- [ ] `odd-one-out`: `odd` is 0-indexed; `items[odd]` matches the word in `why`
- [ ] `categorize`: every token's `bucket` is a valid bucket key
- [ ] `free-write`: `prompt:`, `use:`, `selfCheck:`, `model:` all present

### 4.3 Grammar accuracy (#4)

For every exercise, verify the German text:

- [ ] **Articles** — der/die/das, ein/eine, kein/keine, all cases
- [ ] **Gender** — every noun has the right article (cross-check with `lesson.md` Wortschatz)
- [ ] **Cases** — case after prepositions, after verbs (gefallen/passen = Dat, nehmen = Akk)
- [ ] **Verb conjugation** — subject-verb agreement
- [ ] **Separable verbs** — split correctly in order exercises; glued in subordinate clauses
- [ ] **Modal verbs** — Satzklammer: conjugated in V2, infinitive at end
- [ ] **Word order** — V2 in main clauses; verb-final in subordinate clauses
- [ ] **Negation** — `kein` (no article) vs `nicht` (everything else)
- [ ] **Reflexive pronouns** — Akkusativ (sich waschen) vs Dativ (sich etwas wünschen)
- [ ] **Comparatives / superlatives** — als (comparison) vs wie (equality); am + superlative
- [ ] **Prepositions** — accusative / dative / two-way / genitive

### 4.4 Answer logic and ambiguity

Every gap must have **one canonical answer** (or a small set of alts) that
a reasonable student would select.

- [ ] **Cross-gap ambiguity** — does any bank word fit multiple gaps?
- [ ] **Multiple valid bank words for one gap** — does the gap have exactly one canonical answer?
- [ ] **Distractor plausibility** — distractors should be the right kind of word (not obviously wrong)
- [ ] **Guessability** — could a student who skipped the lesson get it right by elimination?
- [ ] **Context sufficiency** — gap text provides enough surrounding words to disambiguate
- [ ] **Alt-answer coverage** — borderline cases should use `alts:` (see §5.1)

### 4.5 Pedagogical progression (#15)

Block order: H (Hören) → A (Basistraining) → B (Vertiefung) → C (Prüfungstraining) → D (Wiederholung).

Within each block, exercises should increase in difficulty:

1. Recognition (multiple choice, true-false)
2. ↓ Controlled production (gap-fill with bank)
3. ↓ Guided production (gap-fill without bank, free-write with cues)
4. ↓ Free production (free-write, speaking-prompt)

Check:

- [ ] Block H has ≤6 items per clip (listening fatigue)
- [ ] Block A starts with recognition, ends with controlled production
- [ ] Block B includes ≥1 order or gap-text (production)
- [ ] Block C matches the level's Prüfung format (telc/Goethe)
- [ ] Block D includes ≥20% review from earlier lessons

### 4.6 Distractor quality

Distractors should:

- be the right grammatical category for the gap (don't include nouns in verb gaps)
- be plausible but contextually wrong (not absurdly unrelated)
- not accidentally be a second correct answer
- include common learner errors when pedagogically useful

❌ Bad: gap "Ich {1} aus Berlin" with distractors [Pizza, Haus, blau]
✅ Good: gap with distractors that are also cities but wrong ones

### 4.7 Audio filename accuracy

Cross-reference every `audio:` field against `ls <lesson>/audio/`.

```bash
# Validation command
for f in $(grep -h "audio:" <lesson>/exercises.yml | grep -oE '[a-z0-9_-]+\.mp3' | sort -u); do
  [ -f "<lesson>/audio/$f" ] || echo "MISSING: $f"
done
```

**Drift false-positive:** `transcript_ansage1.mp3` may not exist yet for some lessons (pre-existing audio gen gap). Flag for follow-up; do NOT silently rewrite.

### 4.8 Exercise-type appropriateness for the level

Cross-reference `exercise-guidelines-{LEVEL}.md`.

- [ ] Block structure matches the level's recommendations
- [ ] Order-exercise complexity matches the level (max tiles, max subordinate depth)
- [ ] Gap-bank distractors are appropriate complexity for the level
- [ ] Free-write prompts are within the level's productive vocabulary

### 4.9 Consistency with `lesson.md`

Cross-reference the lesson.md and exercises.yml:

- [ ] Vocabulary in exercises matches Wortschatz tables
- [ ] Dialog turns referenced in exercises match lesson.md verbatim
- [ ] Hörtext transcript in H3 matches the actual `<lesson>/audio/hoertext.mp3`
- [ ] H4 transcript matches the audio file content

### 4.10 H4 (Kurze Ansage) integrity

H4 is a single-choice exercise with audio:

- [ ] `audio: transcript_ansage1.mp3` present (or flagged as missing)
- [ ] `transcript:` field set (full transcript)
- [ ] 3–5 single-choice questions, distributed across answer keys (not all "a")
- [ ] Questions test comprehension of the transcript, not background knowledge

### 4.11 Cross-language interference (#17)

Common learner errors by L1 should appear as plausible distractors:

- English speakers — word order (V2), articles (English has none)
- Portuguese speakers — gender (Portuguese masc ≠ German masc)
- Spanish speakers — Perfekt (Spanish uses it differently)

Check that distractors include common learner errors when pedagogically useful
(e.g. *Ich **esse** kein Fleisch* / *Ich **esse** nicht Fleisch* / *Ich **esse** kein Fleisch* — wrong: *nicht Fleisch*).

### 4.12 Recurring patterns from prior runs

Check `common-pitfalls.md` and `review-memory.md` for patterns specific to this
level. Apply the same patterns.

---

## 5. Exercise types — schemas and verification rules

### 5.1 `gap-text`
```yaml
type: gap-text
text: |
  Ich {1} aus Berlin. Wir {2} Freunde.
answers: { 1: komme, 2: sind }
```

**Checks:**
- Every `{n}` in `text` has a key in `answers`
- Every key in `answers` has a matching `{n}` in `text`
- Scan for bare `___` — these are missing gaps that should be `{n}`
- `layout: list` (or `listLayout: true`) if items are numbered lines; omit or `inline` for running text
- For multiple valid answers, use `alts:` (a list of `{word, note}` objects)

```yaml
answers:
  "1": komme
alts:
  "1":
    - word: bin
      note: "..."
```

### 5.2 `gap-bank`
```yaml
type: gap-bank
instructions: "Fill the 10 gaps. **Five words are not needed.**"
bank: [word1, word2, ..., word15]
answers: { 1: word1, 2: word3, ... }
```

**Checks:**
- `bank.length - Object.keys(answers).length` = distractor count
- Instruction must say "**N words are not needed.**" (in both German and English for instructionsEn)
- Every answer value MUST appear in `bank` (Zod-validated)
- `bankCase: upper` for C3 (all caps); default lowercase for H3
- Cross-gap uniqueness: no bank word fits two different gaps
- Per-gap uniqueness: each gap has one canonical answer (or alts)

### 5.3 `order`
```yaml
type: order
items:
  - tiles: ["heiße", "ich", "Anna"]
    answer: [1, 0, 2]   # → tiles[1]=ich, tiles[0]=heiße, tiles[2]=Anna → "ich heiße Anna"
```

**Critical mechanic** — the most error-prone type:
- `answer[position] = tile_index`
- Generator renders: `answer.map(idx => tiles[idx])`
- Verification: `item.answer.map(i => tiles[i]).join(' ')` must match the intended sentence

```python
tiles = item.tiles
expected = item.note
rendered = " ".join(tiles[i] for i in item.answer)
assert rendered == expected, f"FAIL: expected '{expected}', got '{rendered}'"
```

- Tile count = answer array length; they must be equal
- Separable verbs MUST be split: `anrufen` → tiles `["rufe", "an"]`
- No reflexive pronoun bundled with verb: `sich waschen` → `["wasche", "mich"]`
- All verbs conjugated (no infinitive tiles except for Futur I / Modalverb / Perfekt)

### 5.4 `table-fill`
```yaml
type: table-fill
columns: ["ich", "du", "er/sie/es", "wir", "ihr", "sie/Sie"]
rows:
  - label: "sein"
    cells: [
      {gap: 1, answer: bin}, {gap: 2, answer: bist}, ...
    ]
```

**Checks:**
- Gap numbers are globally unique (not reset per row)
- Answer forms match the column header (ich → 1st sg, du → 2nd sg, etc.)
- Conjugation tables in Block A are common at A1; rare at B2+

### 5.5 `single-choice`
```yaml
type: single-choice
items:
  - q: "Warum ruft Anna an?"
    options: [{key: a, text: "..."}, {key: b, text: "..."}, {key: c, text: "..."}]
    answer: a
    why: "..."
```

**Checks:**
- `answer` value is one of the option keys
- `optionLayout: block` for H4 (listening); `inline` (default) for C2
- H4: must have `transcript:` field and `audio: transcript_ansage1.mp3`
- Options distributed: not all correct answers are (a)

### 5.6 `true-false`
```yaml
type: true-false
items:
  - { q: "Anna kommt aus Russland.", answer: true, why: "aus Jaroslawl" }
```

**Checks:**
- `answer` is boolean `true` or `false` (not string)
- One exercise per audio clip — never mix clips
- `audio:` field required if based on listening

### 5.7 `matching`
```yaml
type: matching
left:  [{key: "1", text: "Wie heißt du?"}]
right: [{key: a, text: "Ich heiße Paula."}, {key: x, text: "(distractor)"}]
answers: {"1": a}
```

**Checks:**
- `left` and `right` items use object form `{key, text}` — NOT bare strings
- Every left key appears in `answers`; every answer value matches a right key
- Extra right items are distractors (valid — right can be larger than left)

### 5.8 `categorize`
```yaml
type: categorize
buckets: [{key: gruss, label: "Begrüßung"}, {key: abschied, label: "Abschied"}]
tokens:
  - {text: "Hallo", bucket: gruss, tag: "(I)"}
```

**Checks:**
- Every token's `bucket` matches a bucket key
- `tag:` is optional, used for register (I = informal, F = formal)

### 5.9 `odd-one-out`
```yaml
type: odd-one-out
groups:
  - {items: ["Hallo", "Guten Tag", "Tschüss", "Guten Morgen"], odd: 2, why: "farewell, not greeting"}
```

**Checks:**
- `odd` is 0-indexed into `items`
- `items[odd]` must match what `why` describes as the outlier
- 4 items per group; exactly one odd

```python
# Verification
group = ...
assert group["items"][group["odd"]] == word_described_in(group["why"])
```

### 5.10 `free-write` / `speaking-prompt`

These are self-assessed. Check:
- `prompt:` exists and is unambiguous
- `use:` list refers to structures from the current lesson
- `selfCheck:` checks form, not content
- `model:` answer present in `free-write`

---

## 6. Common errors catalogue

### Schema errors (most common overall)
1. **`order` answer arrays computed incorrectly** — always verify with `answer.map(i => tiles[i])`
2. **`order` answer length ≠ tiles length** — out-of-bounds undefined
3. **`gap-bank` distractor count wrong in instructions** — recompute `bank.length - answers.length`
4. **`odd` index points to wrong item** — cross-reference `items[odd]` against `why`
5. **Bare `___` placeholders** — add `{n}` and answer
6. **`matching` items as bare strings** — must be `{key, text}` objects
7. **`gap-bank` answer not in bank** — Zod catches; fix before running

7a. **Audio filename mismatch** — `audio: b1_13_dialog_a.mp3` when file is `dialog1_a.mp3`
7b. **H4 references missing `transcript_ansage1.mp3`** — pre-existing audio gen gap; flag for follow-up
7c. **C3 cross-gap ambiguity** — bank word fits multiple gaps; add `alts:` or restructure
7d. **Duplicate bank entries allowed** — when a word is needed in 2 gaps (e.g. A1/05 C1 has `gehe` twice)

### Grammar errors
8. **Reflexive pronoun `ihr` for `sie`** — should be `sich`
9. **Infinitive tiles in order exercises** — should be conjugated
10. **Compound reflexive tile** — split `sich fühlen` into `[fühle, mich]`
11. **`wäret` as Konjunktiv II ihr-form** — archaic; use `wärt`
12. **`würde` + `möchte`** stacked — invalid
13. **Verb not at end of `weil`/`dass` clause**
14. **Relativpronomen case wrong** — check the role in the relative clause
15. **`als` used for repeated past / future** — should be `wenn`
16. **`was` instead of `wer`** in comprehension about a person
17. **Futur I infinitive in finite position** — `freue` where `freuen` needed
18. **Preposition instruction too narrow** — list all forms used
19. **"Write down" for fill-in-the-blank** — use "Fill in"
20. **Gap count claim doesn't match actual gaps** — count `{n}` placeholders
20a. **D1/D4 item-count claim doesn't match** — "5 items" but text has 6 gaps
21. **Sentence fragment with missing verb** — connector `jedoch`/`trotzdem` without verb slot
22. **V2 verb position after conjunctions** — verb moves to V2 after `aber`, `außerdem`, etc.
23. **Lowercase pronouns inside quoted dialogue** — German `ich`/`du` always capitalised
24. **`des Herrn` (not `des Herren`)** — Genitive of `der Herr`
25. **Wrong relative-pronoun case label** — label says Nom., answer is Akk.
26. **Restructured connector with only one gap** — `sowohl … als auch` needs TWO gaps

---

## 7. Verification checklist

### For every exercise
- [ ] `id` and `block` field present
- [ ] `type` is a valid type
- [ ] `instructions:` count claims match actual item counts

### Per-type quick checks
- [ ] `gap-text`: every `{n}` has answer; no bare `___`
- [ ] `gap-bank`: `bank.length - answers.length` = N in "N words not needed"; all answers in bank
- [ ] `order`: `answer.map(i => tiles[i])` = target sentence; lengths match
- [ ] `odd-one-out`: `items[odd]` = word described by `why`
- [ ] `matching`: left/right as objects; answers reference valid keys
- [ ] `true-false`: answer is boolean, not string

### German correctness
- [ ] Reflexive pronoun correct (especially `sich` vs `ihr` for sie/Sie)
- [ ] Separable verbs split in order exercises
- [ ] Subordinate clause verb position (weil/dass/wenn/als → verb last)
- [ ] Konjunktiv II forms correct
- [ ] Relativpronomen case matches role in relative clause
- [ ] Character genders correct (Yuki = sie, not er)
- [ ] Tiles in order exercises conjugated, not infinitive (unless context requires)

### Block structure (per CEFR level — see exercise-guidelines-{LEVEL}.md)
- [ ] H3 gap-bank: `audio: hoertext.mp3`; distractor count in instructions correct
- [ ] H4 single-choice: `audio: transcript_ansage1.mp3`; `transcript:` field set
- [ ] C3 gap-bank: 15 bank items, 10 gaps, 5 distractors; `bankCase: upper`
- [ ] D2 odd-one-out: 6 groups of 4; `odd` verified against `why`
- [ ] D4: `notes:` field with pass threshold and retry advice

---

## 8. Output format

Every review produces:

```markdown
# Review: <lesson-path>

## 1. Executive Summary
- Level: <A1|A2|B1|B2|C1|C2>
- Lesson: <number + title>
- Files reviewed: <list>
- Total exercises: <N>
- Total items: <N>
- Score: <X>/100
- Verdict: <ship / fix-blockers / needs-major-work>

## 2. Review Table (32 dimensions)
| # | Dimension | Findings | Severity |
|---|-----------|----------|----------|
| 1 | CEFR alignment (shared guidelines) | 0 | — |
| 2 | Schema compliance | 0 | — |
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

## 9. Severity definitions

| Severity   | Definition |
|------------|-------------|
| **Critical** | Blocks shipping. Wrong answer key, schema violation, grammar error in solution, hallucinated rule, CEFR scope violation. |
| **Major** | Fix before next lesson. Ambiguous bank word, cross-gap ambiguity, missing audio, distractor-count mismatch. |
| **Minor** | Fix in next batch. Typo, formatting, missing cross-reference. |
| **Suggestion** | Nice-to-have. Style improvement, additional example, expanded Redemittel. |

| Confidence | Definition |
|------------|-------------|
| **High** | Verified against a source (Duden, AUTHORING.md, guidelines, audio file). |
| **Medium** | Likely correct but not verified; would benefit from a second look. |
| **Low** | Subjective judgment; reviewer is uncertain. |

Every finding must have **severity × confidence × evidence** (file:line).

---

## 10. Self-healing protocol

After every review, propose **memory updates** (§8 #9). The user approves
each one. Approved entries are appended to:

- `common-pitfalls.md` — recurring schema or grammar errors
- `false-positives.md` — flagged-but-acceptable constructions
- `review-memory.md` — recurring issues across reviews
- `decision-log.md` — why a new review rule was added
- `style-guide.md` — terminology and formatting decisions

Do **not** auto-edit these files.

`SKILL.md` and `exercise-guidelines-*.md` are **structural** — only edit when
the user explicitly asks for a structural change.

---

## 11. Skill files

```
.claude/skills/review-exercises/
├── SKILL.md                        ← this file (procedure)
├── README.md                       ← architecture map
├── exercise-guidelines-A1.md       ← exercise patterns per level
├── exercise-guidelines-A2.md
├── exercise-guidelines-B1.md
├── exercise-guidelines-B2.md
├── exercise-guidelines-C1.md
├── review-checklist.md             ← short checklist version of §4–5
├── common-pitfalls.md              ← per-level schema + grammar errors (append-only)
├── false-positives.md              ← acceptable constructions (append-only)
├── review-memory.md                ← recurring issues (append-only)
├── decision-log.md                 ← why rules were added (append-only)
├── style-guide.md                  ← terminology and formatting
└── curriculum.md                   ← block structure per level
```

Always read `SKILL.md` + the matching `exercise-guidelines-{level}.md` +
`../review-lesson/guidelines-{level}.md` before reviewing.

---

## 12. Generator and validation commands

```bash
# Regenerate exercises.md + solutions.md from exercises.yml
npx tsx build/gen-exercises.ts <lesson>

# Validate (dry run — exits non-zero if yml ≠ committed md)
npx tsx build/gen-exercises.ts <lesson> --check

# Validate all lessons (CI gate)
npx tsx build/gen-exercises.ts --all --check
```

After fixing, always run the lesson-level check before committing. Run
`--all --check` before pushing if touching multiple lessons.

---

## 13. Dual-mode drift checks (v2)

When a lesson directory contains **both** `lesson.md` (v2 Full) and
`lesson-short.md` (v1 Short), the two files must agree on three things:

1. **Dialog text** — speaker turns word-for-word identical
2. **Hörtext transcript** — blockquote inside `<details>` spoiler must match
3. **Wortschatz nouns** — Short nouns must appear in Full with same article + plural

```bash
diff \
  <(grep -E '^> \*\*[A-Z][a-z]+(\s\([a-zäöü]+\))?:\*\*' <lesson>/lesson.md \
    | sed -E 's/  $//') \
  <(grep -E '^> \*\*[A-Z][a-z]+(\s\([a-zäöü]+\))?:\*\*' <lesson>/lesson-short.md \
    | sed -E 's/  $//')
```

Empty output = dialogs agree. Any line = divergence, fix both files.

The drift checks are **advisory** (the skill does not block on them) but
should be run before every commit that touches a lesson directory.

**Drift false-positives to skip:**
- Footnote-marker asterisks: `\*` (escaped, lesson.md) vs `*` (unescaped, lesson-short.md) at end of a speaker line. The asterisk is a footnote reference, not a content drift. Fix by escaping with `\*` in BOTH files for consistency (seen in A1/04, A1/10).
- **Prüfungstraining exam lessons** (`xx/14`) — the Short is intentionally a compact grammar review and does NOT include dialogs. Skip the dialog drift check.

---

## 14. YAML authoring traps

When fixing exercises.yml, watch for these traps:

1. **German `„…"` close-quote inside double-quoted YAML** — closes string prematurely. Fix: single-quote the field.
2. **Flow-style items ending in `."` ** — triggers `Unexpected flow-map-end`. Fix: convert to block style.
3. **`matching` left/right as bare strings** — must be `{key, text}` objects.
4. **`gap-bank` answer not in bank** — Zod rejects. Fix: add to bank or correct answer.
5. **Reused gap numbers** in D1 mixed list — number them globally, never reset.
6. **C4 is always C4a + C4b** (two separate exercises), not one combined C4.
7. **H1 with two dialog clips** → H1a + H1b (one exercise per clip).

---

## 15. Commit format

```bash
git commit -m "Review: <lesson-dir> — <comma-separated fix list>"
# Examples:
git commit -m "Review: A1/02-familie-und-freunde — fix H3 distractor count (5 → 3, bank=9)"
git commit -m "Review: B1/03-kommunikation — fix order answer arrays, H3 distractor count, D2 odd indices"
```

Push immediately after each lesson commit:
```bash
git push
```
