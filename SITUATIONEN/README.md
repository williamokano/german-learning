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

## Alltag beats Ernstfall

The first sets leaned too far towards the transactional core of a situation —
signing the contract, filing the appeal, claiming the refund. That is the part
worth knowing, but it is not the part that happens most often. What actually
happens most often is the small talk around it:

> in the gym, asking whether someone is still using a machine, how many sets
> they have left, whether you can work in, or asking for a spot — not signing
> up. In the library, asking which section a book is in, being told it is out
> until Thursday, asking someone to keep it down. At the butcher's, which cut,
> how thick, vacuum-packed or not, and what to do when they are out of it. At
> the café, whether to warm it up, eat in or take away, a bag, and one item of
> the order being wrong.

So: **the ordinary exchange is the main course, not the garnish.** Concretely,
when writing a set:

- Put the everyday back-and-forth in Block B and give it room — several short
  dialogues beat one long one, because that is how these encounters happen.
- Include at least one exchange with an ordinary person (another customer, a
  fellow student, a neighbour), not only with staff behind a counter.
- Block C stays, but "goes wrong" can be small and social: someone takes the
  machine you were using, the person next to you is loud, your order is wrong
  by one item. It does not have to be a legal deadline.
- A place can carry more than one set. `08 Fitnessstudio` is the contract and
  the Kündigung; the everyday training-floor set is its own file. Same for the
  Hausverwaltung: the escalation after a break-in and the ordinary "the
  extractor fan is broken, when can someone come?" are different situations
  and should not be crammed together.

## Beim Schreiben: den Antwort-Leak prüfen

Zwei Fehler rutschen durch alle CI-Gates, weil sie strukturell korrekt sind
und trotzdem die Übung wertlos machen:

- Ein gap-bank-Wort steht **in derselben Zeile** wie seine eigene Lücke
  (`Ich buche Sie auf den Flug um 18:40 {4}.` mit Antwort `UM`).
- Ein gap-text-Hinweis **nennt die Antwort** (`Ich habe eine {4} gegen
  Nüsse. (Allergie)`).

Dafür gibt es `build/check-answer-leaks.ts` — bewusst **nicht** in der CI,
weil das Skript über die älteren A1–C1-Lektionen hunderte harmlose
Funktionswörter meldet. Beim Schreiben eines Sets lohnt es sich aber:

```
npx tsx build/check-answer-leaks.ts SITUATIONEN/33-am-flughafen-b1
```

Jeden Treffer selbst ansehen. Manche sind die Übung selbst: Bei
untrennbaren Verben ist das Partizip gleich dem Infinitiv, `belaufen →
belaufen` ist also genau der Punkt. Ein Konjugationshinweis wie
`(müssen, wir-Form)` ist ebenfalls Absicht und wird vom Skript
übersprungen.

## German quotes in YAML — the one recurring trap

German quotation marks are `„…“`, and the closing one is **not** a straight
`"`. Writing `„so“` inside a double-quoted YAML scalar ends the scalar early
and the file fails to parse:

```yaml
why: "„Stimmt so“ ist die Formel."   # breaks: the " after `so` closes it
```

Two ways out, both fine:

```yaml
why: '„Stimmt so“ ist die Formel.'   # single-quoted scalar
why: "„Stimmt so“ ist die Formel."   # proper closing „…“
```

Inside a block scalar (`text: |`, `stimulus: |`) a straight `"` parses fine,
but use `„…“` there too so the rendered text is consistent across sets.

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
- **04 — Im Restaurant** (A2) — reservieren, Sonderwünsche, Allergien, zahlen;
  falsches Gericht, kaltes Essen, Fehler auf der Rechnung.
- **05 — Panne unterwegs** (A2) — Standort und Schaden am Telefon,
  Werkstatt und Kostenvoranschlag; kein Empfang, Reparatur wird teurer.
- **06 — Beim Arzt** (A2) — Termin, Beschwerden schildern, Rezept und
  Krankschreibung; kein Termin frei, fehlende Überweisung, 116 117 vs. 112.
- **07 — Bei der Ausländerbehörde** (B1) — Unterlagenliste, Verlängerung,
  schriftlich nachfragen; Titel läuft vor dem Termin ab.
- **08 — Fitnessstudio: Vertrag und Kündigung** (B1) — Laufzeit,
  Verlängerung, Frist; Frist verpasst, keine Bestätigung, Umzug.
- **09 — Probleme im Haus** (B1) — Einbruch im Keller schildern, die
  Hausverwaltung mit Frist auffordern, Anzeige und Versicherung.

- **10 — Am Bahnhof** (B1) — Verspätung, verpasster Anschluss,
  Fahrgastrechte und der Antrag auf Entschädigung.
- **11 — Wenn das Geld klemmt** (A2) — Karte abgelehnt, Automat zieht die
  Karte ein, Portemonnaie vergessen, Phishing-SMS.
