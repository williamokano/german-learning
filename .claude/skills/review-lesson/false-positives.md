# False Positives

Acceptable schema patterns or exercise constructions that have been flagged by
reviewers (or could be) but should NOT be flagged. **Format:**

```
## <pattern>
- **Looks like:** <flag description>
- **Why it's actually OK:** <explanation>
- **Where to skip:** <where this applies>
```

---

## Duplicate bank entry

- **Looks like:** a word appears twice in a `gap-bank` `bank:` list (e.g. A1/05 C1 has `gehe` twice)
- **Why it's actually OK:** the word is needed for two different gaps; the validator accepts duplicates
- **Where to skip:** any `gap-bank` with the same word needed in 2+ gaps
- **No fix needed** unless the duplicate is unintentional

---

## C3 bank word fits a gap it's not the canonical answer for

- **Looks like:** a bank word could grammatically fit a gap where it's not the listed answer
- **Why it's actually OK:** A1/A2 level exercises often have multiple grammatical fits but only one contextually-correct answer; the context (dialog flow, scenario) is the disambiguator
- **Where to skip:** A1/A2 gap-bank exercises where the gap text has clear scenario context
- **Fix when seen:** add `alts:` for borderline cases (e.g. ESSE alongside BRAUCHE for "Ich {1} Äpfel und Tomaten")

---

## Char-confusable gap characters

- **Looks like:** gap `{1}` followed by special chars (curly quotes, em-dash, ellipsis)
- **Why it's actually OK:** German uses „…" curly quotes that look like `"`, em-dash `—` that looks like `--`
- **Where to skip:** YAML author traps around quoted strings
- **Fix:** if build fails, single-quote the field

---

## Reflexive pronoun `ihr` in 3rd person singular context

- **Looks like:** reflexive verb with pronoun "ihr" in a 3rd-person sentence
- **Why it's actually OK:** `ihr` is only wrong when used as the reflexive for `sie/Sie` (3rd person); `ihr` is correct as 2nd-person plural reflexive ("ihr wascht euch")
- **Where to skip:** 2nd-person plural contexts only. Never for `sie`/`Sie`.

---

## `möchte` + `gern` stacking

- **Looks like:** "Ich möchte gern…" — student/reviewer wonders if `möchte` and `gern` are stacking
- **Why it's actually OK:** `gern` is an adverb that softens `möchte`; both are idiomatic ("Ich möchte gern einen Kaffee")
- **Where to skip:** ALL uses — `möchte + gern` is standard A1/A2 German
- **NOT to be confused with:** `würde + möchte` stacking, which IS invalid

---

## `das` as relative pronoun (Nom/Acc neuter)

- **Looks like:** "Das Buch, das ich lese, …" — `das` appears twice in one sentence
- **Why it's actually OK:** the first `das` is the demonstrative article, the second is the relative pronoun (same form for Nom and Acc neuter)
- **Where to skip:** all relative clauses with neuter antecedent

---

## Two `am` in a row (e.g. "am Anfang")

- **Looks like:** `am Anfang` — `am` (= an dem) followed by `Anfang` — `am` + capitalised noun
- **Why it's actually OK:** `am` is the contracted form of `an dem`; both are standard
- **Where to skip:** all `am + (Wochentag|Monat|Tageszeit)` constructions: `am Montag`, `am Wochenende`, `am Abend`, `am Anfang`

---

## Person name starting with lowercase

- **Looks like:** German names should be capitalised, but sometimes names like `vogel`, `arnold` (rare) might appear
- **Why it's actually OK:** some rare German surnames are lowercase historically (e.g. `von der Leyen`); standard practice is to capitalise surnames unless preceded by `von/zu/vom/der`
- **Where to skip:** surnames preceded by nobiliary particles (`von`, `zu`, `vom`, `der`)

---

## Empty `audio:` field in yml (H4 not yet generated)

- **Looks like:** H4 has `audio: transcript_ansage1.mp3` but the file is missing in `audio/`
- **Why it's actually OK:** pre-existing audio gen gap; the yml is correct, the audio generator is the gap
- **Where to skip:** lessons where `audio/transcript_ansage1.mp3` is missing — flag for follow-up audio regen; do NOT silently rewrite the yml
- **How to flag:** add to Suggested Memory Updates as `decision-log.md` entry: "Flagged H4 audio missing for {lesson} — pre-existing audio gen gap, follow-up needed"

---

## Order exercise with all same-word tiles (rare but valid)

