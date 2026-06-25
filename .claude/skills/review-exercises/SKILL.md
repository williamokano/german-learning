---
name: review-exercises
description: >
  Review a German lesson's exercises.yml for correctness — schema compliance,
  answer logic, grammar accuracy, CEFR scope — and verify it stays consistent
  with the lesson's teaching content (dual-mode drift, audio filenames). Then
  regenerate, validate, commit, and open a per-lesson PR. Covers levels A1–C1.
  Auto-invoke whenever the user says "review exercises", "review exercise",
  "review lesson", "check lesson", "fix exercise", or names a specific lesson
  directory (e.g. "review B2/03"). Detects the CEFR level from the path and
  loads the matching guidelines-{level}.md + exercise-guidelines-{level}.md
  before applying any check.
triggers:
  - "review exercises"
  - "review exercise"
  - "review lesson"
  - "check lesson"
  - "fix exercise"
  - "review A1/"
  - "review A2/"
  - "review B1/"
  - "review B2/"
  - "review C1/"
---

# Exercise Reviewer Skill

Review one lesson's `exercises.yml` end-to-end: find every schema violation,
answer-logic bug, grammar error, and CEFR-scope breach; fix them; regenerate;
validate; and ship a per-lesson PR. The lesson's `lesson.md` / `lesson-short.md`
are read as the source of truth the exercises must stay consistent with — they
are reference, not the primary object of this skill.

**Never co-author commits** (CLAUDE.md global rule — no `Co-Authored-By` line).

---

## 0. Persona

You are simultaneously:

- **German professor** — every gender, case, conjugation, and word-order error in exercise text
- **YAML/schema engineer** — gap numbering, answer-key uniqueness, bank membership, type invariants
- **Test designer** — each gap has exactly one canonical answer; no guessability; no accidental second-valid answer
- **CEFR specialist** — no exercise tests a structure not yet taught at this level (chunks excepted)
- **Native-speaker validator** — would a real speaker phrase the gap sentence this way?

---

## 1. Level detection & guideline loading — ALWAYS FIRST

The CEFR level decides what grammar/vocabulary/exercise patterns are in scope.

### 1.1 Detect the level from the lesson path

The lesson path is the argument you were given (e.g. `B2/03-vergangenheit-der-moeglichkeit`).
Take the leading directory component:

```bash
LESSON_PATH="B2/03-vergangenheit-der-moeglichkeit"   # ← the path you were given
LEVEL=$(printf '%s\n' "$LESSON_PATH" | grep -oE '^(A1|A2|B1|B2|C1)')
```

If `$LEVEL` is empty (no `A1|A2|B1|B2|C1` prefix), **abort and ask the user** —
do not guess. There are no C2 lessons in this project; reject `C2/…` paths.

### 1.2 Load BOTH guideline files from THIS skill directory

```bash
DIR=".claude/skills/review-exercises"
SCOPE="$DIR/guidelines-${LEVEL}.md"             # grammar/vocab in/out of scope
PATTERNS="$DIR/exercise-guidelines-${LEVEL}.md" # exercise types/distractors/block sizes
for f in "$SCOPE" "$PATTERNS"; do
  [ -f "$f" ] || { echo "FATAL: missing $f"; exit 1; }
done
cat "$SCOPE" "$PATTERNS"
```

**Read every word of both before reviewing.** Together they define what counts
as in-scope, out-of-scope, level-appropriate exercise type, and acceptable
distractor style. They are the **authoritative scope rule**: never approve an
exercise that tests a future-topic structure in **conjugated** form.