- **12 — In der Bibliothek** (A2) — Ausweis und Ausleihe, dazu die
  Begegnungen: nach der Abteilung fragen, ein ausgeliehenes Buch
  vormerken, um Ruhe bitten, den Platz freihalten lassen.
- **13 — Trainieren im Studio** (A2) — auf der Trainingsfläche statt am
  Vertrag: „Bist du hier noch dran?“, abwechseln, Hilfestellung, Tipps
  annehmen und abwehren, Gerät abwischen.

- **14 — Beim Metzger** (A2) — Fleischsorten und Schnitte, Menge und
  Verpackung, „haben wir gerade nicht“, Bestellung für das Wochenende.
- **15 — Hausverwaltung und Hausmeister im Alltag** (A2) — der brummende
  Exhaustor, das Ablesen des Wasserzählers, ein Hund im Vertrag, eine
  zweite Person auf dem Mietvertrag.
- **16 — Der Handwerker kommt** (A2) — Termin annehmen, einlassen, zeigen
  wo es ist, Rückfragen beantworten, am Ende unterschreiben; Zähler,
  Rauchmelder, verstopfter Abfluss.
- **17 — Am Tresen** (A2) — Bäckerei und Coffee to go: hier essen oder
  mitnehmen, warm machen, sonst noch etwas, Tüte, zahlen; falscher
  Kaffee, fehlendes Brötchen, ein Teil doch nicht.
- **18 — Nebenan** (A2) — sich vorstellen, ein Paket annehmen, etwas
  ausleihen, wegen Lärm klingeln, ein Fest ankündigen, absagen.
- **19 — Auszug** (B1) — fristgerecht kündigen, Übergabetermin,
  Protokoll lesen, Kaution einfordern.
- **20 — An der Uni** (A2) — ist der Platz frei, welcher Raum, was habe
  ich verpasst, Notizen leihen, Lerngruppe, verpasste Abgabe.
- **21 — Wohnungsbesichtigung** (B1) — Inserat lesen, die richtigen
  Fragen stellen, überzeugen ohne sich anzubiedern, nachfassen.
- **22 — Beim Bürgeramt** (A2) — Termin, Formular, am Schalter
  buchstabieren, Unterlage nachreichen, Meldebescheinigung.
- **23 — Verträge kündigen** (B1) — Frist und Form, Kündigungsbutton,
  Sonderkündigungsrecht, Rückhalteanruf, Bestätigung einfordern.
- **24 — In der Apotheke** (A2) — Rezept einlösen, sich ohne Rezept
  beraten lassen, Dosierung verstehen; nicht lieferbar, Nebenwirkungen,
  Notdienst.
- **25 — Auf dem Wochenmarkt** (A2) — Mengen, Reife, probieren, was man
  mit einem unbekannten Gemüse macht, Tüte und Wechselgeld, der kurze
  Plausch am Stand.
- **26 — Im Museum** (A2) — Ticket und Ermäßigung, Garderobe und
  Audioguide, fotografieren dürfen, den Saal finden, über ein Bild reden.
- **27 — Auf einem Konzert** (B1) — personalisiertes Ticket und
  Zweitmarkt, Einlass und Bändchen, Sicht und Gedränge, Treffpunkt
  ausmachen, hinterher darüber erzählen.
- **28 — Kleidung** (A2) — anprobieren, umtauschen und reklamieren: der
  Unterschied zwischen Kulanz und Mangel, Bon, Gutschein statt Geld.
- **29 — Beim Zahnarzt** (A2) — Schmerzen genau schildern, Notfalltermin,
  Betäubung, Heil- und Kostenplan, Bonusheft und Eigenanteil.
- **30 — Beim Bäcker am Morgen** (A1) — die zehn Sätze, die jeden Morgen
  funktionieren müssen: anstehen, Zahl und Sorte, Preis, vorbestellen.
- **31 — Im Kino** (A2) — sich verabreden, Karten und Plätze, OmU oder
  synchronisiert, um Ruhe bitten, hinterher über den Film reden.
- **32 — Im Hotel** (A2) — einchecken, Frühstück und WLAN, ein Problem im
  Zimmer melden, später auschecken, die Rechnung prüfen.
- **33 — Am Flughafen** (B1) — Übergepäck, Verspätung und verpasster
  Anschluss, Umbuchung und Betreuungsleistungen, verlorener Koffer,
  Ausgleichszahlung.
- **34 — Eine Reise mit Freunden planen** (B1) — Termin festlegen, Budget
  offen ansprechen, Aufgaben verteilen, absagen, sauber abrechnen.
- **35 — Vorstellungsgespräch** (B1) — die sechs Standardfragen, eine
  Lücke im Lebenslauf erklären, Gehalt nennen, selbst fragen, nachfassen.
