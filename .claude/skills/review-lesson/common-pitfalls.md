# Common Pitfalls (per CEFR level)

Recurring German errors encountered during reviews. Append new entries as
they are discovered. **Format:**

```
## <LEVEL> <topic>
- <error pattern> → <correction>
- <file:line example>  ← optional
```

When a pattern becomes "obvious" (5+ lessons affected), consider promoting it
to `guidelines-{LEVEL}.md` so reviewers catch it earlier.

---

## A1

### Articles & cases
- **Wrong case after `möchten`** — `Ich möchte ein Kaffee` → `Ich möchte einen Kaffee` (Akk masc)
- **`kein` declension missing** — `Ich habe kein Hunger` → `Ich habe keinen Hunger` (Akk masc)
- **Dative vs accusative after `gefallen`** — `Das Auto gefällt mich` → `Das Auto gefällt mir` (Dat)
- **Wrong article for plural indefinite** — `kein` stays `keine` for plurals; `Ich habe kein Äpfel` → `Ich habe keine Äpfel`

### Verb conjugation
- **Bare infinitive after modal verb** — `Ich kann gehen` (modal slot filled by infinitive — OK); but `Ich kann gehe` → `Ich kann gehen` (Satzklammer)
- **Wrong auxiliary in Perfekt** — `Ich habe nach Hause gegangen` (movement!) → `Ich bin nach Hause gegangen`
- **Separable verb prefix glued** — `Ich aufstehe` → `Ich stehe auf`
- **Modal particles confused with verbs** — `Kannst du mal helfen?` (correct chunk)

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

---

## A2

### Subordinate clauses
- **Verb-final forgotten after `weil`** — `weil ich bin müde` → `weil ich müde bin`
- **`dass` clause with V2** — `Ich weiß, dass er kommt morgen` → `Ich weiß, dass er morgen kommt`
- **`als` for single past** — `Wenn ich 5 war…` (single past) → `Als ich 5 war…`

### Adjective endings
- **No ending after `ein` masc Nom** — `ein klein Bruder` → `ein kleiner Bruder` — but `klein` is correct after `der`, `dieser`, etc. (`der kleine Bruder`)
- **No ending after `kein` masc Akk** — `kein guten Freund` → `keinen guten Freund`

### Two-way prepositions
- **Akkusativ for static location** — `Ich gehe in den Park` (motion) vs `Ich bin im Park` (location)
- **Missing article for cities/countries** — `Ich gehe in Berlin` (no article for cities — correct); but `Ich gehe in die Schweiz` (countries with article — correct); `Ich gehe in der Schweiz` is wrong

### Reflexive verbs
- **Wrong reflexive pronoun case** — `Ich wasche mich die Hände` → `Ich wasche mir die Hände` (Dat reflexive for body parts)
- **`sich` confusion with `er/sie`** — `Sie fühlen sich wohl` (3rd pl → sich — correct); but `Ihr fühlt euch wohl` (2nd pl → euch — correct)

### Konjunktiv II polite
- **Verb-final forgotten** — `Ich würde gern ich komme` → `Ich würde gern mitkommen`
- **`würde + möchte`** stacked — INVALID
- **`würde` + infinitive** is fine: `Ich würde essen`

### Comparative/superlative
- **`als` vs `wie`** — `besser als ich` (comparison) vs `so gut wie ich` (equality)
- **Superlative declension** — `am größten` (adverb) vs `der größte Berg` (attributive)

---

## B1

### Präteritum
- **Wrong auxiliary in Plusquamperfekt** — `Ich hatte nach Berlin gefahren` → `Ich war nach Berlin gefahren`
- **Präteritum of strong verbs** — `er ging`, `er aß`, `er fuhr`, `er las` (irregular vowel changes)
- **Präteritum of modals** — `er konnte`, `er musste`, `er wollte`, `er durfte`, `er sollte`, `er mochte` (no umlaut, no -t ending except *konnte*)

### Subordinate clauses
- **`obwohl` verb position** — `Obwohl ich bin müde, gehe ich` → `Obwohl ich müde bin, gehe ich`
- **Two-part connectors** — `sowohl…als auch`, `weder…noch`, `entweder…oder`, `nicht nur…sondern auch` — both halves required

### Passive
- **Wrong auxiliary** — process passive uses `werden` (Präsens: `wird`; Präteritum: `wurde`); state passive uses `sein`
- **No agent** — German passive often omits von-phrase: `Das Auto wird gekauft` (no agent) is fine

### Indirect questions
- **Verb-final forgotten** — `Sagen Sie mir, wo ist der Bahnhof?` → `Sagen Sie mir, wo der Bahnhof ist?`

### Genitive
- **`wegen` + Dativ** — A2 habit, no longer acceptable at B1+ — `wegen dem` → `wegen des` (+ Genitiv)
- **`trotz` + Dativ** — same: `trotz dem` → `trotz des`
- **`während` + Dativ** — also Genitiv at B1: `während des Essens`

### Relative clauses
- **Wrong relative pronoun case after preposition** — `Das Buch, mit dem ich lese` (wrong: Dat → expected: `das` if no preposition) → `Das Buch, das ich lese` (Akk, no preposition); or `Das Buch, mit dem ich lerne` (Dat after `mit`)
- **Genitive relative** — `deren`, `dessen` — only at B1

---

## B2

### Konjunktiv I
- **1st/3rd sg identical to Indikativ** — use Konjunktiv II fallback for 3rd sg: `er sagt, er habe Zeit` (Konjunktiv I) — but `er sagt, er hätte Zeit` (Konjunktiv II fallback) is also correct
- **Wrong form in indirect speech** — `Er sagte, er hat Zeit` (direct) → `Er sagte, er habe/hätte Zeit` (indirect)

### Passive alternatives
- **`man` + Aktiv** — passive alternative; only when agent is generic
- **`sein` + Zustandspassiv** — state, not process
- **`bekommen` + Passiv** — recipient passive: `Ich bekomme ein Buch geschenkt`

### Funktionsverbgefüge
- **Wrong noun form** — `in Frage stellen` (correct), not `in Fragen stellen`
- **Wrong verb choice** — `zur Verfügung stehen` (state) vs `zur Verfügung stellen` (action)

### Participles as attributes
- **Partizip I inflection** — `der lesende Mann`, `die lesende Frau`, `das lesende Kind` (weak declension as adjective)
- **Partizip II as attribute** — `das gekaufte Auto` (declined like an adjective)

### Nominal style
- **Wrong gender for nominalised verbs** — `das Lesen` (neuter — *-en* nominalisation), `die Verarbeitung` (feminine — *-ung*)
- **Compound chain length** — B2 allows 3 components; C1+ allows longer

---

## C1

### Style/register
- **Over-nominalisation** — when a verbal clause is clearer
- **Mixed formal/informal register** — academic words in spoken context, or vice versa
- **Idiom misapplication** — wrong context or mixed metaphor

### Idioms
- **False friends** — `aktuell` ≠ actual, `realisieren` ≠ realize, `sensibel` ≠ sensible, `aktuell` (current/relevant)

### Subtle grammar
- **Verbs of perception + infinitive** — `Ich sehe ihn kommen` (without `zu`); `Ich sehe ihn zu kommen` is non-standard
- **Euphemisms** — register choice between `sterben`/`verstorben`, `sich trennen`/`sich scheiden lassen`

### Modal particles
- **Placement changes meaning** — `Komm mal her!` (friendly) vs `Komm her mal!` (more insistent)
- **`doch` as "yes" to negative question** — `Kommst du nicht? — Doch!` (yes, I am)
