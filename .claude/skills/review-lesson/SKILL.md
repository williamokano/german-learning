---
name: review-lesson
description: >
  Review a German lesson end-to-end — BOTH the teaching content (lesson.md /
  lesson-short.md: grammar explanations, dialogs, Wortschatz, Hörtext, reading
  texts, culture) AND the exercises (exercises.yml: schema, answers, grammar) —
  for correctness, CEFR scope, naturalness, and internal consistency. The lesson
  content itself can be wrong, independent of any exercise. Then regenerate,
  validate, commit, and open a per-lesson PR. Covers levels A1–C1. Auto-invoke
  whenever the user says "review lesson", "review exercises", "check lesson",
  "fix lesson", or names a specific lesson directory (e.g. "review B2/03").
  Detects the CEFR level from the path and loads the matching guidelines-{level}.md
  + exercise-guidelines-{level}.md before applying any check.
triggers:
  - "review lesson"
  - "review exercises"
  - "review exercise"
  - "check lesson"
  - "fix lesson"
  - "fix exercise"
  - "review A1/"
  - "review A2/"
  - "review B1/"
  - "review B2/"
  - "review C1/"
---

# German Lesson Reviewer Skill

Review one lesson **end-to-end**. Two objects of review, equally first-class:

1. **The teaching content** — `lesson.md` (and `lesson-short.md` if present):
   grammar explanations, dialogs, Wortschatz, Hörtext, reading texts, cultural
   notes. **This content can be wrong on its own** — a fabricated grammar rule, a
   wrong noun gender, an unnatural dialog, a false cultural claim — regardless of
   whether any exercise touches it.
2. **The exercises** — `exercises.yml`: schema, answer logic, grammar in gap text.

