# False Positives

Acceptable constructions or patterns that have been flagged by reviewers
(or could be) but should NOT be flagged. **Format:**

```
## <pattern>
- **Looks like:** <flag description>
- **Why it's actually OK:** <explanation>
- **Where to skip:** <where this applies>
```

---

## Dialog drift: `\*` vs `*` escaping at end of speaker line

- **Looks like:** `dialog1_a.md` line X differs from `dialog1_b.md` line X — trailing `\*` (escaped asterisk) vs `*` (unescaped asterisk)
- **Why it's actually OK:** the asterisk is a footnote marker, not content drift; both render the same in CommonMark
- **Where to skip:** speaker lines ending in `\*` or `\*\**` footnote references
- **Fix when convenient:** escape with `\*` in BOTH files for consistency

---

## A1/14, A2/14, B1/14, B2/14 dialog drift (Prüfungstraining)

- **Looks like:** Short version is missing 20+ dialog turns that exist in the Full version
- **Why it's actually OK:** exam lessons (`xx/14`) intentionally have Short = grammar review sheet, not dialog transcript
- **Where to skip:** ALL Prüfungstraining lessons; their Short is a study reference, not a teaching text

---

## C3 bank word fits a gap it's not the canonical answer for

- **Looks like:** a bank word could grammatically fit a gap where it's not the listed answer
- **Why it's actually OK:** A1/A2 level exercises often have multiple grammatical fits but only one contextually-correct answer; the context (dialog flow, scenario) is the disambiguator
- **Where to skip:** A1/A2 gap-bank exercises where the gap text has clear scenario context. Always check that the listed answer is contextually best.
- **Fix when seen:** add `alts:` for borderline cases (e.g. ESSE alongside BRAUCHE for "Ich {1} Äpfel und Tomaten")

---

## Duplicated bank entry

- **Looks like:** a word appears twice in a `gap-bank` `bank:` list (e.g. A1/05 C1 has `gehe` twice)
- **Why it's actually OK:** the word is needed for two different gaps; the validator accepts duplicates
- **Where to skip:** any `gap-bank` with the same word needed in 2+ gaps
- **No fix needed** unless the duplicate is unintentional

---

## Char-confusable gap characters

- **Looks like:** gap `{1}` followed by special chars (curly quotes, em-dash, ellipsis)
- **Why it's actually OK:** German uses „…" curly quotes that look like `"`, em-dash `—` that looks like `--`
- **Where to skip:** YAML author traps around quoted strings; use single quotes for German text with curly quotes
- **Fix:** if build fails, single-quote the field

---

## Reflexive pronoun `ihr` in 3rd person singular context

- **Looks like:** reflexive verb with pronoun "ihr" in a 3rd-person sentence
- **Why it's actually OK:** `ihr` is only wrong when used as the reflexive for `sie/Sie` (3rd person); `ihr` is correct as 2nd-person plural reflexive ("ihr wascht euch")
- **Where to skip:** 2nd-person plural contexts only. Never for `sie`/`Sie`.
- **Reference:** see `common-pitfalls.md` §A1 — reflexive pronouns table.

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
