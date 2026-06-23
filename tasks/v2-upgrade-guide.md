# v2 Lesson Upgrade — Orchestrator's Playbook

> **Goal:** Upgrade every lesson from the v1 analytical short format to the v2
> full prose format. After each batch, incorporate agent learnings into the
> "Known traps" section below before dispatching the next batch.
>
> **Primary spec:** `AUTHORING-V2.md` + `docs/lesson-v2-spec.md`  
> **Worked example:** `A1/01-erste-kontakte/` (both files already present)

---

## What v2 adds over v1

v1 (`lesson-short.md`) = tables, Merkasten, Redemittel, rule + 1 example.  
v2 (`lesson.md`) adds:
- **§2 Einstieg** — 2–4 sentence prose intro framing the topic
- **§5 Mini-Geschichte** — 200–280 word continuous prose story (personas, known vocab only)
- **Each grammar §6.N** gets 6 mandatory sub-parts: Warum? · 8–12 examples · Häufige Fehler table · Lerntipp · Versuch es selbst + spoiler · Merkasten
- **§9 Magazin — Landeskunde** — 80–120 word cultural aside
- **§10 Lernstrategie** — 3-day study plan referencing specific lesson sections
- **YAML frontmatter** block at the top of both files

---

## Migration steps (per lesson)

1. `mv lesson.md lesson-short.md`
2. Add YAML frontmatter to `lesson-short.md` (see AUTHORING-V2.md §3 for schema)
3. Write new `lesson.md` per AUTHORING-V2.md spec (11 sections, in order)
4. Verify definition of done (AUTHORING-V2.md §7)
5. Do NOT run generators, do NOT commit — report back for review

---

## Agent dispatch prompt (copy verbatim; fill in LESSON and TITLE)

```
You are writing a v2 Full prose lesson for a German self-study course.

Read these files IN FULL before writing anything:
  /home/william/Workspace/Personal/german-learning/AUTHORING-V2.md
  /home/william/Workspace/Personal/german-learning/docs/lesson-v2-spec.md
  /home/william/Workspace/Personal/german-learning/CURRICULUM.md   (find your lesson's row + all earlier rows for scope)
  /home/william/Workspace/Personal/german-learning/personas/README.md
  /home/william/Workspace/Personal/german-learning/personas/Anna.md
  /home/william/Workspace/Personal/german-learning/personas/Bruno.md
  (+ any other personas that appear in this lesson's dialog)

Your assigned lesson: <LESSON> — <TITLE>
  Folder: /home/william/Workspace/Personal/german-learning/<LESSON>/

Step 1 — Read the existing lesson.md (v1 short format). This is your
  starting point for dialog text, vocab list, and Hörtext. Do NOT copy
  its prose as-is; you are writing a new, richer version.

Step 2 — Rename: in the folder, rename lesson.md → lesson-short.md.
  Add the YAML frontmatter block (per AUTHORING-V2.md §3) to lesson-short.md.
  The frontmatter values must match the CURRICULUM.md row for this lesson.
  Also add a "buildsOn" line listing the 1–3 most important preceding lessons.

Step 3 — Write lesson.md following the v2 spec:
  11 sections in this exact order:
    §1 Dialoge (same dialog as v1, same speakers, same words)
    §2 Einstieg (2–4 sentence prose intro, du-register, English A1–A2)
    §3 Redemittel (phrase tables, same as v1)
    §4 Wortschatz (same vocab tables as v1, each major table preceded by > 💡 Lerntipp)
    §5 Mini-Geschichte (200–280 words, personas, known vocab only, different scene from §7)
    §6 Grammatik (each subsection: Warum? · 8–12 examples · Häufige Fehler · Lerntipp · Versuch es selbst + spoiler · Merkasten)
    §7 Lesetext (200–280 words, different scene from §5, "You'll work with this text in the exercises")
    §8 Hörtext (4–6 sentences, spoiler transcript, "Hör zu und mach Übung H3")
    §9 Magazin — Landeskunde (80–120 words, opinionated, no tables)
    §10 Lernstrategie (3-day plan, tasks reference specific section names)
    §11 Outro (➡️ line pointing to exercises.md)

Hard constraints:
  - §5 Mini-Geschichte must use ONLY vocab + grammar from this lesson and earlier lessons.
    Mark any forward reference as a "(chunk — explained in Lektion N)" footnote.
  - §5 and §7 must be different scenes / characters / situations.
  - Häufige Fehler pairs must be real errors (✅ must be grammatically correct).
  - §9 Magazin topic suggestions are in AUTHORING-V2.md §2.10.
  - §10 Lernstrategie tasks must name specific sections (e.g., "Dialog A §1", "Block B §6.3").
  - Do NOT hand-write exercises.md or solutions.md. Do NOT run any generators.
  - Do NOT commit anything.

When done, report:
  - Word count of new lesson.md
  - Word count of lesson-short.md (frontmatter added)
  - Any scope conflicts (vocab or grammar used that wasn't in scope)
  - Any dialog/Hörtext/Wortschatz drift between the two files
  - Any deviations from the spec and why
  - Anything surprising that future agents should know (goes into Known Traps below)
```

