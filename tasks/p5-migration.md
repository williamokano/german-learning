# P5 — exercises.yml Migration (sequential, one lesson at a time)

**Goal:** Create `exercises.yml` for every lesson (A1/01–14, A2/01–14). Each yml is the single source of truth; gen-exercises.ts compiles it to `exercises.md` + `solutions.md`. After writing each file, run validation:

```bash
npx tsx build/gen-exercises.ts A1/03-essen-und-trinken 2>&1
```

If it exits 0, commit+push. Then move to the next lesson. **Do not fan out in parallel — sequential only.**

---

## Status as of 2026-06-14

| Lesson | exercises.yml | Validated | Committed |
|--------|--------------|-----------|-----------|
| A1/01 | partial (stub only, `partial: true`) | — | ✅ |
| A1/02 | ✅ DONE | ✅ | ✅ |
| A1/03 | ✅ DONE | ✅ | ✅ |
| A1/04 | ✅ DONE | ✅ | ✅ |
| A1/05 | ✅ DONE | ✅ | ✅ |
| A1/06 | ✅ DONE | ✅ | ✅ |
| A1/07 | ✅ DONE | ✅ | ✅ |
| A1/08 | ✅ DONE | ✅ | ✅ |
| A1/09 | ✅ DONE | ✅ | ✅ |
| A1/10 | ✅ DONE | ✅ | ✅ |
| A1/11 | ✅ DONE | ✅ | ✅ |
| A1/12 | ✅ DONE | ✅ | ✅ |
| A1/14 | ✅ DONE (P3 hand-authored) | ✅ | ✅ |
| A2/01 | ✅ DONE | ✅ | ✅ |
| A2/02 | ✅ DONE | ✅ | ✅ |
| A2/14 | ✅ DONE (P3 hand-authored) | ✅ | ✅ |
| A1/13 | ✅ DONE | ✅ | ✅ |
| A2/03 | ✅ DONE | ✅ | ✅ |
| A2/04 | ✅ DONE | ✅ | ✅ |
| A2/05 | ✅ DONE | ✅ | ✅ |
| A2/06 | ✅ DONE | ✅ | ✅ |
| A2/07 | ✅ DONE | ✅ | ✅ |
| A2/08 | ✅ DONE | ✅ | ✅ |
| A2/09 | ✅ DONE | ✅ | ✅ |
| A2/10–A2/13 | ❌ | — | — |

**Next lesson:** A2/10-stadt-land-reisen

---

## How to write an exercises.yml

### Step 1 — Read source files
```bash
# Read BOTH files before writing
cat A1/XX-lesson-name/exercises.md
cat A1/XX-lesson-name/solutions.md
```

### Step 2 — Write exercises.yml
Follow the type-mapping rules below. Validate after.

### Step 3 — Validate
```bash
npx tsx build/gen-exercises.ts A1/XX-lesson-name 2>&1
```
If it errors, fix the yml and re-run.

### Step 4 — Commit + push
```bash
git add A1/XX-lesson-name/exercises.yml A1/XX-lesson-name/exercises.md A1/XX-lesson-name/solutions.md
git commit -m "P5: A1/03 — exercises.yml + regenerated md"
git push
```

---

## Critical YAML authoring rules

1. **Single-quote `why:`, `q:`, and any field that may contain `"` from German dialogue** (`„Hallo?"` has a `?"` that closes a double-quoted YAML string prematurely). Example:
   ```yaml
   why: 'Anna sagt: „Ich möchte einen Kaffee." — sie bestellt.'
   ```

2. **Never use `table-fill` for single-row conjugation** — the renderer always adds a label column, causing column-count mismatch. Use `gap-text` + `listLayout: true`:
   ```yaml
   type: gap-text
   listLayout: true
   text: "ich {1} · du {2} · er/sie/es {3} · wir {4} · ihr {5} · sie/Sie {6}"
   ```

3. **`free-write` has NO `items:` field** — use `stimulus:` (block scalar) for cues/questions.

4. **`order` exercise answer indices are 0-based positions into `tiles`**. Always manually reconstruct the sentence to verify:
   - `tiles: [heißt, Vater, mein, Georg]` → correct sentence "Mein Vater heißt Georg" → index of each word: mein=2, Vater=1, heißt=0, Georg=3 → `answer: [2, 1, 0, 3]`

5. **C4 always splits into C4a (true-false, Text 1) and C4b (single-choice, Text 2).**

6. **H1 in A1 usually splits into H1a + H1b** (separate exercises, each resetting item numbers). Exception: A1/03 has H1 as a single combined exercise with both dialog audio files.

7. **D4 Selbsttest** always gets `notes:` field. Adapt from solutions.md, e.g.:
   ```yaml
   notes: "16+ / 20 → Lektion 4. Below: redo A1–A5 + A12 tomorrow, then retest."
   ```

8. **`gap-bank` bank items must exactly match answers** — Zod validates that every answer value appears in `bank`. Include distractors (unused words from the word bank in exercises.md).

9. **`audio:` field must end in `.mp3`** — validated by Zod.

