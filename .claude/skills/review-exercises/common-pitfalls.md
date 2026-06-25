# Common Pitfalls — Exercise Schema & Answer Logic (per CEFR level)

Recurring schema errors and grammar mistakes in `exercises.yml`. Append new
entries as they are discovered. **Format:**

```
## <LEVEL> <topic>
- <error pattern> → <correction>
- <file:line example>  ← optional
```

When a pattern becomes "obvious" (5+ lessons affected), consider promoting it
to `exercise-guidelines-{LEVEL}.md` so reviewers catch it earlier.

---

## Schema errors (apply to ALL levels)

### `order` exercises

- **`answer.map(i => tiles[i])` doesn't reconstruct the target sentence** — most common error overall. Always verify.
- **`answer.length !== tiles.length`** — answer[5] on a 5-tile item is out-of-bounds (undefined).
- **Separable verb prefix glued to verb** — `aufstehe` should be `[stehe, auf]`.
- **Infinitive tile in conjugated position** — `gehe` for `ich gehe`; only Futur I / Modalverb / Perfekt allow infinitives.
- **Reflexive pronoun bundled with verb** — split `sich waschen` into `[wasche, mich]` or `[wäsche, mich]`.

### `gap-bank` exercises

- **Distractor count drift in instructions** — `bank.length - answers.length` must equal "**N words are not needed.**" Recompute every time. (A1/02 fix: 7156c10)
- **Answer not in bank** — Zod catches; fix before running.
- **Cross-gap ambiguity** — bank word fits multiple gaps. Add `alts:` or restructure. (A1/03: ESSE/BRAUCHE both fit "Ich {1} Äpfel und Tomaten")
- **Two gaps share the same unique answer** — only OK if duplicate bank entries are intentional (e.g. A1/05 C1 has `gehe` twice for two separate gaps).
- **Per-gap multiple valid answers without `alts:`** — if a gap has two reasonable bank words, list both in `alts:`.

### `gap-text` exercises

- **Bare `___` placeholders** — should be `{n}` with answer.
- **Gap numbers reused** — D1 mixed lists must number globally, never reset.
- **Sentence fragment with missing verb** — connector (`jedoch`, `trotzdem`, `aber`) without verb slot produces ungrammatical fragment.

### `single-choice` exercises

- **`answer` value not in option keys** — schema violation.
- **H4 missing `transcript:` field** — required for listening comprehension.
- **H4 missing `audio: transcript_ansage1.mp3`** — required (or flagged as missing).
- **All correct answers are (a)** — distribute across keys.

### `true-false` exercises

- **`answer` is string `"true"` not boolean** — Zod catches; use lowercase `true`/`false`.
- **Multiple audio clips in one exercise** — split into separate exercises.

### `matching` exercises

- **Left/right as bare strings** — must be `{key, text}` objects.
- **Left key missing from answers** — every left item must have a match.
- **Answer references non-existent right key** — schema violation.

### `odd-one-out` exercises

- **`odd` index points to wrong item** — `odd: 3` but `why` describes `items[0]`. Cross-reference always.
- **Less than 4 items per group** — should be exactly 4.
- **No clear odd** — `why` doesn't match `items[odd]`.

### `categorize` exercises

- **Token's `bucket` not in `buckets`** — schema violation.
- **Bucket overlap** — exclusive categories only.

### `free-write` exercises

- **Missing `prompt:` or `model:`** — required fields.
- **`use:` references structures not in the lesson** — must be from current lesson.
- **`selfCheck:` checks content not form** — should be form checks.

### `table-fill` exercises

- **Gap numbers reset per row** — must be globally unique.
- **Answer form doesn't match column header** — `ich` column needs 1st sg; `du` needs 2nd sg.

### Audio filename

- **`audio: dialog_a.mp3` when file is `dialog1_a.mp3`** — cross-check every `audio:` field against `ls audio/`.
- **`audio: hoerzu1.mp3` referenced in yml but file is missing** — flag for audio regen.
- **H4 references `transcript_ansage1.mp3` that doesn't exist** — pre-existing audio gen gap; flag for follow-up; do NOT silently rewrite.

---

## A1