---

## Status

| Lesson | Folder | v2 done? | Notes |
|--------|--------|----------|-------|
| A1/01 | erste-kontakte | ✅ | Worked example; both files already present |
| A1/02 | familie-und-freunde | ✅ | 6,090w lesson.md · 2,452w lesson-short.md |
| A1/03 | essen-und-trinken | ✅ | 5,844w lesson.md · 2,263w lesson-short.md |
| A1/04 | wohnen | ✅ | 5,482w lesson.md · 2,303w lesson-short.md |
| A1/05 | mein-tag | ✅ | 5,811w lesson.md · lesson-short.md ✓ |
| A1/06 | freizeit-und-hobbys | ✅ | 6,305w lesson.md · lesson-short.md ✓ |
| A1/07 | lernen-und-arbeiten | ✅ | 4,372w lesson.md · 2,363w lesson-short.md |
| A1/08 | unterwegs-in-der-stadt | ✅ | 6,910w lesson.md · 2,799w lesson-short.md |
| A1/09 | einkaufen-und-kleidung | ✅ | 5,711w lesson.md · 2,866w lesson-short.md |
| A1/10 | gesundheit-und-koerper | ✅ | 5,878w lesson.md · 3,063w lesson-short.md |
| A1/11 | vergangenheit | ✅ | 6,175w lesson.md · 2,834w lesson-short.md |
| A1/12 | termine-und-feste | ✅ | 5,659w lesson.md · 2,539w lesson-short.md |
| A1/13 | aemter-telefon-alltag | ✅ | 5,587w lesson.md · 2,929w lesson-short.md |
| A1/14 | pruefungstraining-a1 | ✅ | 3,211w lesson.md · 2,090w lesson-short.md |
| A2/01 | erzaehl-mal | ✅ | 4,903w lesson.md · 2,596w lesson-short.md |
| A2/02 | zusammen-wohnen | ✅ | 5,580w lesson.md · 2,921w lesson-short.md |
| A2/03 | begruenden-und-erklaeren | ✅ | 4,413w lesson.md · 2,807w lesson-short.md |
| A2/04 | arbeit-und-beruf | ⬜ | |
| A2/05 | gesund-leben | ⬜ | |
| A2/06 | medien-und-kommunikation | ⬜ | |
| A2/07 | vergleichen | ⬜ | |
| A2/08 | adjektive-ueberall | ⬜ | |
| A2/09 | hoeflichkeit-und-wuensche | ⬜ | |
| A2/10 | stadt-land-reisen | ⬜ | |
| A2/11 | geben-und-schenken | ⬜ | |
| A2/12 | plaene-und-zukunft | ⬜ | |
| A2/13 | menschen-beschreiben | ⬜ | |
| A2/14 | pruefungstraining-a2 | ⬜ | Review lesson — use adapted §6 (see review-lesson section above) |
| B1/01 | frueher-und-heute | ✅ | 3,835w lesson.md · 2,430w lesson-short.md |
| B1/02 | gegensaetze-und-folgen | ✅ | 3,775w lesson.md · 2,884w lesson-short.md |
| B1/03 | wuensche-und-irreales | ✅ | 4,153w lesson.md · 3,474w lesson-short.md |
| B1/04 | das-passiv | ✅ | 4,109w lesson.md · 3,214w lesson-short.md |
| B1/05 | relativsaetze-komplett | ✅ | 4,575w lesson.md · 3,297w lesson-short.md |
| B1/06 | ziele-und-absichten | ✅ | 4,580w lesson.md · 3,572w lesson-short.md |
| B1/07 | der-genitiv | ✅ | 3,950w lesson.md · 2,952w lesson-short.md |
| B1/08 | verben-mit-praepositionen-ii | ✅ | 4,576w lesson.md · 3,478w lesson-short.md |
| B1/09–14 | — | ⬜ | Instruction language: mixed EN/DE. B1/14 is a review lesson (adapted §6) |

