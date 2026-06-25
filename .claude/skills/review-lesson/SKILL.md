---
name: review-lesson
description: >
  Review a German lesson's exercises.yml for correctness — grammar, schema
  compliance, and answer accuracy — then regenerate, validate, commit, and push.
  Auto-invoke whenever the user says "review lesson", "check lesson", or names
  a specific lesson directory for review.
  When the lesson ships both `lesson.md` (v2 Full) and `lesson-short.md`
  (v1 Short), also verify the two files agree on dialogs, Hörtext, and
  Wortschatz — see the "Dual-mode drift checks" section below.
triggers:
  - "review lesson"
  - "review B1/"
  - "review A1/"
  - "review A2/"
  - "check lesson"
  - "fix lesson"
---

# Lesson Review Skill

## What you are doing

You are acting as a German professor and YAML engineer reviewing one lesson's
`exercises.yml`. Your job: find every grammar error, schema violation, and
answer-logic bug; fix them; regenerate; validate; commit; and push.

**Never co-author commits** (CLAUDE.md constraint — no Co-Authored-By line).

---

## Step-by-step workflow

```
1. Read <lesson>/exercises.yml fully
2. Run all checks below (per-type + grammar)
3. Fix every error found
4. npx tsx build/gen-exercises.ts <lesson>
5. npx tsx build/gen-exercises.ts <lesson> --check   ← must exit 0
6. git add <lesson>/{exercises.yml,exercises.md,solutions.md}
7. git commit -m "Review: <lesson> — <summary of fixes>"
8. git push
```

---

## Exercise types: schemas and verification rules

### `gap-text`
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
- `layout: list` if items are numbered lines; omit or `inline` for running text

### `gap-bank`
```yaml
type: gap-bank
instructions: "Fill the 10 gaps. **Five words are not needed.**"
bank: [word1, word2, ..., word15]
answers: { 1: word1, 2: word3, ... }
```
**Checks:**
- Count: `bank.length - Object.keys(answers).length` = distractor count
- Instruction must say "**N words are not needed.**" where N = distractor count
- Every answer value MUST appear in `bank` (Zod-validated, will fail build)
- `bankCase: upper` for C3 (all caps); default lowercase for H3

### `order`
```yaml
type: order
items:
  - tiles: ["heiße", "ich", "Anna"]
    answer: [1, 0, 2]   # → tiles[1]=ich, tiles[0]=heiße, tiles[2]=Anna → "ich heiße Anna"
```
**Critical mechanic** — the most error-prone type:
- `answer[position] = tile_index`
- Generator renders: `answer.map(idx => tiles[idx])`
- To verify: manually compute `answer.map(i => tiles[i])` — does it match the intended sentence?
- `note:` field = the intended target sentence (use it to verify)
- Tile count = answer array length; they must be equal
- Separable verbs MUST be split: "anrufen" → tiles ["rufe", "an"] in correct positions
- No reflexive pronoun bundled with verb: split "sich waschen" → ["wasche", "mich"] or ["wäsche", "mich"]

**Verification algorithm:**
```
tiles = item.tiles
expected_sentence = item.note  (or infer from context)
rendered = item.answer.map(i => tiles[i]).join(' ')
assert rendered == expected_sentence
```

### `table-fill`
```yaml
type: table-fill
columns: ["ich", "du", "er/sie/es", "wir", "ihr", "sie/Sie"]
rows:
  - label: "sein"
    cells: [
      {gap: 1, answer: bin}, {gap: 2, answer: bist}, {gap: 3, answer: ist},
      {gap: 4, answer: sind}, {gap: 5, answer: seid}, {gap: 6, answer: sind}
    ]
```
**Checks:**
- Gap numbers are globally unique (not reset per row)
- Answer forms match the column header (ich→1st sg, du→2nd sg, etc.)

### `single-choice`
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
- `optionLayout: block` for H4 (listening), `inline` (default) for C2
- H4: must have `transcript:` field and `audio:` pointing to `transcript_ansage1.mp3`

### `true-false`
```yaml
type: true-false
items:
  - { q: "Anna kommt aus Russland.", answer: true, why: "aus Jaroslawl" }
```
**Checks:**
- `answer` is boolean `true` or `false` (not string)
- One exercise per audio clip — never mix clips
- `audio:` field required if based on listening

### `matching`
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

### `categorize`
```yaml
type: categorize
buckets: [{key: gruss, label: "Begrüßung"}, {key: abschied, label: "Abschied"}]
tokens:
  - {text: "Hallo", bucket: gruss, tag: "(I)"}
```
**Checks:**
- Every token's `bucket` matches a bucket key
- `tag:` is optional, used for register (I = informal, F = formal)