- **36 — Grillen im Hof** (A2) — worüber deutscher Smalltalk wirklich
  geht, welche Themen man meidet, Interesse zeigen, höflich aussteigen.
- **37 — Einladen, zusagen, absagen** (A2) — die drei Teile einer
  deutschen Absage (Bedauern, Grund, Gegenvorschlag), verschieben,
  sich für Vergessenes entschuldigen.
- **38 — Paket abholen und zurückschicken** (A2) —
  Benachrichtigungskarte, Filiale und Packstation, Vollmacht, Retoure;
  beschädigt oder verschwunden.
- **39 — Bei der Bank** (A2) — Girokonto eröffnen, Legitimation, Karte
  und PIN, Dauerauftrag gegen Lastschrift, Karte sperren, falsche
  Abbuchung.
- **40 — Erster Arbeitstag** (A2) — sich vorstellen, duzen oder siezen,
  Zeiterfassung und Kernzeit, um Hilfe bitten, Fehler melden,
  Feierabend.
- **41 — Notruf und Notaufnahme** (B1) — 112 oder 116 117, den Notruf
  strukturiert absetzen, Triage verstehen, Verschlechterung melden,
  Entlassungsbrief.

## Themenspeicher

Kandidaten für die nächsten Sets, nach Kategorie. Das Niveau steht dabei,
wo es offensichtlich ist — sonst beim Schreiben entscheiden.

**Essen & Trinken** — Tisch reservieren und umbuchen · Lieferdienst:
falsche Bestellung · Biergarten und Volksfest · Die Rechnung: zusammen oder
getrennt? · Im Imbiss und am Dönerstand · Beim Eismann mit Kindern

**Einkaufen** — Im Einkaufszentrum / in den Arcaden · Handyvertrag abschließen · Möbelhaus: Lieferung und Aufbau · Auf dem Flohmarkt handeln ·
Online bestellt, falsch geliefert: Widerruf · Ein Buch kaufen · Ein Auto kaufen
(B1) · Eine Wohnung kaufen (B2)

**Unterwegs** — Größere Reparatur in der Werkstatt · Am Bahnhof: Verspätung, Anschluss verpasst, Fahrgastrechte
(B1) · Tanken und E-Auto laden ·
Mietwagen abholen und Schaden melden · Falsch geparkt: Knöllchen und
Abschleppdienst · Verkehrskontrolle und Unfall melden · Führerschein machen

**Freizeit & Kultur** — Am See und im Freibad · Einem Verein beitreten ·
Wandern und Klettern · Im Zoo mit Kindern · Ein Fußballspiel im Stadion

**Sport & Gesundheit** — Im Fitnessstudio: trainieren, Gerät abgeben, um
Hilfestellung bitten, Tipps geben und abwehren (A2) ·
Krankschreibung beim Arbeitgeber · Physiotherapie: Rezept, Termine,
Übungen · Impftermin und Vorsorge

**Wohnen & Nachbarschaft** — Mängel melden:
Heizung, Schimmel, Wasserschaden (B1) · Hausordnung: Ruhezeiten, Waschküche,
Mülltrennung · Umzug organisieren · Handwerker bestellen ·
Nebenkostenabrechnung prüfen und widersprechen (B2)

**Behörden & Formelles** — Krankenkasse: anmelden und wechseln · Bank: Konto eröffnen, Karte gesperrt · Rundfunkbeitrag ·
Standesamt · Kita-Platz beantragen · Führungszeugnis · Anerkennung
ausländischer Abschlüsse · Arbeitsagentur und Jobcenter

**Geld & Verträge** — Stromanbieter wechseln · Versicherung: Schaden melden · Falsche Mahnung ·
Betrug und Phishing melden

**Wenn etwas schiefgeht** — Karte wird abgelehnt, nur Bargeld ·
Geldautomat behält die Karte · Handy verloren: Anzeige bei der Polizei ·
Internet fällt aus: Anruf beim Anbieter · Fundbüro · Portemonnaie vergessen

**Arbeit & Studium** — In der Schule: Elterngespräch, Entschuldigung,
Klassenfahrt (A2) · Um eine Gehaltserhöhung bitten (B2) · Urlaub beantragen · Konflikt mit
Kolleginnen ansprechen (B2) · Kündigung schreiben · Uni: Immatrikulation,
Prüfungsamt, BAföG

**Soziales** — Eine Überraschungsparty planen · Sich höflich beschweren ·
Sich entschuldigen und ein Missverständnis klären · Gratulieren und
kondolieren · Elternabend · Ein Geschenk aussuchen und überreichen

Alle Kategorien des Themenspeichers stehen inzwischen in
`CATEGORY_ORDER`: `Arbeit & Studium` kam mit Set 20 dazu, `Soziales` mit
Set 36. Eine neue Kategorie dort beim ersten Set ergänzen.