- **Looks like:** an order item has all tiles being articles (e.g. `[der, die, das]`) — looks like a guessability bug
- **Why it's actually OK:** if the gap text says "_____ Tisch" or similar, the only correct answer is `der`; tiles are distractors
- **Where to skip:** order exercises with `<3 plausible` answers and explicit context

---

## Free-write with `model:` longer than `prompt:`

- **Looks like:** the model answer is 200 words for a 3-sentence prompt — looks like a misalignment
- **Why it's actually OK:** the model demonstrates the full range of expected structures; the prompt asks for 3–4 sentences but a strong student might write more
- **Where to skip:** free-write exercises where the model demonstrates the upper bound of expected output
- **Alternative:** shorten the model to match the prompt's length expectation

---

## True-false answer with longer `why:` than the question

- **Looks like:** the `why:` explanation is a full sentence for a short question
- **Why it's actually OK:** explanations clarify edge cases and common learner errors
- **Where to skip:** true-false exercises where the explanation provides context beyond the question

---

## Matching with more right items than left items

- **Looks like:** matching exercise has 8 right items but only 5 left items — looks like a typo
- **Why it's actually OK:** the extra right items are distractors
- **Where to skip:** all matching exercises (intentional pattern)

---

## Order exercise with verb-first question word (e.g. "Wann gehst du?")

- **Looks like:** the order is `["Wann", "gehst", "du", "?"]` with answer `[0, 1, 2, 3]`
- **Why it's actually OK:** W-questions have verb-second position, not verb-first; `Wann` (W-word) is in position 1, `gehst` (verb) is in position 2, `du` (subject) is in position 3
- **Where to skip:** W-question order exercises (NOT yes/no questions, which are verb-first)

---

## Audio file path with no leading slash

- **Looks like:** `audio: audio/dialog1_a.mp3` (with explicit `audio/` prefix)
- **Why it's actually OK:** both `audio: dialog1_a.mp3` and `audio: audio/dialog1_a.mp3` are accepted by the generator
- **Where to skip:** audio field paths in either form

---

## `alts:` field that includes the canonical answer

- **Looks like:** `answers: "1": komme` with `alts: "1": [{word: komme, note: "..."}, {word: gehe, note: "..."}]`
- **Why it's actually OK:** explicitly listing the canonical answer in `alts` (with a `note`) is fine; the alternative is for borderline cases
- **Where to skip:** any `alts:` block

---

## Dialog drift: `\*` vs `*` escaping at end of speaker line

- **Looks like:** `lesson.md` line X differs from `lesson-short.md` line X — trailing `\*` (escaped asterisk) vs `*` (unescaped asterisk)
- **Why it's actually OK:** the asterisk is a footnote marker, not content drift; both render the same in CommonMark
- **Where to skip:** speaker lines ending in `\*` or a `\*\**` footnote reference
- **Fix when convenient:** escape with `\*` in BOTH files for consistency (seen in A1/04, A1/10)

---

## Dual-mode drift in Prüfungstraining lessons (`xx/14`) is intentional

- **Looks like:** `lesson-short.md` is missing 20+ dialog turns that exist in `lesson.md`
- **Why it's actually OK:** exam lessons (`A1/14`, `A2/14`, `B1/14`, `B2/14`) intentionally have Short = a compact grammar-review sheet, not a dialog transcript
- **Where to skip:** ALL Prüfungstraining lessons — skip the dialog drift check entirely for these

---

## Drift grep matches the header blockquote, not a dialog turn

- **Looks like:** the dual-mode drift `diff` reports a difference on a line such as `> **Grammatik:**` or `> **Builds on:**`
- **Why it's actually OK:** the speaker-line grep `^> **Word:**` also matches the lesson's **header blockquote** (`Du lernst` / `Grammatik` / `Builds on`), which is metadata, not a dialog turn. The Full header bolds its inner text (`**Konjunktiv II …**`) while the Short header is plainer — a view-formatting difference, not content drift.
- **Where to skip:** any reported "drift" line whose key is a header field (Du lernst / You will learn / Grammatik / Grammar / Builds on / Wortschatz / Redemittel). Confirm the actual speaker turns (`Anna:`, `Bruno:`, `Frau …:`) agree. Seen in B2/03.
- **Fix:** the SKILL.md §6.2 drift snippet now filters these header keys out (and matches multi-word speaker labels like `Frau Yilmaz`); if a new header field appears, add it to the exclusion list.