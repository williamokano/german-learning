# Personas — character bible

Every named character in the German course has a persona file in this
directory. Personas are the **single source of truth** for character info:
name, nationality, age, family, occupation, voice, and any backstory
details that have appeared in the lessons.

## How to use this

**When writing a new lesson:**
- Before adding any new character or fact about a character, **read the
  relevant persona file** (`Anna.md`, `Friedrich_Wegner.md`, …).
- Do **not** invent facts that contradict the persona. If you need a new
  detail, **edit the persona first**, then use it in the lesson.

**When you discover a contradiction** (e.g. Wegner said he was from
Germany in lesson 1, then "welcome to Germany" in lesson 2):
- **Fix the lesson** so it matches the persona.
- If the persona is wrong, fix the persona.

**When adding a new character:**
1. Create `personas/FirstName_LastName.md` (use `_` for spaces).
2. Fill in the schema below.
3. Add the voice entry to `scripts/audio_config.json` under
   `voices` and `voice_descriptions` (use the same display name as the
   speaker label in the lesson blockquote, e.g. `Herr Wegner`).
4. Add the speaker name to `speaker_gender` in the same file.

## Schema (every persona file should have these)

- **Name** — display name in lessons
- **Pronouns** — er/sie, formal/informal
- **Age** — rough range
- **Nationality** — country of origin / passport
- **Currently lives in** — city, country
- **Occupation** — what they do
- **Languages** — native, learning, fluent
- **Family** — spouse, children, parents (if known)
- **Personality** — 1-2 words + brief description
- **Voice** — ElevenLabs voice key from `audio_config.json` (and the
  `voice_descriptions` description)
- **First appears in** — earliest lesson.md that references them
- **Recurring in** — which levels / topics
- **Notes** — any other consistent details (hobbies, quirks, etc.)

## Update log

Keep a short changelog at the bottom of each persona file when facts change.
Format:
```
## Changelog
- 2026-06-13 — created.
- 2026-06-13 — clarified: Wegner is German-named but from Brazil.
```

## Why hash-based names for new characters

If you add a new named character whose name might collide with a real
public figure or feel weird in German, you can also invent a fully
fictional name — but document that it's fictional in the persona
("fictional name, no real-world counterpart").