10. **Per-item audio** on `single-choice` or `true-false`: use `audio:` inside each item object (not on the exercise). Example:
    ```yaml
    items:
      - q: "Was ist das?"
        audio: hoerzu1.mp3
        options: [...]
        answer: b
    ```

---

## Type mapping reference

| Exercise pattern | `type` | Key fields |
|---|---|---|
| Konjugationstabelle (single row) | `gap-text` | `listLayout: true`, gaps as `ich {1} · du {2}…` |
| Konjugationstabelle (multi-row, e.g. exam grid) | `table-fill` | `columns`, `rows` with `label:` |
| Lückentext free-fill | `gap-text` | `text` with `{n}` placeholders |
| Numbered list fill (ein/eine, kein/keine, etc.) | `gap-text` + `listLayout: true` | text = `1. {1}\n2. {2}…` |
| Word-bank fill | `gap-bank` | `bank:`, `answers:` |
| Multiple-choice (H2, C2, C4b, H4, H1/H2 single-choice) | `single-choice` | `items[].options`, `items[].answer` |
| R/F dialog check | `true-false` | `items[].answer` is boolean |
| Question↔Answer pairs | `matching` | `left[]`, `right[]`, `answers:` record |
| Kategorisieren | `categorize` | `buckets[]`, `tokens[]` with `bucket:` |
| Was passt nicht? | `odd-one-out` | `groups[]`, each with `items[]` and `odd` index |
| Satzbau / word order | `order` | `items[]` with `tiles[]` and `answer[]` (0-based) |
| Schreiben / open response | `free-write` | `prompt:`, `stimulus:` (no `items:`), `selfCheck:`, `model:` |
| Exam Sprechen | `speaking-prompt` | `parts[]`, `criteria[]` |

---

## A1/03 — Essen und Trinken (NEXT LESSON TO WRITE)

Both `exercises.md` and `solutions.md` have been read. Here is the complete structural map:

### exercises.md structure
- **H1** — `true-false`, audio: `dialog1_a.mp3` on exercise (NOT per-item), 4 items; SINGLE exercise (not H1a/H1b) because both dialogs appear under one H1 heading
- **H2** — `single-choice`, 5 items with per-item audio (`hoerzu1.mp3`–`hoerzu4.mp3`); item 5 has no audio
- **H3** — `gap-bank`, audio: `hoertext.mp3`; bank = `[Hunger, Kaffee, Apfelkuchen, sechs, vierzig, schmeckt, Durst, sieben, isst]`; 6 gaps used (Durst, sieben, isst are distractors)
- **H4** — `single-choice` + `transcript:` field (Angebote im Supermarkt); audio: `ansage1.mp3`; 4 items

### Block A
- **A1** — der/die/das: `gap-text listLayout`, 12 gaps
- **A2** — ein/eine: `gap-text listLayout`, 10 gaps
- **A3** — kein/keine: `gap-text listLayout`, 10 gaps
- **A4** — nicht oder kein?: `gap-text listLayout`, 10 gaps
- **A5** — den/einen/keinen: `gap-text listLayout`, 10 gaps
- **A6** — möchten: BOTH conjugation table AND sentences; use `gap-text listLayout`; 10 gaps total
- **A7** — essen/nehmen: `gap-text listLayout`, 10 gaps
- **A8** — mixed verbs: `gap-text listLayout`, 8 gaps
- **A9** — Plural: `gap-text listLayout`, 10 gaps
- **A10** — Preise (write as words): `gap-text listLayout`, 6 gaps
- **A11** — Mengen: `matching`, 8 pairs
- **A12** — Akkusativ gemischt: `gap-text listLayout`, 8 gaps

### Block B
- **B1** — Im Café: `gap-bank`, 8 gaps
- **B2** — Im Supermarkt: `gap-bank`, 8 gaps
- **B3** — Finde den Fehler: `gap-text listLayout`, 10 gaps
- **B4** — Verbinden: `matching`, 8 pairs
- **B5** — Satzbau: `order`, 10 items
- **B6** — Kategorien: `categorize`, 4 buckets (Obst/Gemüse/Getränke/Milchprodukte), 12 tokens
- **B7** — Was passt nicht?: `odd-one-out`, 6 groups
- **B8** — Antworten: `free-write`, 8 cues in `stimulus:`
- **B9a** — Übersetzen: `gap-text listLayout`, 8 gaps
- **B9b** — Im Café: `free-write`

### Block C
- **C1** — Lückentext: `gap-bank`, 10 gaps, bank includes distractors
- **C2** — Sprachbausteine Teil 1: `single-choice`, 6 items
- **C3** — Sprachbausteine Teil 2: `gap-bank`, 10 gaps, UPPERCASE bank
- **C4a** — Text 1 (R/F): `true-false`, 5 items
- **C4b** — Text 2 Speisekarte: `single-choice`, 4 items

### Block D
- **D1** — Schnelltest: `gap-text listLayout`, 15 gaps
- **D2** — Odd one out: `odd-one-out`, 6 groups
- **D3** — Wiederholung: `gap-text listLayout`, 10 gaps
- **D4** — Selbsttest: `gap-text listLayout`, 20 gaps + `notes:` field

