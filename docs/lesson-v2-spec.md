# Lesson v2 Spec — Full Prose Lesson + Dual-Mode (Short / Full)

> **Status:** Draft 1 — 2026-06-16. Authored alongside the A1/01 worked example.
> **Companion docs:** `AUTHORING.md` (v1, the existing spec for the analytical /
> reference-style lesson) · `AUTHORING-V2.md` (v2, this spec's authoring guide).
>
> This file is the **design rationale and the section-by-section spec**. The
> "how do I write one" instructions live in `AUTHORING-V2.md`.

---

## 1. Why a v2

The current `lesson.md` (per `AUTHORING.md`) is **structured reference
material**: tables, Merkasten cheat-sheets, Redemittel lists, and short grammar
explanations. It is dense, review-friendly, and great for analytical learners —
but it does not *teach*. There is no continuous prose, no "why does this rule
exist?", no 8–12 worked examples per grammar point, no mnemonics, no
L1-interference traps, and no mid-lesson self-checks. A learner working through
it without a teacher feels like they are reading someone's good class notes, not
attending the class.

A textbook lesson (Menschen, Schritte, Studio d, Netzwerk) does several things
the current format skips:

1. **Continuous prose** — a short story / situation that introduces the topic
   *before* any table.
2. **Grammatik entdecken** (inductive grammar) — many examples in context, *then*
   the rule.
3. **Reasoning** — "why does this rule work?" paragraphs that connect German to
   English / Portuguese / Spanish.
4. **Häufige Fehler** (L1 interference) — wrong-form-vs-right-form side-by-side
   boxes. The single most effective pattern for memorising tricky forms.
5. **Lerntipps** — mnemonics, memory hooks, pattern-spotting, collocation
   warnings.
6. **Magazin / Landeskunde** — short cultural asides tied to the topic.
7. **Versuch es selbst** — mid-lesson micro-prompts with spoiler answers, not all
   the writing crammed at the end.

The v2 spec adds all seven, while keeping the existing analytical / reference
format **as the "Short" view**. Both versions ship together; the learner picks.

---

## 2. Dual-mode design

Each lesson directory now holds **two** markdown files:

| File | Purpose | Style | Default view? |
|---|---|---|---|
| `lesson.md` | **Full** v2 prose lesson | Continuous prose, reasoning, examples, tips, traps, mini-stories, Landeskunde | **Yes** |
| `lesson-short.md` | **Short** analytical reference | Tables, Merkasten, Redemittel, rule + 1 example. The "current" format, kept exactly as it is. | Toggle only |

The web build renders **both** on the same page and shows a small toggle
(`Ausführlich ⇄ Kurzfassung`) in the lesson header. The default is **Full**;
clicking the toggle swaps to Short. The choice persists in `localStorage` and
respects a `?view=short` / `?view=full` URL parameter so the user can deep-link
to either view.

### Why two files, not one

- **Clean separation of intent.** A "Full" author writes prose; a "Short"
  author writes tables. Mixing them in one file forces every author to
  re-decide mode for every section, which kills consistency.
- **No content is lost.** If a learner wants both, they can read Full first and
  switch to Short to review. The two views complement each other.
- **Print and PDF work as before.** Each file is a clean, self-contained
  markdown document.
- **The Short file is the existing format.** Nothing already in the repo is
  thrown away. The current 28 lessons are valid `lesson-short.md` files today
  (with a one-line rename + frontmatter tweak — see `AUTHORING-V2.md` §3).

### Why Full is the default

- Beginners and intermediate learners benefit most from the prose version.
- Analytical / review-oriented learners discover the toggle within the first
  paragraph (the button is right next to the title) and switch in one click.
- The Full file is the heavier authoring investment, so it should be the
  primary surface.

---

## 3. `lesson.md` — the Full v2 prose lesson (section spec)

The Full lesson has **eleven sections** in a fixed order. Each is described
below with its purpose, expected length, and the markdown patterns it must
follow. The A1/01 worked example shows each section in action.

### 3.1 Header (frontmatter blockquote)

```
# A1 · Lektion 1 — Erste Kontakte (First Contacts)

> **You will learn to:** …
> **Grammar:** …
> **Builds on:** …
```

Three blockquote lines, identical to v1. The "Builds on" line is **required** in
v2 (v1 made it optional) — it spirals back to earlier material, which is one of
the seven "things real textbooks do" the v1 format skipped.

### 3.2 Section 1 — Dialoge (1–2 model dialogues)

**Same as v1.** One informal + one formal variant for any topic where both
registers apply. No prose intro; the dialog speaks for itself. Trailing
double-spaces on every speaker line, multi-dialog with `### Dialog A:` /
`### Dialog B:` headers, audio markers added by the generator.

### 3.3 Section 2 — Einstieg: Was lernst du heute? (lesson intro)

**New in v2.** A 2–4 sentence prose paragraph that frames what the lesson is
about, *before* the tables. Tone: warm, second person, slightly conversational
("In dieser Lektion lernst du …"). It exists to give the lesson a human voice
and to set up the mini-story in section 3.5.

Example (A1/01):

> Du bist neu in einer Stadt. Du gehst in einen Deutschkurs. Am ersten Tag
> lernst du Leute kennen — du sagst Hallo, du sagst deinen Namen, du fragst
> andere: *Wie heißt du? Woher kommst du? Was sprichst du?* In dieser Lektion
> lernst du genau das: **Erste Kontakte** — wie du dich vorstellst, wie du
> andere fragst, und wie du mit den Zahlen von 0 bis 20 durch den ersten Tag
> kommst.

### 3.4 Section 3 — Redemittel (ready-made phrases)

**Same as v1.** Grouped by function (greetings, farewells, introductions), with
a `du/Sie` column where relevant. No prose.

### 3.5 Section 4 — Wortschatz (vocabulary)

**Same as v1**, with two enhancements:

- Each major vocab table is preceded by a 1–2 sentence **Lerntipp** prose line
  ("Lern die Länder mit ihren Artikeln als Paare: *der Brasilianer, die
  Brasilianerin*.").
- The 🔊 Aussprache sub-section (A1/01–04 only) is unchanged.

### 3.6 Section 5 — Mini-Geschichte (continuous prose reading)

**New in v2.** A 200–280 word continuous prose story that uses the lesson's
new vocab and grammar in a natural situation. Reuses the lesson's personas
(Anna, Bruno, etc.) so it feels like a scene from the same universe as the
dialog. Functions as a *second* reading text — Block C (Lesen) reuses it for
comprehension items.

Constraints:

- Uses **only** vocab and grammar from the current lesson and earlier lessons
  (scope discipline, same as v1 Lesetext).
- Is **different** from the Lesetext in §3.7 (different situation, possibly
  different characters, no dialogue).
- Has a 1–2 sentence **Lese-Tipp** *before* the text (e.g. "Lies den Text
  zuerst laut — laut lesen trainiert dein Mund und dein Ohr gleichzeitig.").
- Followed by a `<details>`-spoiler **Lese-Check** with 3 short self-check
  questions and answers in German, not the English target.

### 3.7 Section 6 — Grammatik (the big change)

**Heavily expanded.** Each grammar subsection has **the same six sub-parts in
the same order**:

1. **Warum?** — 3–6 sentences explaining the *logic* of the rule. Why does
   this rule exist? How does it relate to English / Portuguese / Spanish? What
   is the cognitive hook that makes it stick? Tone: explaining to a friend, not
   lecturing.

2. **Examples** — **8–12 worked examples**, not 2–3. Show the same rule in
   many different contexts. v1 had 2–3 examples per point, which is *too few*
   for a learner to internalise the pattern.

3. **Häufige Fehler** — a callout box (use a `> ⚠️ **Häufige Fehler**`
   blockquote) with 2–4 wrong-form-vs-right-form pairs. Built from real
   L1-interference mistakes Portuguese / Spanish / English speakers make.
   Example:

   > ⚠️ **Häufige Fehler**
   >
   > ❌ *Ich **heiße** Anna, und **wohne** in Berlin.* (wohne should be ich wohne — but here it works as a V2 statement, so really…)
   > ❌ *Ich **bin** Anna. **Komme** ich aus Russland.*
   > ✅ *Ich bin Anna, und **ich wohne** in Berlin.*
   > ✅ *Ich bin Anna. **Ich komme** aus Russland.*

4. **Lerntipp** — a `> 💡 **Lerntipp**` blockquote with a mnemonic, a
   pattern-spotting trick, a memory hook, or a collocation warning. Concrete
   and actionable, not "study hard".

5. **Versuch es selbst** — a mid-lesson micro-prompt: 1–3 sentences asking
   the learner to produce something (write a sentence, fill a gap, think of
   an example). Followed by a `<details>` spoiler with a model answer in
   German. **This is the in-lesson equivalent of the block-B production drills
   and is what makes the page feel like a guided platform, not a handout.**

6. **Merkasten** — the existing v1 cheat-sheet box, now **at the end of each
   subsection** as a recap, not the main delivery. v1 used the Merkasten as
   the *primary* presentation; v2 uses it as the *summary*.

Sections in §3.7 for A1/01: 6.1 Personalpronomen · 6.2 sein · 6.3 Regular
verbs · 6.4 Word order (V2) · 6.5 Pronunciation survival kit.

### 3.8 Section 7 — Lesetext (the textbook reading)

**Slightly expanded from v1.** 200–280 words, uses only known material,
**different** from the Mini-Geschichte in §3.5. Reused in Block C (Lesen)
C4a. The "You'll work with this text in the exercises" hint is preserved.

### 3.9 Section 8 — Hörtext (the listening passage)

**Same as v1.** 4–6 sentences, different scene from Lesetext, `<details>`
spoiler for the transcript. The "Hör zu und mach Übung H3" hint is preserved.

### 3.10 Section 9 — Magazin — Landeskunde (cultural aside)

**New in v2.** 80–120 words. A short cultural / real-world aside tied to the
lesson topic. Tone: curious, slightly opinionated, not lecturing. Topics:

- A1/01 — *Sie und du: Wie Deutsche das „Sie" benutzen* (formal vs. informal
  address — "Duzen" und "Siezen").
- A1/03 — *Kaffee und Kuchen: Das deutsche Nachmittagsritual*.
- B1/01 — *Wandel in deutschen Dörfern: Demographischer Niedergang auf dem
  Land*.

Format: an `## 9. Magazin — Landeskunde` header, then the prose. No tables.
May contain a single inline pull-quote in German.

### 3.11 Section 10 — Lernstrategie (study plan)

**Expanded from v1.** v1 had one study tip; v2 has a **3-day study plan** with
specific, time-boxed tasks tied to the lesson. Each day is a `### Tag N — …
subsection.

For A1/01:

- **Tag 1 (30 min):** Dialog A laut lesen (3×). Wortschatz Zahlen mit Audio.
  Schreib deine eigene Vorstellung (5 Sätze). Block A üben.
- **Tag 2 (30 min):** Dialog B laut lesen. Redemittel durchgehen.
  Mini-Geschichte (§5) lesen + Lese-Check. Block B üben.
- **Tag 3 (30 min):** Hörtext anhören + Transkript prüfen. Landeskunde (§9)
  lesen. Block C üben. Am nächsten Tag Block D als Selbsttest.

### 3.12 Section 11 — Outro (pointer to exercises)

**Same as v1.** Single `➡️` line pointing to `exercises.md`.

---

## 4. `lesson-short.md` — the Short analytical reference (section spec)

The Short file is **the v1 format, unchanged in content but lifted to its own
file**. Its purpose is to give analytical / review-oriented learners a clean
quick-reference they can flip to *after* reading the Full version, or *instead
of* it.

Same section list as v1 (1. Dialoge · 2. Redemittel · 3. Wortschatz ·
4. Grammatik · 5. Lesetext · 6. Hörtext · 7. Lernstrategie), no prose beyond
what v1 already had. No Warum? boxes, no Häufige Fehler, no Lerntipps, no
Mini-Geschichte, no Magazin, no Versuch es selbst.

A v2 author writes the Short version *last*, as a re-derivation: keep the
tables, drop the prose.

---

## 5. The web toggle — UX

The web build renders both files on the same page. A small pill-style toggle
sits in the lesson header, right of the breadcrumb:

```
Startseite › A1 › Erste Kontakte            [ Ausführlich | Kurzfassung ]
```

- Default = **Ausführlich** (Full).
- Click `Kurzfassung` → page swaps to the Short view, choice persisted in
  `localStorage.germanLessonView`.
- A `?view=short` URL parameter overrides `localStorage` (used for deep
  links).
- The toggle only appears when both files exist for the lesson. If only
  `lesson.md` exists, the lesson is "Full only" and no toggle shows.
- The toggle is a small client-side script in `LessonLayout.astro`. No server
  logic. The default SSR renders Full; the script re-renders on toggle by
  showing / hiding two `<section data-view="…">` blocks.

The full layout is described in `AUTHORING-V2.md` §6.

---

## 6. Worked example

The A1/01 worked example is in `A1/01-erste-kontakte/`:

- `lesson.md` — the v2 Full prose lesson (~ 700 lines).
- `lesson-short.md` — the v1 format content, lifted (~ 330 lines).

Read both side by side to internalise the spec. The diff between the two
files is exactly the "Full adds these things" answer to the question this
document answers.

---

## 7. Migration plan (not yet executed)

Once the spec is signed off, the migration is:

1. **B1+ lessons (in flight, 28 lessons remaining)** — write both files from
   day one.
2. **Existing A1/A2 lessons (28 lessons)** — rename `lesson.md` to
   `lesson-short.md` (add the frontmatter `level/number/slug` fields). Then
   write a new `lesson.md` for each. This is a one-shot bulk write
   (recommended: 1 lesson per agent, 4 agents in parallel, 1 day).
3. **AUTHORING.md** stays as the **Short** authoring guide. It is renamed /
   retitled to make this explicit (see `AUTHORING-V2.md`).
4. **AUTHORING-V2.md** is the **Full** authoring guide.

The two specs coexist. Authors are free to write both, or only the Short (no
toggle shows), or only the Full (toggle shows but Short is the same as Full
until a Short file is added).

---

## 8. Open questions (defer)

- **Search / table of contents**: when both views exist, the lesson index page
  should not show two entries per lesson. Confirm: index lists one lesson, the
  page itself offers the toggle.
- **Audio re-generation**: the audio pipeline reads `lesson.md` and ignores
  `lesson-short.md`. The dialogs and Hörtext must not drift between the two
  files. The `review-exercises` skill adds a check for this.
- **Print / PDF**: which view do we print by default? Proposal: Full. The
  short is only useful on-screen as a toggle.
- **Localised L1**: the Häufige Fehler boxes are currently PT / ES / EN biased.
  For a C1 book we'd want ZH / AR / TR variants too. Out of scope for v2.
