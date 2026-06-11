# German Learning Course — Dispatch board

Goal: complete self-study German course (A1 → C1), 68 topics. Each topic =
`<LEVEL>/<NN-slug>/{lesson.md, exercises.md, solutions.md}`.

**How to produce a lesson (human session or sub-agent):** read `AUTHORING.md`
and follow it exactly — it is the complete self-contained brief (structure,
four-block exercise architecture, volume targets, scope rules, definition of
done). Per-topic content comes from the topic's row in `CURRICULUM.md`.

**Fan-out protocol (orchestrator):**
1. Pick unchecked items below; dispatch one agent per item using the prompt
   template at the bottom of `AUTHORING.md`.
2. Parallel batches are safe within a level (scope discipline comes from the
   curriculum rows, not from reading neighbor lessons). Keep batches ≤4–5 and
   prefer batching within the same level.
3. After the batch: consistency pass (no cross-batch scope leaks, recurring
   characters consistent, numbering/solutions match), tick checkboxes, update
   status lines in `CURRICULUM.md` + `README.md`, commit, push.
4. Exam-training topics (`14-pruefungstraining-*`, `12-pruefungstraining-c1`)
   are special: full mock exam instead of four blocks — do these solo, not in
   a parallel batch, after the rest of the level is done.

**Conventions log:** see `tasks/lessons.md` (volume rule of 2026-06-11 etc.).
Reference lessons (gold standard): `A1/01-erste-kontakte/`, `A1/03-essen-und-trinken/`.

---

## A1 (14 topics)

- [x] `A1/01-erste-kontakte` — Erste Kontakte
- [x] `A1/02-familie-und-freunde` — Familie und Freunde
- [x] `A1/03-essen-und-trinken` — Essen und Trinken
- [x] `A1/04-wohnen` — Wohnen
- [ ] `A1/05-mein-tag` — Mein Tag
- [ ] `A1/06-freizeit-und-hobbys` — Freizeit und Hobbys
- [ ] `A1/07-lernen-und-arbeiten` — Lernen und Arbeiten
- [ ] `A1/08-unterwegs-in-der-stadt` — Unterwegs in der Stadt
- [ ] `A1/09-einkaufen-und-kleidung` — Einkaufen und Kleidung
- [ ] `A1/10-gesundheit-und-koerper` — Gesundheit und Körper
- [ ] `A1/11-vergangenheit` — Über die Vergangenheit sprechen
- [ ] `A1/12-termine-und-feste` — Termine und Feste
- [ ] `A1/13-aemter-telefon-alltag` — Ämter, Telefon und Alltag
- [ ] `A1/14-pruefungstraining-a1` — Wiederholung & Prüfungstraining A1 ⚠️ mock exam, do solo & last

## A2 (14 topics)

- [ ] `A2/01-erzaehl-mal` — Erzähl mal! (telling stories)
- [ ] `A2/02-zusammen-wohnen` — Zusammen wohnen
- [ ] `A2/03-begruenden-und-erklaeren` — Begründen und erklären
- [ ] `A2/04-arbeit-und-beruf` — Arbeit und Beruf
- [ ] `A2/05-gesund-leben` — Gesund leben
- [ ] `A2/06-medien-und-kommunikation` — Medien und Kommunikation
- [ ] `A2/07-vergleichen` — Vergleichen
- [ ] `A2/08-adjektive-ueberall` — Adjektive überall
- [ ] `A2/09-hoeflichkeit-und-wuensche` — Höflichkeit & Wünsche
- [ ] `A2/10-stadt-land-reisen` — Stadt, Land, Reisen
- [ ] `A2/11-geben-und-schenken` — Geben und schenken
- [ ] `A2/12-plaene-und-zukunft` — Pläne und Zukunft
- [ ] `A2/13-menschen-beschreiben` — Menschen beschreiben
- [ ] `A2/14-pruefungstraining-a2` — Wiederholung & Prüfungstraining A2 ⚠️ mock exam, do solo & last

## B1 (14 topics)