### A1/03 Answers (from solutions.md)

**H1:** R, R, R, F  
**H2:** b)Banane, a)Brötchen, c)Bier, b)"to cost", b)Tasse  
**H3:** `{1}=Hunger {2}=Kaffee {3}=Apfelkuchen {4}=sechs {5}=vierzig {6}=schmeckt`  
**H4:** a)Frische Brötchen, b)Zwei Euro, a)Der Käse, c)Bis zwanzig Uhr  

**A1:** der, die, das, der, die, das, die, der, das, die, der, das  
**A2:** eine, ein, ein, eine, ein, ein, eine, ein, eine, ein  
**A3:** kein, keine, keine, kein, kein, keine, keine, kein, keine, kein  
**A4:** kein, nicht, keinen, nicht, keine, kein, nicht, nicht, kein, nicht  
**A5:** einen, den, keinen, einen, einen, den, einen, keinen, den, einen  
**A6 (table+sentences):** möchte, möchtest, möchte, möchten, möchtet, möchten; möchte, Möchtest, möchte, möchtet  
**A7:** esse, isst, esst, isst, essen, nehme, Nimmst, nimmt, Nehmen, nehmt  
**A8:** kostet, kosten, trinke, Trinkst, kaufen, kauft, brauche, Braucht  
**A9:** Äpfel, Eier, Tomaten, Brötchen, Flaschen, Säfte, Gläser, Würste, Kuchen, Kartoffeln  
**A10:** zwei Euro fünfzig, neunundneunzig Cent, dreizehn Euro achtzig, sieben Euro zwanzig, ein Euro fünf, zwanzig Euro neunzig  
**A11 (matching):** 1→d, 2→f, 3→g, 4→b, 5→c, 6→h, 7→a, 8→e  
**A12:** eine, einen, ein, kein, einen, ein, keinen, keine  

**B1:** möchten, möchte, ein, einen, Haben, Glas, zahlen, getrennt  
**B2:** haben, kostet, nehme, etwas, einen, Flasche, macht, Wiedersehen  
**B3:** einen, möchte, isst, kosten, kein, kein, den, Äpfel, nimmt, keinen  
**B4:** 1→c, 2→a, 3→d, 4→b, 5→f, 6→e, 7→h, 8→g  
**B5 (Satzbau tiles — must verify 0-based indices manually):**
- 1. ich/möchte/einen/Kaffee → Ich möchte einen Kaffee.
- 2. was/isst/du/zum/Frühstück → Was isst du zum Frühstück?
- 3. ich/esse/kein/Fleisch → Ich esse kein Fleisch.
- 4. was/kostet/der/Käse → Was kostet der Käse?
- 5. wir/nehmen/ein/Stück/Kuchen → Wir nehmen ein Stück Kuchen.
- 6. haben/Sie/Orangensaft → Haben Sie Orangensaft?
- 7. er/trinkt/morgens/Tee → Er trinkt morgens Tee.
- 8. wir/brauchen/noch/Milch → Wir brauchen noch Milch.
- 9. der/Kuchen/schmeckt/sehr/gut → Der Kuchen schmeckt sehr gut.
- 10. wir/möchten/zahlen/bitte → Wir möchten zahlen, bitte.

**B6 (categorize):** Obst=[Apfel,Banane,Orange] Gemüse=[Tomate,Kartoffel,Salat] Getränke=[Saft,Tee,Wasser] Milchprodukte=[Milch,Joghurt,Käse]  
**B7 (odd-one-out):** Schinken, Brot, Kuchen, Cola, Supermarkt, Ei — verify 0-based index of odd item in each group  
**B8:** free-write stimulus with 8 cues  
**B9a (Übersetzen):** 8 sentence translations  
**B9b (Im Café):** free-write  

**C1:** esse, trinke, kein, gern, ein, essen, mit, kaufe, eine, macht  
**C2:** b)einen, a)Stück, a)schmeckt, b)nur, a)mit, a)zusammen  
**C3:** BRAUCHE, KOSTET, NEHME, HABEN, NICHT, EINE, DEN, IST, MACHT, BITTE  
**C4a:** R, F, F, R, R  
**C4b:** b, b, a (2.80+3.20=6.00), c  
**D1:** möchte, isst, einen, kein, habt, das, "Die Rechnung, bitte!", neunundneunzig Cent, Welche, Gläser, nimmt, siebenundvierzig, "Stimmt so!", kein, ihr  
**D2 (odd-one-out):** Kartoffel, Käse, nicht, ist, Frühstück, wohnen  
**D3:** bin, hast, kommen, Töchter, seine, dreizehn, achtundachtzig, "Das ist nicht meine Cousine.", "Wo wohnen Sie?", ist  
**D4:** die, das, der, einen, eine, ein, isst, nimmst, möchtet, keinen, nicht, die Äpfel, die Eier, drei Euro fünfzig, ein Glas Saft, "Wir möchten zahlen.", "Was isst du gern?", "Zusammen oder getrennt?", "Nein, wir haben keine Äpfel. / Nein, leider nicht.", das Frühstück  