### Articles & cases
- **Wrong case after `möchten`** — `Ich möchte ein Kaffee` → `Ich möchte einen Kaffee` (Akk masc)
- **`kein` declension missing** — `Ich habe kein Hunger` → `Ich habe keinen Hunger` (Akk masc)
- **Dative vs accusative after `gefallen`** — `Das Auto gefällt mich` → `Das Auto gefällt mir` (Dat)

### Verb conjugation
- **Bare infinitive after modal verb** — `Ich kann gehen` (modal slot — OK); but `Ich kann gehe` → `Ich kann gehen` (Satzklammer)
- **Wrong auxiliary in Perfekt** — `Ich habe nach Hause gegangen` (movement!) → `Ich bin nach Hause gegangen`
- **Separable verb prefix glued** — `Ich aufstehe` → `Ich stehe auf`

### Word order
- **V2 violation after `und`/`aber`** — `…und bin Student` (correct!) — but students often write `…und ich bin Student`
- **Verb-first order forgotten in yes/no questions** — `Du bist müde?` → `Bist du müde?`
- **Question word in position 2** — `Du wann gehst?` → `Wann gehst du?`

### Vocabulary
- **`wann` vs `wo`** — `Wann wohnst du?` → `Wo wohnst du?`
- **False friends** — `bekommen` (receive, not become), `aktuell` (current, not actual)

### Character gender
- **`er` for `Yuki`** (Japanese female name) — `Yuki kommt aus Japan. Er wohnt…` → `Sie wohnt…`

### Exercise schema
- **H3 distractor count mismatch** — instruction says "5 words not needed" but bank.length - answers.length = 3. Fix the instruction, not the bank. (A1/02 fix: 7156c10)
- **C3 cross-gap ambiguity** — multiple bank words can fit the same gap. Add `alts:` or restructure the gap text. (A1/03: ESSE/BRAUCHE both fit "Ich {1} Äpfel und Tomaten")
- **Order exercise with more than 6 tiles** — too complex for A1; defer to A2
- **Gap-text with subordinate clause in sentence** — defer to A2

---

## A2

### Subordinate clauses
- **Verb-final forgotten after `weil`** — `weil ich bin müde` → `weil ich müde bin`
- **`dass` clause with V2** — `Ich weiß, dass er kommt morgen` → `Ich weiß, dass er morgen kommt`
- **`als` for single past** — `Wenn ich 5 war…` (single past) → `Als ich 5 war…`

### Adjective endings
- **No ending after `ein` masc Nom** — `ein klein Bruder` → `ein kleiner Bruder`
- **No ending after `kein` masc Akk** — `kein guten Freund` → `keinen guten Freund` (acceptable at A2? B2 preferred)

### Two-way prepositions
- **Akkusativ for static location** — `Ich gehe in den Park` (motion) vs `Ich bin im Park` (location)
- **Missing article for cities/countries** — `Ich gehe in Berlin` (no article for cities — correct); but `Ich gehe in die Schweiz` (countries with article — correct)

### Reflexive verbs
- **Wrong reflexive pronoun case** — `Ich wasche mich die Hände` → `Ich wasche mir die Hände` (Dat reflexive for body parts)
- **`sich` confusion with `er/sie`** — `Sie fühlen sich wohl` (3rd pl → sich — correct); but `Ihr fühlt euch wohl` (2nd pl → euch — correct)

### Konjunktiv II polite
- **Verb-final forgotten** — `Ich würde gern ich komme` → `Ich würde gern mitkommen`
- **`würde + möchte`** stacked — INVALID
- **`wäret` (archaic)** — use `wärt` for ihr-form

### Comparative/superlative
- **`als` vs `wie`** — `besser als ich` (comparison) vs `so gut wie ich` (equality)

---

## B1

### Präteritum
- **Wrong auxiliary in Plusquamperfekt** — `Ich hatte nach Berlin gefahren` → `Ich war nach Berlin gefahren`
- **Präteritum of strong verbs** — `er ging`, `er aß`, `er fuhr`, `er las` (irregular vowel changes)
- **Präteritum of modals** — `er konnte`, `er musste`, `er wollte`, `er durfte`, `er sollte`, `er mochte` (no umlaut, no -t ending except *konnte*)

