# German Self-Study Course — A1 → C1

A complete, book-like German course built lesson by lesson, benchmarked against
Menschen / Schritte international neu (Hueber) and Sicher! / Aspekte neu.

## Course files

- **[CURRICULUM.md](CURRICULUM.md)** — the full A1→C1 topic map (start here as a learner)
- **[AUTHORING.md](AUTHORING.md)** — the lesson production spec (for writing/dispatching lessons)
- **[MEMORY.md](MEMORY.md)** — the orchestrator's working memory: in-flight work, recent decisions, subagent quality notes. **Always update this at the end of every session** — include what was done, what's next, and a per-lesson checklist so the next agent can resume without re-reading everything.
- **[GitHub issues](https://github.com/williamokano/german-learning/issues)** — the dispatch board (replaced `tasks/todo.md` on 2026-06-15):
  - **B1 master:** issue #47 (14 sub-issues #50–#63)
  - **B2 master:** issue #48 (14 sub-issues #64–#77)
  - **C1 master:** issue #49 (12 sub-issues #78–#89)
- **[tasks/lessons.md](tasks/lessons.md)** — long-term conventions log (the "rules for ourselves" file)
- **`personas/`** — character bible: name, nationality, voice, family for every recurring character
- **`A1/`, `A2/`, …** — one folder per topic:
  - `lesson.md` — the **Full** v2 prose lesson (dialogues, continuous prose,
    reasoning, examples, tips, traps, Landeskunde, mini-stories). Default
    view on the web. See `docs/lesson-v2-spec.md` and `AUTHORING-V2.md`.
  - `lesson-short.md` — the **Short** analytical reference (current format:
    tables, Merkasten, Redemittel, rule + 1 example). Appears as a toggle
    on the web when present. See `AUTHORING.md`.
  - `exercises.yml` — single source of truth for the H/A/B/C/D exercise
    battery (structured YAML with answers)
  - `exercises.md` — *generated* from `exercises.yml` via
    `npx tsx build/gen-exercises.ts <dir>`. Do not hand-edit.
  - `solutions.md` — *generated* answer key with explanations
  - `audio/` — pre-generated MP3s (Hören exercises)

## Setup

Audio files (Hören exercises in mock exam lessons) are stored with **Git LFS**.
Without LFS installed, cloning gives you pointer text files instead of playable MP3s.

```bash
# Install Git LFS (once per machine)
# macOS:   brew install git-lfs
# Ubuntu:  sudo apt install git-lfs
# Windows: https://git-lfs.com

git lfs install        # register LFS hooks in your git config
git lfs pull           # download audio files after cloning
```

If you cloned before installing LFS, run `git lfs pull` afterwards — no re-clone needed.

## Regenerating audio

Hören audio is pre-generated and committed. If you want to regenerate it (e.g. after
editing dialog text or adding a new lesson), you need an
[ElevenLabs](https://elevenlabs.io) API key — the Starter plan (~$5/month) covers all
current audio. Free accounts cannot use the API for voice generation.

```bash
# 1. Set your key (add to ~/.bashrc to make it permanent)
export ELEVEN_API_KEY=sk_...

# 2. Install Python dependencies
pip install -r scripts/requirements.txt
```

### Regenerate everything

```bash
# All lessons and exercises across the whole course
python3 scripts/generate_audio.py --all
```

### Regenerate one lesson

```bash
# All audio blocks for a single lesson (skips files that already exist)
python3 scripts/generate_audio.py A1/01-erste-kontakte/lesson.md
python3 scripts/generate_audio.py A1/01-erste-kontakte/exercises.md
```

### Regenerate one section of a lesson

Use `--section <slug>` to target a single audio block. The script force-deletes
the existing MP3 and regenerates only that clip — no other files are touched.

| Section slug | What it regenerates |
|---|---|
| `dialog1_a` | Dialog A (informal variant) |
| `dialog1_b` | Dialog B (formal variant) |
| `dialog2` | Second dialog in a lesson |
| `hoertext` | §6 Hörtext listening passage |
| `hoerzu1` … `hoerzu6` | Pronunciation clips (A1/01–04) |

```bash
# Re-record just the formal dialog in A1/01
python3 scripts/generate_audio.py A1/01-erste-kontakte/lesson.md --section dialog1_b

# Re-record just the Hörtext passage
python3 scripts/generate_audio.py A1/01-erste-kontakte/lesson.md --section hoertext
```

### Dry-run (no API calls)

Preview what would be generated without spending ElevenLabs credits:

```bash
python3 scripts/generate_audio.py --dry-run A1/01-erste-kontakte/lesson.md
python3 scripts/generate_audio.py --dry-run --verbose A1/01-erste-kontakte/lesson.md
```

Voice assignments and background-noise settings live in `scripts/audio_config.json`.

## How to study

1. Read `lesson.md` actively (say the dialogues out loud).
   - If you prefer a quick-reference style, click the **Kurzfassung** toggle
     in the page header to switch to the Short view.
   - The choice persists across lessons in `localStorage`. Use
     `?view=short` / `?view=full` URL params to deep-link either view.
2. Do `exercises.md` without peeking at the lesson.
   - For Hören sections: play the MP3 linked above each transcript (`audio/` folder).
3. Check with `solutions.md`; ≥ 80% → next topic, otherwise review and redo.
4. One topic per week is a solid pace.

### Dual-mode lessons (v2)

A1/01 is the **reference implementation** of the v2 dual-mode design. Each
lesson directory may now contain:

- `lesson.md` — the **Full** prose version (~700 lines for A1/01). The
  default view. Has 11 sections including a *Mini-Geschichte* (continuous
  prose story), *Warum?* (reasoning) paragraphs for every grammar point,
  *Häufige Fehler* (L1 interference) boxes, *Lerntipps* (mnemonics),
  *Versuch es selbst* mid-lesson micro-prompts, and *Magazin — Landeskunde*
  (cultural aside).
- `lesson-short.md` — the **Short** analytical reference (~330 lines for
  A1/01). The v1 format unchanged. Tables, Merkasten, Redemittel, rule + 1
  example.

The web page shows a small `Ausführlich ⇄ Kurzfassung` toggle in the header
when both files exist. When only one exists, the page is single-view.

The design rationale and section-by-section spec are in
[`docs/lesson-v2-spec.md`](docs/lesson-v2-spec.md). The "how to write one"
guide is in [`AUTHORING-V2.md`](AUTHORING-V2.md). Migration of the existing
A1/A2 lessons is in progress; new B1+ lessons will be authored in v2 from
day one.

**Current status:** A1 (14/14) + A2 (14/14) complete — **28 lessons total, A2 level done!** B1 is next. See `MEMORY.md` for the resume instructions.