### `odd-one-out`
```yaml
type: odd-one-out
groups:
  - {items: ["Hallo", "Guten Tag", "Tschüss", "Guten Morgen"], odd: 2, why: "farewell, not greeting"}
```
**Checks:**
- `odd` is 0-indexed into `items`
- Cross-reference: `items[odd]` must match what `why` describes as the outlier
- 4 items per group; exactly one odd

**Verification algorithm:**
```
items[group.odd]  →  should be the word described in group.why as "odd"
```

### `free-write` / `speaking-prompt`
These are self-assessed. Check:
- `prompt:` exists and is unambiguous
- `use:` list refers to structures from the current lesson
- `selfCheck:` checks form, not content
- `model:` answer present in `free-write`

---

## German grammar correctness rules

### Reflexive pronouns
| Pronoun | Akkusativ | Dativ |
|---------|-----------|-------|
| ich | mich | mir |
| du | dich | dir |
| er/sie/es | sich | sich |
| wir | uns | uns |
| ihr | euch | euch |
| sie/Sie | sich | sich |

- Reflexive verbs that take Akkusativ: sich waschen, sich fühlen, sich freuen, sich treffen
- Reflexive verbs that take Dativ: sich etwas vorstellen, sich etwas wünschen, sich Sorgen machen
- **Common trap:** `ihr` is a pronoun/possessive, NOT the reflexive for `sie`. `sich` is always the reflexive for 3rd person.

### Separable verbs in order exercises
Split the verb: `aufstehen` → `stehe` + `auf` (prefix goes to end of main clause).
Never use infinitive form as a tile in conjugated sentences.

### Subordinate clause word order
- `weil`, `dass`, `obwohl`, `wenn`, `als`, `ob` → verb to END
- `weil ich müde bin` ✓ / `weil ich bin müde` ✗

### `als` vs `wenn`
- `als` = single past event (Präteritum/Perfekt context)
- `wenn` = repeated past events OR future/conditional

### Konjunktiv II
| Verb | Form |
|------|------|
| würde | würde/würdest/würde/würden/würdet/würden |
| sein | wäre/wärst/wäre/wären/wärt/wären |
| haben | hätte/hättest/hätte/hätten/hättet/hätten |
| können | könnte/könntest/könnte/könnten/könntet/könnten |

- "würde+möchte" is INVALID — can't stack two modal-equivalent forms. Use `würden Sie gern` or `möchten Sie`.

### Relativpronomen
| | Nominativ | Akkusativ |
|-|-----------|-----------|
| masc | der | den |
| fem | die | die |
| neut | das | das |
| pl | die | die |

