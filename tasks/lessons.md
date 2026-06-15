# Lessons learned

## 2026-06-11 — Exercise volume was far too low

**Correction:** First draft of A1/01 had 10 exercises (~60 items). User flagged this as
too low for retention. Benchmark reality: Schritte international neu = 40–50 exercises
(200+ items) per Lektion; Menschen + Arbeitsbuch + Intensivtrainer = 35–45. Our topics
condense ~1.5–2 book Lektionen, so the equivalent volume is even higher.

**Rule:** Every `exercises.md` must follow the four-block architecture at full dosage:

1. **Basistraining** (10–12 exercises) — repetitive single-form drills; same grammar
   point drilled 4–6 times in different formats. Boring on purpose.
2. **Vertiefung** (8–10) — mixed application: dialogue completion, error correction
   ("Finde den Fehler"), guided variation, matching, sentence building.
3. **Prüfungstraining** (5–6) — telc formats: Lückentext, Sprachbausteine 1+2,
   Lesen, Schreiben.
4. **Wiederholung & Selbsttest** (4–5) — ≥20% recycled from earlier lessons
   (from Lektion 2 on) + scored self-test.

Target: **~28–32 exercises / 180–220 items per topic.** Never ship a topic below this.

**Why it matters:** automatization needs ~50+ encounters per form, not 10. Volume and
deliberate repetition are the product, not padding.

## 2026-06-15 — P5 migration: recurring YAML authoring traps

Lessons from migrating A2/10–A2/13 to single-source `exercises.yml`.

### 1. German low-9 close-quote `„…"` collides with YAML double-quotes

Anywhere German text has `„...."` (open low-9, content, close high-9 followed by `"`),
the closing `."` looks like a YAML scalar terminator and breaks parsing. Symptoms:

- `Unexpected scalar at node end at line N, column M` (when in flow map `- { q: "..." }`)
- `Unexpected flow-map-end token in YAML stream: "}"` (when in flow-style item)

**Rule:** Single-quote any `why:`, `q:`, `text:`, `note:`, `label:`, `instructions:`
value that contains a German close-quote. The single quote treats `"` as literal. 

### 2. Flow-style `- { ... }` with single-quoted string ending in `'."` breaks too

Even single-quoted, the trailing `}` on the same line confuses the parser when the
string contains `."` ending. Symptom:
`Unexpected flow-map-end token in YAML stream: "}"` at column 47.

**Rule:** If a flow-style item has German `."` inside its `why:` / `text:`, convert
the item to block style:

```yaml
- q: "…"
  why: '…".'
```
NOT
```yaml
- { q: "…", why: '…".' }
```

### 3. `matching.left` / `matching.right` need objects, not strings

Schema (`web/src/core/content/schema.ts:79-82`):
```ts
left: z.array(z.object({ key: z.string(), text: z.string() }))
```

**Rule:** Always use `{ key: "1", text: "..." }` and `{ key: a, text: "..." }` in
matching exercises, never bare strings.

### 4. `gap-bank` bank items must contain every answer

Zod validates that all `answers.*` values appear in `bank`. If a word is used twice
in the source (e.g. B1 uses "frei" twice in 2018-style Bank mit Wiederholung), add
it to the bank twice.

### 5. Audio file references must exist on disk

Each `audio: foo.mp3` must point to a real file in `lesson-dir/audio/`. Verify with
`ls lesson/audio/` before declaring done.

### 6. D1 long mixed lists: number every gap distinctly

If D1 mixes gap types (single word + "what case?" + "translate"), number gaps
1, 2, 3, 4, 5, … and keep them sequential in both `text` and `answers`. Don't
reuse gap numbers for compound questions like "fill A and B".

### 7. Validation must exit 0

`npx tsx build/gen-exercises.ts A2/XX-name` is the gate. If it writes the files,
commit + push + update `tasks/p5-migration.md` status table.

### 8. Updating `tasks/p5-migration.md` status row fails when prior commits changed the same row

After the lesson is committed, run `git pull --rebase` (rare; usually not needed)
and `grep -A 3` to see current content before re-editing the status table.

## 2026-06-15 — P5 migration completed: A2/10–A2/13

All 4 remaining lessons shipped in one session (8.5 hours of writing). Final state:

| Lesson      | Status | Commit      |
|-------------|--------|-------------|
| A2/10-stadt-land-reisen   | ✅ DONE | 3887c6c |
| A2/11-geben-und-schenken  | ✅ DONE | 7e9c61e |
| A2/12-plaene-und-zukunft  | ✅ DONE | 9829c47 |
| A2/13-menschen-beschreiben| ✅ DONE | bd46d62 |

P5 migration fully complete: every lesson (A1/01–14, A2/01–14) now has a
single-source `exercises.yml` regenerated to `exercises.md` + `solutions.md`.