### Subordinate clauses
- **`obwohl` verb position** — `Obwohl ich bin müde, gehe ich` → `Obwohl ich müde bin, gehe ich`
- **Two-part connectors** — `sowohl…als auch`, `weder…noch`, `entweder…oder`, `nicht nur…sondern auch` — both halves required
- **Two-part connector with only one gap** — needs TWO gaps. (Skill error #26)

### Passive
- **Wrong auxiliary** — process passive uses `werden`; state passive uses `sein`
- **No agent** — German passive often omits von-phrase

### Indirect questions
- **Verb-final forgotten** — `Sagen Sie mir, wo ist der Bahnhof?` → `Sagen Sie mir, wo der Bahnhof ist?`

### Genitive
- **`wegen` + Dativ** — A2 habit, no longer acceptable at B1+ — `wegen dem` → `wegen des` (+ Genitiv)
- **`trotz` + Dativ** — same: `trotz dem` → `trotz des`
- **`während` + Dativ** — also Genitiv at B1: `während des Essens`

### Relative clauses
- **Wrong relative pronoun case after preposition** — `Das Buch, mit dem ich lese` (wrong) → `Das Buch, das ich lese` (Akk); or `Das Buch, mit dem ich lerne` (Dat after `mit`)
- **Genitive relative** — `deren`, `dessen` — only at B1

---

## B2

### Konjunktiv I
- **1st/3rd sg identical to Indikativ** — use Konjunktiv II fallback: `er sagt, er habe Zeit` (Konjunktiv I) — but `er sagt, er hätte Zeit` (Konjunktiv II fallback) is also correct
- **Wrong form in indirect speech** — `Er sagte, er hat Zeit` (direct) → `Er sagte, er habe/hätte Zeit` (indirect)

### Passive alternatives
- **`bekommen` + Passiv** — recipient passive: `Ich bekomme ein Buch geschenkt` — needs Dativ recipient + Akkusativ direct object
- **`man` + Aktiv** — only when agent is generic
- **`sein` + Zustandspassiv** — state, not process

### Funktionsverbgefüge
- **Wrong noun form** — `in Frage stellen` (correct), not `in Fragen stellen`
- **Wrong verb choice** — `zur Verfügung stehen` (state) vs `zur Verfügung stellen` (action)
- **Verb not at end** — "Diese Frage stellt man in Frage" (wrong order) — should be `in Frage zu stellen`

### Participles as attributes
- **Partizip I inflection** — `der lesende Mann`, `die lesende Frau`, `das lesende Kind` (weak declension)
- **Partizip II as attribute** — `das gekaufte Auto` (declined like an adjective)
- **Wrong position** — `der Mann lesende` (wrong) vs `der lesende Mann` (correct)

### Nominal style
- **Wrong gender for nominalised verbs** — `das Lesen` (neuter — *-en* nominalisation), `die Verarbeitung` (feminine — *-ung*)
- **Compound chain length** — B2 allows 3 components; C1+ allows longer

### Modalverben subjektiv (B2 specific)
- **Wrong Konjunktiv** — "Er **sollte** König gewesen sein" (wrong) vs "Er **soll** König gewesen sein" (correct — subjektiver Modal)

---

## C1

### Style/register
- **Over-nominalisation** — when a verbal clause is clearer
- **Mixed formal/informal register** — academic words in spoken context
- **Idiom misapplication** — wrong context or mixed metaphor

### Idioms
- **False friends** — `aktuell` ≠ actual, `realisieren` ≠ realize, `sensibel` ≠ sensible
- **Out-of-context idiom** — "Da steppt der Bär bei einer Beerdigung" (wrong register)

### Subtle grammar
- **Verbs of perception + infinitive** — `Ich sehe ihn kommen` (without `zu`); `Ich sehe ihn zu kommen` is non-standard
- **Euphemisms** — register choice between `sterben`/`verstorben`, `sich trennen`/`sich scheiden lassen`

### Modal particles
- **Placement changes meaning** — `Komm mal her!` (friendly) vs `Komm her mal!` (more insistent)
- **`doch` as "yes" to negative question** — `Kommst du nicht? — Doch!` (yes, I am)