---

## Known traps (updated after each batch)

### After A1/02 (familie-und-freunde)

1. **Old 🎧 audio links in lesson-short.md** — the v1 file had hand-written `🎧 [dialog.mp3](audio/...)` lines. Leave them in lesson-short.md; they are harmless since the audio pipeline reads only from `lesson.md`. Do not strip them.
2. **Magazin word count** — the 80–120 word ceiling applies to prose only; the pull-quote blockquote is excluded from the count. A total of ~126 words including the blockquote is fine.
3. **§5 vs §7 scene separation** — use genuinely different characters *and* locations, not just different topics in the same classroom. A1/02 used Bruno showing a phone photo (§5) vs. a new narrator writing about his Spanish family (§7).
4. **Chunk-alert footnote pattern** — forward-scope grammar forced by the dialog (e.g. accusative `einen Bruder`, `kein`) gets a `\* **Chunk alert:** …` footnote at the bottom of the dialog. This was established in v1 and must carry over into v2 dialog text.
5. **Outro has no ## 11. header** — the A1/01 worked example ends with a bare `➡️` line, no `## 11. Outro` heading. Match that.
6. **Pronunciation sub-section numbering** — A1/02 needs 5 grammar topics + pronunciation, so it has §6.1–6.6, not 6.1–6.5 like A1/01. The number of §6.N sub-sections matches the lesson's grammar target count + 1 pronunciation section. The pronunciation sub-section may omit Versuch-es-selbst, Häufige Fehler, and Merkasten (only Warum? and Lerntipp required).

### After A1/03 (essen-und-trinken)

7. **Mini-Geschichte word count** — count only paragraph prose lines. Exclude the Lese-Tipp blockquote line and any footnote lines. Only the narrative paragraphs count toward the 200–280 target.
8. **Frontmatter must match between both files** — lesson-short.md frontmatter must have exactly the same field values as lesson.md (same level, number, slug, title, titleEn, canDo, grammar, buildsOn). They share the same content-collection schema.
9. **`möchten` as a polite chunk** — in A1/03 `möchten` is a teaching target, but it appears in the dialog before it is formally explained in §6. The chunk-alert footnote at the bottom of the dialog block handles this cleanly. Same pattern applies whenever a grammar form is taught in the same lesson but appears before its §6 section.
10. **`werden` (future) in Mini-Geschichte dialogue** — any use of auxiliary `werden` for future meaning is out of scope until A2/12. Replace with present tense + context (e.g. `"Das schmeckt sicher super"`) rather than marking as a chunk — it's cleaner to just avoid it.

### After A1/04 (wohnen)