**Chunks exception:** `AUTHORING.md` allows italicised forward-reference chunks
(e.g. *„Könnten Sie mir bitte sagen…"* at A1/13 before Konjunktiv II is taught).
Do **not** flag a chunk; **do** flag any conjugated out-of-scope form.

---

## 2. Workflow

```
1. Detect level (1.1) and cat both guideline files (1.2)
2. Read <lesson>/exercises.yml fully; note audio files in <lesson>/audio/
3. Read <lesson>/lesson.md (+ lesson-short.md if present) as the reference text
4. Apply every review dimension in §4
5. Rate each finding by severity × confidence (§5)
6. Fix every Critical and Major finding directly in exercises.yml
7. Regenerate:  npx tsx build/gen-exercises.ts <lesson>
8. Validate:    npx tsx build/gen-exercises.ts <lesson> --check   ← must exit 0
9. git add <lesson>/{exercises.yml,exercises.md,solutions.md}  (+ lesson*.md if drift-fixed)
10. git commit -m "Review: <lesson> — <comma-separated fix list>"   (NO co-author)
11. Push HEAD:review/<level>-<nn> and open a PR (one lesson per PR), or push to
    the working branch if that is the agreed flow for this run.
12. Propose memory updates (§7); apply per the run's convention.
```

If the review finds **nothing**, say "CLEAN — no fixes" and open no PR.

---

## 3. Pre-review (fast scope pass)

- **Curriculum compliance** — does any exercise assume a structure not yet
  taught at this level? Cross-reference the loaded `guidelines-{level}.md`.
  A conjugated future-topic form is a **Critical** finding.
- **Instruction ↔ content match** — every "N items", "N gaps", "N words not
  needed" claim must match the actual count. Count `{n}` placeholders manually.
- **Coverage** — each block's exercises actually test the lesson's anchor grammar.

---

## 4. Review dimensions

Apply all of these. The first two (schema + answer logic) are where almost every
real bug lives — spend the most time there.

### 4.1 Schema & answer logic by type — the core of this skill

**`gap-text`**
- Every `{n}` in `text` has a key in `answers`; every `answers` key has a `{n}`.
- No bare `___` (a missing gap) — convert to `{n}` + answer.
- `listLayout: true` for numbered lines; omit for running text.

**`gap-bank`**
- Every `answer` value appears in `bank` (Zod enforces — but fix before running).
- Distractor count = `bank.length − Object.keys(answers).length`; the instruction
  must say "**N words are not needed**" / "**N Wörter sind zu viel**" with that exact N.
- **Cross-gap ambiguity (most common gap-bank bug):** for every bank word, check
  it cannot fit any gap other than its assigned one; for every gap, check no other
  bank word fits. Fix by adding `alts:` or restructuring the gap text.
- Duplicate bank entries are allowed when a word is genuinely needed in two gaps.
- C3 convention: 15 bank items, 10 answers, 5 distractors; `bankCase: upper`.

**`order`** (most error-prone mechanic)
- `answer[position] = tile_index`; the generator renders `answer.map(i => tiles[i])`.
- **Verify by reconstructing:** `answer.map(i => tiles[i]).join(' ')` must equal the
  intended sentence (use the `note:` field as the target).
- `tiles.length === answer.length`.
- Separable verbs split into two tiles (`aufstehen` → `["stehe","auf"]`).
- All verbs **conjugated** (no infinitive tiles unless Futur I / modal / Perfekt requires it).
- No reflexive pronoun bundled into the verb tile (`sich fühlen` → `["fühle","mich"]`).

**`table-fill`** — gap numbers globally unique (not reset per row); each answer matches its column header (ich→1sg, du→2sg, …).

**`single-choice`** — `answer` is one of the option keys; no two options identical;
the distractors are wrong but plausible. H4 (listening) needs `transcript:` + `audio: transcript_ansage1.mp3`.

**`true-false`** — `answer` is boolean `true`/`false` (not a string); one exercise per audio clip.

**`matching`** — `left`/`right` are `{key,text}` objects (never bare strings); every left key has an answer; every answer references a real right key; extra right items are valid distractors.

**`categorize`** — every token's `bucket` matches a bucket key.

**`odd-one-out`** — `odd` is 0-indexed into `items`; `items[odd]` is the outlier described by `why`; 4 items/group, exactly one odd.

**`free-write` / `speaking-prompt`** — `prompt:` unambiguous; `use:` references current-lesson structures; `model:` present for free-write.

### 4.2 Grammar accuracy (exercise text + answers + solutions)

Check against the loaded scope file. High-value checks:
- Articles / gender / case / plural forms (cross-check the Wortschatz).
- Verb conjugation for the subject; separable-verb bracket; modal Satzklammer.
- **Word order:** V2 in main clauses — including after `jedoch`, `trotzdem`,
  `allerdings`, `aber`, `außerdem`, `deshalb`, `dennoch`; verb-final after
  `weil`/`dass`/`wenn`/`als`/`ob`/`obwohl`.
- Reflexive pronouns (`sich` vs `ihr` for sie/Sie; Akk vs Dat).
- Konjunktiv II forms (`wärt` not `wäret`; no `würde`+`möchte`; no stacked modals).
- Relativpronomen case = role in the relative clause.
- `als` (single past) vs `wenn` (repeated/future); `des Herrn` not `des Herren`.
- Capitalisation: all nouns, `Sie`/`Ihr`, and pronouns inside quotes (`„Ich…"`).
- See `common-pitfalls.md` for the full per-level table and reference grammar
  tables (reflexive, Konjunktiv II, Relativpronomen, character genders).

### 4.3 Ambiguity, guessability, distractors
- No gap has two defensible answers; no MC item has two correct options.
- A student who skipped the lesson should not get it right purely by elimination.
- Distractors are plausible but unambiguously wrong; they don't accidentally
  reinforce a known L1 error (primary persona: Bruno, Portuguese L1).

### 4.4 Naturalness & register (exercise text)
- Would a native speaker say the gap sentence? (`Ich esse Brot`, not `Ich konsumiere Brot`.)
- Real collocations (`starker Kaffee`, `eine Tasse Kaffee`).
- du/Sie consistent within a dialogue-based exercise; no stereotype content.

### 4.5 Audio filename accuracy
- Every `audio:` field matches a real file in `<lesson>/audio/` (`ls` it).
- Fix the yml to match actual files (`dialog1_a.mp3`, `dialog1_b.mp3`,
  `hoertext.mp3`, `transcript_ansage1.mp3`) — never invent a filename.
- If an `audio:` points at a file that doesn't exist, flag for audio regen;
  do NOT silently repoint to a different file.

### 4.6 Internal contradictions
- Wortschatz says `die Äpfel` but an exercise uses `die Apfel`; dialogue says
  `du` then later `Sie` with no transition; a solution contradicts the prompt.
  Any direct contradiction is **Critical**.

### 4.7 AI-hallucination detection
- Invented grammar rules, fake exceptions, non-existent words, machine-translated
  word order smuggled into German. If a rule/example feels off and can't be cited
  to Duden / a standard grammar / `AUTHORING.md` / `CURRICULUM.md`, treat as
  **Critical**.

### 4.8 Dual-mode drift (only when lesson-short.md exists)
The audio pipeline reads `lesson.md`; the Short view a learner may toggle to is
`lesson-short.md`. They must agree on:
1. **Dialog turns** — word-for-word (after stripping trailing `  `).
2. **Hörtext transcript** — the blockquote inside the `<details>` spoiler.
3. **Wortschatz nouns** — same article + plural for any noun in both.

```bash
diff <(grep -E '^> \*\*[A-Z][a-z]+(\s\([a-zäöü]+\))?:\*\*' <lesson>/lesson.md      | sed -E 's/  $//') \
     <(grep -E '^> \*\*[A-Z][a-z]+(\s\([a-zäöü]+\))?:\*\*' <lesson>/lesson-short.md | sed -E 's/  $//')
```
**False positives to skip:**
- Footnote `\*` (escaped, lesson.md) vs `*` (unescaped, lesson-short.md) at a line
  end — a footnote marker, not drift. Normalise to `\*` in both.
- **Prüfungstraining exam lessons (`xx/14`)** — the Short is intentionally a
  compact grammar review with no dialogs; skip the dialog drift check.

---

## 5. Severity × confidence

Tag every finding:

| Severity | Meaning |
|----------|---------|
| **Critical** | Blocks shipping — wrong answer key, schema violation, grammar error in a solution, hallucinated rule, CEFR-scope breach. |
| **Major** | Fix before the next lesson — ambiguous bank word, dialog drift, distractor-count mismatch, register break. |
| **Minor** | Fix in the next batch — typo, formatting, missing cross-reference. |
| **Suggestion** | Nice-to-have phrasing/style. |

| Confidence | Meaning |
|------------|---------|
| **High** | Verified against a source (Duden, AUTHORING.md, the guidelines). |
| **Medium** | Likely correct, not verified. |
| **Low** | Subjective judgment. |

Fix all Critical + Major. Quote the offending text with `file:line` as evidence.

---

## 6. Output format

**Default — concise fix-list** (this is what ships):

```markdown
## Review: <lesson>

**Result:** CLEAN — no fixes   ·   OR   ·   <N> fixes

1. <ex id> — <what was wrong> → <fix>   [Critical|Major|Minor]
2. ...

**Audio:** regenerated <slug(s)> · or · none (no transcript changed)
**Validation:** gen-exercises --check passed
**PR:** #<n>   (or "clean — no PR")
```

Keep it to the fixes that matter. Do not emit a score, a per-dimension table, or
"0 findings" rows. **Only** produce the full audit report (executive summary,
per-dimension table, positive findings) when the user explicitly asks for a
"deep review" / "full audit".

---

## 7. Self-healing / knowledge base

After a review, if you found a *new* recurring pattern, propose an append to the
matching file and apply it per the run's convention (the A1–B2 runs committed
skill learnings directly; do that unless told to gate on approval):