- Verb goes to END of relative clause
- Case determined by the role in the RELATIVE clause (not the antecedent's case)
- Feminine antecedent as object → `die` (Akk fem = Nom fem, same form)

### Futur I
`werden` (conjugated) + infinitive at END of clause.
- `ich werde kommen` ✓ / `ich werde komme` ✗
- Subordinate: `weil ich kommen werde` (werden to end, infinitive before it)

### Verb forms in exercises
- Tiles in `order` exercises must be CONJUGATED (not infinitive) unless the sentence requires infinitive (Futur I, Modalverb, Perfekt)
- Check: does `tiles[answer[1]]` (verb-slot tile) match the subject?

### Character consistency
| Character | Gender | Origin |
|-----------|--------|--------|
| Anna | female (sie) | Russia, Jaroslawl |
| Bruno | male (er) | Brazil, Blumenau |
| Yuki | **female** (sie) | Japan, Osaka |
| Frau Weber | female (sie) | German |
| Herr Steinmeyer | male (er) | Austria, Salzburg |

**Common trap:** Yuki is female — never use `er` for Yuki.

---

## Common errors catalogue (from A1/A2 review)

### Schema errors
1. **`order` answer arrays computed incorrectly** — most common error overall. Always verify with `answer.map(i => tiles[i])`.
2. **`order` answer length ≠ tiles length** — answer[5] on a 5-tile item is out-of-bounds (undefined).
3. **`gap-bank` distractor count wrong in instructions** — compute `bank.length - answers.length`.
4. **`odd` index points to wrong item** — `odd: 3` but `why` describes `items[0]`. Cross-reference always.
5. **Bare `___` placeholders** in gap-text/gap-bank with no gap number and no answer — add `{n}` and answer.
6. **`matching` items as bare strings** instead of `{key, text}` objects.
7. **`gap-bank` answer not in bank** — Zod catches this but fix before running.
7a. **Audio filename mismatch in yml vs actual files** — `audio: b1_13_dialog_a.mp3` when the file is actually `dialog1_a.mp3`. Cross-check every `audio:` field against `ls audio/` and fix the yml to match.
7b. **`H4` references `transcript_ansage1.mp3` that doesn't exist** — pre-existing audio gen gap. Flag for follow-up audio regen; do NOT silently rewrite to a different filename.
7c. **C3 gap-bank cross-gap ambiguity** — a single bank word fits two different gaps, or a single gap has two valid bank words. Run a mental simulation: for each bank word, can it fit any gap besides its assigned one? For each gap, can any other bank word fit? Examples seen in A1/03 (ESSE/BRAUCHE both fit gap 1) and A1/09 (GEFÄLLT/PASST/STEHT are cross-ambiguous). Fix by adding `alts:` or restructuring the gap text.
7d. **Duplicate bank entries are allowed** — when a word is needed in 2 gaps (e.g. A1/05 C1 has `gehe` twice for two separate gaps), the bank can list it twice. Zod does not enforce uniqueness. This is the workaround when no alt-distractor is available.

### Grammar errors
8. **Reflexive pronoun `ihr` for `sie`** — should be `sich`.
9. **Infinitive tiles in order exercises** — should be conjugated.
10. **Compound reflexive tile** (`sich fühlen` as one tile) can't cover two positions — split.
11. **`wäret` as valid Konjunktiv II ihr-form** — archaic; use `wärt` or restructure.
12. **`würde` + `möchte`** stacked — invalid construction. Also `würde` + another full verb infinitive is fine (`würde essen`), but **two stacked modals** like `Das durfte nicht passieren dürfen!` is wrong.
13. **Verb not at end of `weil`/`dass` clause**.
14. **Relativpronomen case wrong** — check the role in the relative clause.
15. **`als` used for repeated past / future** — should be `wenn`.
16. **`was` instead of `wer`** in comprehension question about a person.
17. **Futur I infinitive in finite position** — `freue` where `freuen` needed (Futur I requires infinitive).
18. **Preposition instruction too narrow** — instruction lists `nach, in, aus` but an item needs `zum` or `in die`. List all forms.
19. **`A9` instructions say "Write down" implying sentences given, but it's actually fill-in-the-blank** — use "Fill in".
20. **Gap count claim in instructions doesn't match actual gaps** — count gaps manually.
20a. **D1/D4 item-count claim doesn't match** — "5 items" but text has 6 gaps. Always count `{n}` placeholders in `text:` and reconcile with the instruction count.
21. **Sentence fragment with missing verb** — gap-fill template includes connector (`jedoch`, `trotzdem`, `aber`) but no verb slot, producing an ungrammatical fragment like "Jedoch die Qualität schlecht" (missing `ist`).
22. **V2 verb position after conjunctions** — main clause verb must be in V2 position even after `jedoch`, `trotzdem`, `allerdings`, `aber`, `außerdem`, `deshalb`. Bug: "aber viele Menschen sich das leisten können" → "aber viele Menschen können sich das leisten" (verb moves to V2).
23. **Lowercase pronouns inside quoted dialogue** — German `ich`, `du`, `er`, `sie`, `wir`, `ihr` are always capitalized. Cross-check every lowercase `ich`/`du` in items, including inside `"…"` quotes.
24. **`des Herrn` (not `des Herren`)** — Genitive of `der Herr` is `des Herrn`. Easy typo in odd-one-out items.
25. **Missing or wrong relative-pronoun label in exercise prompts** — label says "Relativpronomen Nom." but the answer is an accusative form (`den`). Verify label matches the case shown by the answer.
26. **Restructured connector with only one gap** — for pairs like `sowohl … als auch`, the template needs TWO gaps, not one. Bug: "Sie liebt {12} Berlin, sie kritisiert es" with answer "sowohl" — needs `Sie liebt {12} Berlin, {13} sie kritisiert es`.

---

## Verification checklist (run through every exercise)

### For every exercise
- [ ] `id` and `block` field present
- [ ] `type` is a valid type (gap-text, gap-bank, order, table-fill, single-choice, true-false, matching, categorize, odd-one-out, free-write, speaking-prompt)
- [ ] `instructions:` count claims match actual item counts

### Per-type quick checks
- [ ] `gap-text`: every `{n}` has answer; no bare `___`
- [ ] `gap-bank`: `bank.length - answers.length` = N in "N words not needed"; all answers in bank
- [ ] `order`: for each item, `answer.map(i => tiles[i])` = target sentence; lengths match
- [ ] `odd-one-out`: `items[odd]` = word described by `why`
- [ ] `matching`: left/right as objects; answers reference valid keys
- [ ] `true-false`: answer is boolean, not string

### German correctness
- [ ] Reflexive pronoun correct (especially `sich` vs `ihr` for sie/Sie)
- [ ] Separable verbs split in order exercises
- [ ] Subordinate clause verb position (weil/dass/wenn/als → verb last)
- [ ] Konjunktiv II forms correct (wäre/wärst not wäret; hätte/würde not stacked)
- [ ] Relativpronomen case matches role in relative clause
- [ ] Character genders correct (Yuki = sie, not er)
- [ ] Tiles in order exercises are conjugated, not infinitive (unless context requires infinitive)

### Block structure
- [ ] H3 gap-bank: `audio: hoertext.mp3`; distractor count in instructions correct
- [ ] H4 single-choice: `audio: transcript_ansage1.mp3`; `transcript:` field set
- [ ] C3 gap-bank: 15 bank items, 10 gaps, 5 distractors; `bankCase: upper`; `bankSort: true`
- [ ] D2 odd-one-out: 6 groups of 4; `odd` verified against `why`
- [ ] D4: `notes:` field with pass threshold and retry advice

---

## Generator and validation commands

```bash
# Regenerate exercises.md + solutions.md
npx tsx build/gen-exercises.ts <lesson>

# Validate (dry run — exits non-zero if yml ≠ committed md)
npx tsx build/gen-exercises.ts <lesson> --check

# Validate all lessons (CI gate)
npx tsx build/gen-exercises.ts --all --check
```

After fixing, always run the lesson-level check before committing. Run `--all --check` before pushing if touching multiple lessons.

---

## Dual-mode drift checks (v2)

When a lesson directory contains **both** `lesson.md` (v2 Full) and
`lesson-short.md` (v1 Short), the two files must agree on three things —
otherwise the audio pipeline (which reads `lesson.md`) and the Short view
(which a learner may switch to) will be out of sync. Drift between them is a
silent bug.

1. **Dialog text.** For each `## 1. Dialog` and `### Dialog A/B` block, the
   speaker turns must be **word-for-word identical** between the two files.
   Extract every `> **Speaker:** Text  ` line from each file (after stripping
   the trailing double-spaces) and `diff` them. Any divergence is a bug.
2. **Hörtext transcript.** The blockquote inside the `<details>` spoiler of
   `## 6. Hörtext` (Short) / `## 8. Hörtext` (Full) must match. Same diff.
3. **Wortschatz nouns.** Every noun in the Short view's Wortschatz tables
   must appear (with the same article and plural form) in the Full view's
   Wortschatz. A noun in Short that is missing from Full is acceptable (Short
   is a subset of Full is not required); a noun in Full that is missing from
   Short is **also** acceptable (Full adds vocab). The forbidden case is
   **divergent form** — *die Schweiz* in Short and *das Schweiz* in Full is
   a bug.

A small helper:

```bash
# Compare dialog turns between Full and Short (A1/01 example)
diff \
  <(grep -E '^> \*\*[A-Z][a-z]+(\s\([a-zäöü]+\))?:\*\*' A1/01-erste-kontakte/lesson.md \
    | sed -E 's/  $//') \
  <(grep -E '^> \*\*[A-Z][a-z]+(\s\([a-zäöü]+\))?:\*\*' A1/01-erste-kontakte/lesson-short.md \
    | sed -E 's/  $//')
```

Empty output = dialogs agree. Any line = divergence, fix both files.

The drift checks are **advisory** (the skill does not block on them) but
should be run before every commit that touches a lesson directory.

**Drift false-positives to skip:**
- Footnote-marker asterisks: `\*` (escaped, lesson.md) vs `*` (unescaped, lesson-short.md) at end of a speaker line. The asterisk is a footnote reference, not a content drift. Fix by escaping with `\*` in BOTH files for consistency (seen in A1/04, A1/10).
- **A1/14, A2/14, B1/14, B2/14 (Prüfungstraining exam lessons)** — the Short version is intentionally a compact grammar review and does NOT include the dialogs from the Full version. Skip the dialog drift check for these.

---

## Commit format

```bash
git commit -m "Review: <lesson-dir> — <comma-separated fix list>"
# Example:
git commit -m "Review: B1/03-kommunikation — fix order answer arrays, H3 distractor count, D2 odd indices"
```

Push immediately after each lesson commit:
```bash
git push
```

---

## YAML authoring traps (pre-empt before writing fixes)

1. **German `„…"` close-quote inside double-quoted YAML** — closes string prematurely. Fix: single-quote the field.
2. **Flow-style items ending in `."` ** — triggers `Unexpected flow-map-end`. Fix: convert to block style.
3. **`matching` left/right as bare strings** — must be `{key, text}` objects.
4. **`gap-bank` answer not in bank** — Zod rejects. Fix: add to bank or correct answer.
5. **Reused gap numbers** in D1 mixed list — number them globally, never reset.
6. **C4 is always C4a + C4b** (two separate exercises), not one combined C4.
7. **H1 with two dialog clips** → H1a + H1b (one exercise per clip).