11. **v1 Hörtext forward-scope grammar** — v1 Hörtexte sometimes contain dative forms, attributive adjective endings, or other forward-scope constructions that were never flagged. Leave the Hörtext unchanged per spec (it's shared audio); do not flag these in the report as "scope conflicts."
12. **Match v1 typographic style** — plural notation, quotation marks, spelling variants (e.g. American "cozy/colors") vary between v1 files. Match whatever style the v1 file used; don't normalize to a single standard across lessons.
13. **Housing / furniture Mini-Geschichte** — naturally wants `sehen`, `nehmen`, `lesen`, `gehen` (all irregular or introduced in Lektion 5–6). Budget 2–3 chunk footnotes; this is unavoidable for this topic.

### After A1/05–06 (mein-tag, freizeit-und-hobbys)

14. **Session rate limit** — agents may hit a usage cap after writing the files. This does not mean the files are incomplete; check word count and section headers before assuming failure. If all 10 sections are present and the outro ➡️ line is there, the lesson is done.

### After A1/07–08 (lernen-und-arbeiten, unterwegs-in-der-stadt)

15. **§9 Magazin word count floor** — the 80-word minimum is tight when writing in English about culturally rich topics. Target 100–115 words of prose to stay in spec with a comfortable margin; it's easier to trim than to pad.
16. **du-imperatives in §5 Mini-Geschichte** — reported speech or directions naturally pull in imperatives (`Nimm die Linie 18. Steig aus.`) before the full imperative system is taught (A1/10). Always footnote these as chunks; they're unavoidable in city/transport contexts.
17. **Minor v1-only characters** — some v1 dialogs have named characters (e.g. "Jonas" in A1/08) with no persona file. Keep them from v1 as-is; don't create new persona files unless the character recurs across multiple lessons.

### After A1/09–10 (einkaufen, gesundheit)

18. **`wenn` scope check** — before flagging `wenn` as forward-scope (A2/03), check whether it already appears in the lesson's own dialog. If the v1 dialog uses `wenn` as a natural chunk, it is in-scope for that lesson's §5 Mini-Geschichte.
19. **Context-deducible Lesetext vocabulary** — words like `heiser` (hoarse), `Arzthelferin` (receptionist) in §7 Lesetext are acceptable even if not in the §4 Wortschatz table, as long as meaning is deducible from context at A1. Don't over-flag these as scope conflicts.
### Review lessons (A1/14, A2/14, B1/14)

The §6 spec adapts for review lessons — do NOT force the standard 6-part format. Use instead:
- §6.1 Grammatik-Übersicht — 8–10 row table: rule label + 1 example + 1 common error per topic
- §6.2 Häufige Fehler — 6–8 curated error pairs from across the full level; PT/ES/EN L1 interference
- §6.3 Schnell-Check — 5–6 Lückentext blanks with spoiler answers; tests §6.1 items

Other review-lesson adaptations:
- v1 lesson may have no dialogs at all — write two from scratch using an exam-registration or summary scenario that naturally recycles the level's grammar
- §5 Mini-Geschichte: full level scope is available (no forward-scope issue); write a richer story
- §7 Lesetext: use authentic exam format for the level (A1: formal institutional letter; A2: formal email or notice board; B1: newspaper extract or formal complaint)
- §9 Magazin: can focus on the certification ecosystem (exam culture, certificate real-world use) rather than Landeskunde — appropriate for a capstone lesson

---

20. **Reflexive verb chunks in health/body topics** — `sich fühlen`, `sich ausruhen` appear naturally in dialogs before reflexives are formally taught (A2/05). Treat as chunks with footnote in the dialog block; do not try to avoid them entirely.
21. **§5 Lese-Check spoiler answers must also respect scope** — the model answer inside the `<details>` spoiler is still prose the learner reads; don't use `weil`-clauses (A2/03) or other forward-scope grammar there. Use two short sentences instead: *"Bruno kauft ein Hemd. Seine Schwester hat Geburtstag."* not *"Bruno kauft ein Hemd, weil seine Schwester Geburtstag hat."*

### After B1/04 (das-passiv)

22. **v1 B1 lessons fold §6 sub-tables into the grammar prose** — the v1 (short) B1 files put conjugation/transformation tables *inside* each grammar topic. In v2, keep those tables but reframe each topic into the 6-part shape (Warum? → tables+examples → Häufige Fehler → Lerntipp → Versuch es selbst → Merkasten). The conjugation tables live naturally under the Warum? paragraph; the v1 Merkasten can be reused almost verbatim as the §6 Merkasten.
23. **Topic-grammar in the Mini-Geschichte is in-scope** — unlike forward-scope chunks, *this lesson's own* target grammar should be used freely and densely in §5 (e.g. B1/04's Bäckerei story uses present/Präteritum/Perfekt + modal passive throughout). Pick a §5 scene with a different *process* from §7 so both feel authentic (here: bakery vs. car factory). Everyday topic nouns the learner can infer from context (*der Teig*, *die Backstube*) are fine with a one-line Wortschatz-Hilfe footnote.
24. **Drift check is about shared *content*, not surrounding tips** — v2 adds 💡 Lerntipp blockquotes before each Wortschatz table and a Selbsttest line; the v1 file has none. That is expected. The word-for-word agreement requirement applies to dialog speaker turns, Wortschatz table rows, the Hörtext transcript, and the frontmatter — not to the new framing prose around them.

---

## Definition of done (per lesson)

From `AUTHORING-V2.md §7` — copy here for quick reference:

- [ ] All 11 sections present in `lesson.md`, in order
- [ ] Each §6 subsection has all 6 sub-parts (§6.5 pronunciation may omit Versuch-es-selbst and Merkasten)
- [ ] §5 Mini-Geschichte is 200–280 words, known vocab only
- [ ] §5 ≠ §7 in scene / characters
- [ ] §9 Magazin is 80–120 words, opinionated tone
- [ ] §10 Lernstrategie is a 3-day plan with section-referencing tasks
- [ ] YAML frontmatter present and valid in both files
- [ ] If lesson-short.md also exists: dialogs, Hörtext, and Wortschatz agree word-for-word
