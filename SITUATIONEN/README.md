# SITUATIONEN — Alltagssituationen

Exercise sets built around **one concrete situation** rather than one grammar
point: ordering in a café, arguing with the Finanzamt, reporting a stolen bike
to the Hausverwaltung, buying a car. The question a set answers is *"what do I
actually say when I have to do this?"* — the grammar is whatever that situation
happens to demand.

This is the counterpart to `THEMEN/`, which is organised the other way round
(one grammar point, drilled across levels). Same engine, same widgets, same
`exercises.yml` → generated `exercises.md`/`solutions.md` pipeline.

## Where they live on the site

Each set is served at `/situationen/<dir-slug>/uebungen/`, built by the same
`[level]/[lesson]/uebungen.astro` route the curriculum lessons use — it derives
its route purely from the `exercises` content collection, so a directory here
needs nothing but `exercises.yml` to become a working page. A landing page at
`/situationen/` lists every set grouped by `category`.

## File layout and naming

```
SITUATIONEN/<NN>-<situation-slug>-<level>/
└── exercises.yml   # hand-authored source
└── exercises.md    # generated — npx tsx build/gen-exercises.ts SITUATIONEN/<dir>
└── solutions.md    # generated
```

- `NN` — two-digit situation number (own numbering, independent of the others').
- `<situation-slug>` — short kebab-case name (`im-cafe`, `beim-finanzamt`).
- `<level>` — the CEFR level this file targets. A situation worth doing at two
  levels gets one directory per level, exactly like `THEMEN/`: the A1 version of
  the café teaches ordering, the B1 version handles the bill being wrong.

There is no `lesson.md`, `lesson-short.md`, `vocab.yml` or `audio/` — like
`THEMEN/`, these are exercises only.

## `exercises.yml` fields

- `lesson:` — `SIT/<dir-slug>` (e.g. `SIT/01-im-cafe-a1`). Namespace-disjoint
  from curriculum lessons *and* from `THEMEN/`'s `EX/`, so localStorage
  progress and Fehlerbuch keys never collide.
- `topic:` — the situation's short name, shown as the card title
  (e.g. `"Im Café"`). Shared by every level-variant of the same situation.
- `level:` — the CEFR level, for the badge and for sorting within a category.
- `summary:` — one line of what the set gets you through, shown on the card.
  `title` is only `"<topic> — <level>"`, both of which the card already
  displays, so without a summary the card says nothing new.
- `category:` — the shelf this situation sits on. The index page renders
  categories in a fixed order, defined in `web/src/pages/situationen/index.astro`:

  `Essen & Trinken` · `Einkaufen` · `Unterwegs` · `Freizeit & Kultur` ·
  `Sport & Gesundheit` · `Wohnen & Nachbarschaft` · `Behörden & Formelles` ·
  `Geld & Verträge` · `Wenn etwas schiefgeht`

  A category not in that list still renders, just last. Add new ones to the
  array when a genuinely new shelf appears, rather than stretching an old label.

## Block structure

The curriculum's H/A/B/C/D blocks carry different weight here, because the goal
is a situation rather than a structure:

- **A — Wortschatz & Redemittel.** The nouns, verbs and set phrases of the
  situation. `matching`, `categorize`, `gap-text`, `odd-one-out`.
- **B — Dialoge.** The situation actually running: gapped dialogues
  (`gap-bank`), word-order drills (`order`), du/Sie and register choices
  (`single-choice`), a short reading text — a menu, a letter from the Amt, a
  notice in the Hausflur — with `true-false` comprehension.
- **C — Wenn es schiefgeht.** The same situation going wrong: the card is
  declined, the order is incorrect, the form is missing a document, the deposit
  isn't returned. This is the block that makes a set worth doing — it is where
  a learner who can order a coffee still gets stuck.
- **D — Wiederholung & Selbsttest.** Mixed self-test plus a `free-write` or
  `speaking-prompt` role-play of the whole situation end to end.

Block H (Hören) is skipped: these sets ship no `audio/` directory.

## Workflow for adding a new set

Same discipline as a `THEMEN/` set:

1. Plan the situation for this level: which moves it contains, which register,
   what's in bounds and what belongs to a higher level.
2. Write `exercises.yml` (A → B → C → D).
3. Review every item and answer key by hand for correctness and naturalness —
   these are phrases someone will repeat verbatim to a real person.
4. `npx tsx build/gen-exercises.ts SITUATIONEN/<dir>` to generate the `.md`.
5. `npx tsx build/gen-exercises.ts --all --check` to confirm no drift.
6. Commit and push before moving to the next set.

## Gebaut

- **01 — Im Café** (A1) — Platz, Bestellung, Rechnung, Trinkgeld; falsche
  Bestellung und „nur Bargeld“ als Ernstfall.
- **02 — Im Supermarkt und an der Kasse** (A2) — Abteilungen, Mengen, Pfand,
  Expresskasse; abgelehnte Karte, Preisfehler, Umtausch mit Kassenbon.
- **03 — Beim Finanzamt** (B1) — Bescheid lesen, Behördendeutsch auflösen,
  Einspruch schreiben, Ratenzahlung beantragen.

## Themenspeicher

Kandidaten für die nächsten Sets, nach Kategorie. Das Niveau steht dabei,
wo es offensichtlich ist — sonst beim Schreiben entscheiden.

**Essen & Trinken** — Im Restaurant (A2) · Tisch reservieren und umbuchen ·
Beim Bäcker und beim Metzger (A1) · Lieferdienst: falsche Bestellung ·
Biergarten und Volksfest · Die Rechnung: zusammen oder getrennt?

**Einkaufen** — Im Einkaufszentrum / in den Arcaden · Kleidung umtauschen und
reklamieren · Paket abholen (Packstation, Nachbarn) · Handyvertrag abschließen
und kündigen · Möbelhaus: Lieferung und Aufbau · Auf dem Flohmarkt handeln ·
Online bestellt, falsch geliefert: Widerruf · Ein Buch kaufen · Ein Auto kaufen
(B1) · Eine Wohnung kaufen (B2)

**Unterwegs** — Am Bahnhof: Verspätung, Anschluss verpasst, Fahrgastrechte
(B1) · Am Flughafen: Check-in, Gepäck weg, Flug annulliert · Reifenpanne und
ADAC (A2) · In der Werkstatt: Kostenvoranschlag · Tanken und E-Auto laden ·
Mietwagen abholen und Schaden melden · Falsch geparkt: Knöllchen und
Abschleppdienst · Verkehrskontrolle und Unfall melden · Führerschein machen ·
Hotel: buchen, einchecken, reklamieren · Eine Reise mit Freunden planen

**Freizeit & Kultur** — Im Museum · Im Kino · Am See und im Freibad ·
In der Bibliothek (A2) · Auf einem Konzert · Einem Verein beitreten ·
Wandern und Klettern

**Sport & Gesundheit** — Im Fitnessstudio: Vertrag und vor allem Kündigung
(B1) · Termin beim Arzt (A2) · In der Apotheke (A2) · Notaufnahme und Notruf ·
Beim Zahnarzt · Krankschreibung beim Arbeitgeber

**Wohnen & Nachbarschaft** — Gespräch mit den Nachbarn (A2) ·
Wohnungsbesichtigung und Bewerbung um eine Wohnung (B1) · Mängel melden:
Heizung, Schimmel, Wasserschaden (B1) · Hausordnung: Ruhezeiten, Waschküche,
Mülltrennung · Umzug organisieren · Handwerker bestellen ·
An die Hausverwaltung schreiben: Einbrüche im Keller, gestohlene Fahrräder
(B1) · Nebenkostenabrechnung prüfen und widersprechen (B2)

**Behörden & Formelles** — Bürgeramt: An-, Um- und Abmeldung (A2) ·
Ausländerbehörde: Termin, Unterlagen, Aufenthaltstitel (B1) · Krankenkasse:
anmelden und wechseln · Bank: Konto eröffnen, Karte gesperrt · Rundfunkbeitrag ·
Standesamt · Kita-Platz beantragen · Führungszeugnis · Anerkennung
ausländischer Abschlüsse · Arbeitsagentur und Jobcenter

**Geld & Verträge** — Vertrag kündigen (Handy, Strom, Fitness) ·
Stromanbieter wechseln · Versicherung: Schaden melden · Falsche Mahnung ·
Betrug und Phishing melden

**Wenn etwas schiefgeht** — Karte wird abgelehnt, nur Bargeld ·
Geldautomat behält die Karte · Handy verloren: Anzeige bei der Polizei ·
Internet fällt aus: Anruf beim Anbieter · Fundbüro · Portemonnaie vergessen

**Arbeit & Studium** — Vorstellungsgespräch (B1) · Erster Arbeitstag ·
Um eine Gehaltserhöhung bitten (B2) · Urlaub beantragen · Konflikt mit
Kolleginnen ansprechen (B2) · Kündigung schreiben · Uni: Immatrikulation,
Prüfungsamt, BAföG

**Soziales** — Eine Überraschungsparty planen · Smalltalk beim Grillen ·
Einladen und absagen · Sich höflich beschweren · Sich entschuldigen und ein
Missverständnis klären · Gratulieren und kondolieren · Jemanden kennenlernen ·
Elternabend

Die Kategorien `Arbeit & Studium` und `Soziales` stehen noch nicht in
`CATEGORY_ORDER` — beim ersten Set dort ergänzen.