Plus the **consistency** between them (dual-mode drift; exercises must not test
anything the lesson didn't teach). Find every error; fix it; regenerate;
validate; ship a per-lesson PR.

**Never co-author commits** (CLAUDE.md global rule — no `Co-Authored-By` line).

---

## 0. Persona

You are simultaneously:

- **German professor** — every gender, case, conjugation, word-order error, in explanations *and* exercises
- **Linguist / native-speaker validator** — would a real speaker say this? flags anglicisms, false friends, dead collocations
- **CEFR specialist** — nothing taught or tested is out of scope for the level (chunks excepted)
- **YAML / test engineer** — exercise schema, gap numbering, answer-key uniqueness, no guessability
- **Pedagogy expert** — explanations build simple→complex, give intuition, enough examples, honest cross-references
- **Fact-checker** — no invented grammar rules, fake exceptions, or false cultural claims (hallucination hunt)

---

## 1. Level detection & guideline loading — ALWAYS FIRST

### 1.1 Detect the level from the lesson path

The lesson path is the argument you were given (e.g. `B2/03-vergangenheit-der-moeglichkeit`).
Take the leading directory component:

```bash
LESSON_PATH="B2/03-vergangenheit-der-moeglichkeit"   # ← the path you were given
LEVEL=$(printf '%s\n' "$LESSON_PATH" | grep -oE '^(A1|A2|B1|B2|C1)')
```

If `$LEVEL` is empty, **abort and ask the user** — do not guess. There are no
C2 lessons in this project; reject `C2/…` paths.

### 1.2 Load BOTH guideline files from THIS skill directory

```bash
DIR=".claude/skills/review-lesson"
SCOPE="$DIR/guidelines-${LEVEL}.md"             # grammar/vocab in/out of scope
PATTERNS="$DIR/exercise-guidelines-${LEVEL}.md" # exercise types/distractors/block sizes
for f in "$SCOPE" "$PATTERNS"; do
  [ -f "$f" ] || { echo "FATAL: missing $f"; exit 1; }
done
cat "$SCOPE" "$PATTERNS"
```

**Read every word of both before reviewing.** They are the **authoritative scope
rule**: never approve content or an exercise that introduces a future-topic
structure in **conjugated** form.

**Chunks exception:** `AUTHORING.md` allows italicised forward-reference chunks
(e.g. *„Könnten Sie mir bitte sagen…"* at A1/13 before Konjunktiv II is taught).
Do **not** flag a chunk; **do** flag any conjugated out-of-scope form.

---

## 2. Workflow

```
1. Detect level (1.1) and cat both guideline files (1.2)
2. Read the WHOLE lesson: lesson.md, lesson-short.md (if present), exercises.yml;
   note audio files in <lesson>/audio/
3. Review the teaching content (§3) and the exercises (§4); check grammar (§5)
   and consistency (§6) across both
4. Rate each finding by severity × confidence (§7)
5. Fix every Critical and Major finding in the right file
   (lesson.md / lesson-short.md for content, exercises.yml for exercises)
6. If exercises.yml changed:  npx tsx build/gen-exercises.ts <lesson>
7. If a dialog / Hörtext / H4 transcript changed: regenerate ONLY that audio slug (§9)
8. Validate: npx tsx build/gen-exercises.ts <lesson> --check   ← must exit 0
9. git add the changed files (exercises.{yml,md}, solutions.md, lesson*.md, audio/*)
10. git commit -m "Review: <lesson> — <comma-separated fix list>"   (NO co-author)
11. Push HEAD:review/<level>-<nn> and open a PR (one lesson per PR)
12. Propose memory updates (§10); apply per the run's convention
```

If the review finds **nothing**, say "CLEAN — no fixes" and open no PR.

---

## 3. Review the teaching content (`lesson.md` / `lesson-short.md`)

The content is wrong-able on its own. Check each part:

### 3.1 Grammar explanations
- **Correct** — the rule as stated is true (cross-check Duden / a standard grammar).
- **No hallucinated rules or exceptions** — no invented "rule", fake exception,
  fake etymology, or non-existent word. If a claim can't be cited to Duden /
  `AUTHORING.md` / `CURRICULUM.md`, flag **Critical**.
- **Examples valid** — every example sentence is itself correct and on-level.
- **Counterexamples** where the rule trips learners (esp. L1 = Portuguese, Bruno).

### 3.2 Dialogs
- Natural, idiomatic, would actually be spoken.
- Register consistent (no du/Sie mixing within a scene).
- Level-appropriate vocabulary and structures.
- Character consistency (Yuki = female `sie`; Bruno = male `er`; etc.).

### 3.3 Wortschatz
- **Every noun:** correct **article (gender)** and **plural** form.
- Translations accurate and natural (not literal where it misleads).
- Words are in/below the level's frequency profile.

### 3.4 Hörtext & reading texts
- Difficulty, sentence length, vocabulary density match the level.
- Natural, not textbook-stilted.
- The `lesson.md` transcript matches the actual audio file (it is the audio source).

### 3.5 Cultural accuracy
- € currency, holidays, etiquette (Sie before du, Pünktlichkeit), regional
  variants (Süden *Grüß Gott* / Norden *Moin*). No stereotypes.

### 3.6 Pedagogy
- Explanations build simple→complex; give intuition (why, not just what);
  ≥3 examples per rule; cross-references to prior lessons are honest.
- Prerequisite order respected (e.g. Perfekt before Präteritum; articles before cases).

### 3.7 Internal contradictions
- Explanation vs table vs dialog vs Wortschatz must agree (e.g. table says
  `die Äpfel` but a dialog says `die Apfel`). Any direct contradiction = **Critical**.

---

## 4. Review the exercises (`exercises.yml`)

### 4.1 Schema & answer logic by type — the most bug-dense area

**`gap-text`** — every `{n}` has an `answers` key and vice versa; no bare `___`; `listLayout: true` for numbered lines.

**`gap-bank`**
- Every `answer` value appears in `bank` (Zod enforces).
- Distractor count = `bank.length − Object.keys(answers).length`; instruction must say "**N words are not needed / N Wörter sind zu viel**" with that exact N.
- **Cross-gap ambiguity (most common):** every bank word fits only its own gap; every gap fits only one bank word. Fix with `alts:` or by restructuring. Duplicate bank entries are OK when a word is genuinely needed in two gaps.
- C3 convention: 15 bank / 10 answers / 5 distractors; `bankCase: upper`.

**`order`** (most error-prone mechanic)
- `answer[position] = tile_index`; generator renders `answer.map(i => tiles[i])`.
- **Verify by reconstructing:** `answer.map(i => tiles[i]).join(' ')` must equal the target (`note:`). `tiles.length === answer.length`.
- Separable verbs split (`aufstehen` → `["stehe","auf"]`); verbs conjugated (no infinitive tiles unless Futur I / modal / Perfekt); no reflexive bundled into the verb tile.

**`table-fill`** — gap numbers globally unique; each answer matches its column header.

**`single-choice`** — `answer` is a real option key; no two options identical; distractors plausible-but-wrong. H4 needs `transcript:` + `audio: transcript_ansage1.mp3`.

**`true-false`** — `answer` is boolean (not string); one exercise per audio clip.

**`matching`** — `left`/`right` are `{key,text}` objects; every left key has an answer; answers reference real right keys; extra right items are valid distractors.

**`categorize`** — every token `bucket` matches a bucket key.

**`odd-one-out`** — `odd` is 0-indexed; `items[odd]` is the outlier `why` describes; 4 items/group, one odd.

**`free-write` / `speaking-prompt`** — `prompt:` unambiguous; `use:` references current-lesson structures; `model:` present for free-write.

### 4.2 Ambiguity, guessability, distractors
- No gap has two defensible answers; no MC item has two correct options.
- A student who skipped the lesson shouldn't win by elimination.
- Distractors don't accidentally reinforce a known L1 error.

### 4.3 Instruction ↔ content match
- Every "N items / N gaps / N words not needed" claim matches reality. Count
  `{n}` placeholders manually.

### 4.4 Audio filename accuracy
- Every `audio:` field matches a real file in `<lesson>/audio/` (`ls` it). Fix the
  yml to match (`dialog1_a.mp3`, `dialog1_b.mp3`, `hoertext.mp3`,
  `transcript_ansage1.mp3`) — never invent a filename. If an `audio:` points at a
  missing file, flag for regen; do NOT silently repoint.

---

## 5. Grammar accuracy (applies to content AND exercises)

Check against the loaded scope file. High-value checks:
- Articles / gender / case / plural (cross-check the Wortschatz).
- Verb conjugation for the subject; separable-verb bracket; modal Satzklammer.
- **V2 word order** — finite verb in position 2 in main clauses, including after
  `jedoch`, `trotzdem`, `allerdings`, `aber`, `außerdem`, `deshalb`, `dennoch`;
  verb-final after `weil`/`dass`/`wenn`/`als`/`ob`/`obwohl`.
- Reflexive pronouns (`sich` vs `ihr` for sie/Sie; Akk vs Dat).
- Konjunktiv II (`wärt` not `wäret`; no `würde`+`möchte`; no stacked modals);
  Konjunktiv I in reported speech (`er sagt, er habe`, KII fallback `hätte` when KI = Indikativ).
- Relativpronomen case = role in the relative clause; case after a preposition.
- `als` (single past) vs `wenn` (repeated/future); `des Herrn` not `des Herren`.
- Capitalisation: all nouns, `Sie`/`Ihr`, pronouns inside quotes (`„Ich…"`).
- See `common-pitfalls.md` for the full per-level table + reference grammar
  tables (reflexive, Konjunktiv II, Relativpronomen, character genders).

---

## 6. Consistency between content and exercises

### 6.1 Exercises don't outrun the lesson
No exercise tests a word or structure the lesson (or a prior lesson) didn't teach.

### 6.2 Dual-mode drift (only when `lesson-short.md` exists)
The audio pipeline reads `lesson.md`; the Short view a learner toggles to is
`lesson-short.md`. They must agree on:
1. **Dialog turns** — word-for-word (strip trailing `  `).
2. **Hörtext transcript** — the blockquote inside the `<details>` spoiler.
3. **Wortschatz nouns** — same article + plural for any noun in both.

```bash
diff <(grep -E '^> \*\*[A-Z][a-z]+(\s\([a-zäöü]+\))?:\*\*' <lesson>/lesson.md      | sed -E 's/  $//') \
     <(grep -E '^> \*\*[A-Z][a-z]+(\s\([a-zäöü]+\))?:\*\*' <lesson>/lesson-short.md | sed -E 's/  $//')
```
**False positives to skip:**
- Footnote `\*` (escaped) vs `*` (unescaped) at a line end — a footnote marker, not
  drift. Normalise to `\*` in both files (seen in A1/04, A1/10).
- **Prüfungstraining exam lessons (`xx/14`)** — the Short is intentionally a compact
  grammar review with no dialogs; skip the dialog drift check.

---

## 7. Severity × confidence

| Severity | Meaning |
|----------|---------|
| **Critical** | Blocks shipping — wrong answer key, schema violation, grammar error in content/solution, hallucinated rule, false cultural claim, CEFR-scope breach. |
| **Major** | Fix before the next lesson — ambiguous bank word, dialog drift, distractor-count mismatch, register break, unnatural dialog. |
| **Minor** | Fix in the next batch — typo, formatting, missing cross-reference. |
| **Suggestion** | Nice-to-have phrasing/style/extra example. |

| Confidence | Meaning |
|------------|---------|
| **High** | Verified against a source (Duden, AUTHORING.md, the guidelines). |
| **Medium** | Likely correct, not verified. |
| **Low** | Subjective judgment. |

Fix all Critical + Major. Quote the offending text with `file:line` as evidence.

---

## 8. Output format

**Default — concise fix-list** (this is what ships):

```markdown
## Review: <lesson>

**Result:** CLEAN — no fixes   ·   OR   ·   <N> fixes

Content (lesson.md / lesson-short.md):
1. <where> — <what was wrong> → <fix>   [Critical|Major|Minor]

Exercises (exercises.yml):
2. <ex id> — <what was wrong> → <fix>   [Critical|Major|Minor]

**Audio:** regenerated <slug(s)> · or · none (no transcript changed)
**Validation:** gen-exercises --check passed
**PR:** #<n>   (or "clean — no PR")
```

Keep it to fixes that matter. No score, no per-dimension table, no "0 findings"
rows. Produce the full audit report (executive summary, per-dimension table,
positive findings) **only** when the user asks for a "deep review" / "full audit".

---

## 9. Audio regeneration rule (save credit)

`build/gen-exercises.ts` only regenerates `exercises.md` + `solutions.md` from
`exercises.yml` — it does **not** touch audio. Regenerate audio **only** when you
changed an audio-bearing transcript: a dialog turn or Hörtext in `lesson.md`, or
an H4 `transcript:` in `exercises.yml`. Then regenerate ONLY the affected slug:

```bash
python3 scripts/generate_audio.py <lesson> --section <slug>
# slugs: dialog1_a · dialog1_b · hoertext · transcript_ansage1
```

If no transcript text changed, run **no** audio generation.

---

## 10. Self-healing / knowledge base

After a review, if you found a *new* recurring pattern, propose an append to the
matching file and apply it per the run's convention (the A1–B2 runs committed
skill learnings directly):

- `common-pitfalls.md` — recurring grammar/schema errors + reference tables
- `false-positives.md` — flagged-but-acceptable constructions (don't re-flag)
- `review-memory.md` — recurring issues across lessons
- `decision-log.md` — why a review rule was added/changed
- `style-guide.md` — terminology & formatting decisions

These are **append-mostly** — grow them, don't rewrite history. `SKILL.md`,
`README.md`, `guidelines-*.md`, `exercise-guidelines-*.md` are **structural**:
edit only when the user asks for a structural change.

---

## 11. Skill files

```
.claude/skills/review-lesson/
├── SKILL.md                      ← this file (procedure + persona) — READ FIRST
├── README.md                     ← architecture map
├── guidelines-{A1,A2,B1,B2,C1}.md          ← grammar/vocab scope per level
├── exercise-guidelines-{A1,A2,B1,B2,C1}.md ← exercise types/distractors per level
├── review-checklist.md           ← short checklist version of §3–6
├── curriculum.md                 ← CEFR progression + block structure per level
├── style-guide.md                ← terminology & formatting
│   ── append-mostly knowledge base ──
├── common-pitfalls.md            ← recurring errors + reference grammar tables
├── false-positives.md            ← acceptable constructions previously flagged
├── review-memory.md              ← recurring issues across reviews
└── decision-log.md               ← why rules were added/changed
```

Always read `SKILL.md` + `guidelines-{level}.md` + `exercise-guidelines-{level}.md`
before reviewing.

---

## 12. Generator & validation commands

```bash
npx tsx build/gen-exercises.ts <lesson>            # regenerate exercises.md + solutions.md
npx tsx build/gen-exercises.ts <lesson> --check    # dry run; non-zero if yml ≠ committed md
npx tsx build/gen-exercises.ts --all --check       # CI gate; run before pushing multi-lesson work
```

Always run the lesson-level `--check` before committing. The only CI
(`deploy-pages.yml`) runs on push to `main`, not on PRs — so a green local
`--check` plus a PR with no failing checks is the merge gate.