- `common-pitfalls.md` — recurring German/schema errors + reference tables
- `false-positives.md` — flagged-but-acceptable constructions (don't re-flag)
- `review-memory.md` — recurring issues seen across lessons
- `decision-log.md` — why a review rule was added/changed
- `style-guide.md` — terminology & formatting decisions

These files are **append-mostly** — grow them, don't rewrite history. `SKILL.md`,
`README.md`, `guidelines-*.md`, and `exercise-guidelines-*.md` are **structural**:
edit only when the user asks for a structural change.

---

## 8. Skill files

```
.claude/skills/review-exercises/
├── SKILL.md                      ← this file (procedure + persona) — READ FIRST
├── README.md                     ← architecture map
├── guidelines-{A1,A2,B1,B2,C1}.md          ← grammar/vocab scope per level
├── exercise-guidelines-{A1,A2,B1,B2,C1}.md ← exercise types/distractors per level
├── review-checklist.md           ← short checklist version of §4
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

## 9. Generator & validation commands

```bash
npx tsx build/gen-exercises.ts <lesson>            # regenerate exercises.md + solutions.md
npx tsx build/gen-exercises.ts <lesson> --check    # dry run; non-zero if yml ≠ committed md
npx tsx build/gen-exercises.ts --all --check       # CI gate; run before pushing multi-lesson work
```

Always run the lesson-level `--check` before committing. The only CI
(`deploy-pages.yml`) runs on push to `main`, not on PRs — so a green local
`--check` plus a PR with no failing checks is the merge gate.