- [ ] `B1/01-frueher-und-heute` — Früher und heute
- [ ] `B1/02-gegensaetze-und-folgen` — Gegensätze und Folgen
- [ ] `B1/03-wuensche-und-irreales` — Wünsche und Irreales
- [ ] `B1/04-das-passiv` — Das Passiv
- [ ] `B1/05-relativsaetze-komplett` — Relativsätze komplett
- [ ] `B1/06-ziele-und-absichten` — Ziele und Absichten
- [ ] `B1/07-der-genitiv` — Der Genitiv
- [ ] `B1/08-verben-mit-praepositionen` — Verben mit Präpositionen II
- [ ] `B1/09-indirekte-fragen` — Indirekte Fragen & Höflichkeit
- [ ] `B1/10-zweiteilige-konnektoren` — Zweiteilige Konnektoren
- [ ] `B1/11-arbeitswelt-und-bewerbung` — Arbeitswelt & Bewerbung
- [ ] `B1/12-umwelt-und-gesellschaft` — Umwelt und Gesellschaft
- [ ] `B1/13-schreiben-und-sprechen` — Schreiben und Sprechen B1
- [ ] `B1/14-pruefungstraining-b1` — Prüfungstraining B1 ⚠️ mock exam, do solo & last

## B2 (14 topics — instructions in German from here on)

- [ ] `B2/01-nominalstil-und-verbalstil` — Nominalstil und Verbalstil
- [ ] `B2/02-passiv-und-alternativen` — Passiv und seine Alternativen
- [ ] `B2/03-konjunktiv-ii-vergangenheit` — Vergangenheit der Möglichkeit
- [ ] `B2/04-indirekte-rede` — Indirekte Rede (Konjunktiv I)
- [ ] `B2/05-partizipien-als-attribute` — Partizipien als Attribute
- [ ] `B2/06-modalverben-subjektiv` — Modalverben: subjektive Bedeutung
- [ ] `B2/07-konnektoren-fuer-profis` — Konnektoren für Profis
- [ ] `B2/08-funktionsverbgefuege` — Funktionsverbgefüge & feste Verbindungen
- [ ] `B2/09-wortbildung` — Wortbildung
- [ ] `B2/10-wissenschaft-und-technik` — Wissenschaft und Technik
- [ ] `B2/11-wirtschaft-und-arbeitswelt` — Wirtschaft und Arbeitswelt
- [ ] `B2/12-argumentieren-und-eroertern` — Argumentieren und Erörtern
- [ ] `B2/13-grafiken-und-berichte` — Grafiken und Berichte
- [ ] `B2/14-pruefungstraining-b2` — Prüfungstraining B2 ⚠️ mock exam, do solo & last

## C1 (12 topics)

- [ ] `C1/01-stil-und-register` — Stil und Register
- [ ] `C1/02-komplexe-syntax` — Komplexe Syntax
- [ ] `C1/03-modalpartikeln` — Modalpartikeln und Nuancen
- [ ] `C1/04-idiomatik-und-kollokationen` — Idiomatik und Kollokationen
- [ ] `C1/05-wissenschaftssprache` — Wissenschaftssprache
- [ ] `C1/06-feinheiten-der-grammatik` — Feinheiten der Grammatik
- [ ] `C1/07-synonymik` — Synonymik und Bedeutungsnuancen
- [ ] `C1/08-textproduktion` — Textproduktion C1
- [ ] `C1/09-vortrag-und-diskussion` — Vortrag und Diskussion
- [ ] `C1/10-literatur-und-medien` — Literatur und Medien
- [ ] `C1/11-gesellschaft-politik-zukunft` — Gesellschaft, Politik, Zukunft
- [ ] `C1/12-pruefungstraining-c1` — Prüfungstraining C1 ⚠️ mock exam, do solo & last

---

## Review log

- 2026-06-11 · Phase 0 done: curriculum, template validated by user, A1/01–03
  shipped. Volume rule tripled after user feedback (see `tasks/lessons.md`).
- 2026-06-11 · Restructured for fan-out: `AUTHORING.md` created as the
  self-contained per-lesson brief; this file became the dispatch board.
