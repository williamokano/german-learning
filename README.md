# German Self-Study Course — A1 → C1

A complete, book-like German course built lesson by lesson, benchmarked against
Menschen / Schritte international neu (Hueber) and Sicher! / Aspekte neu.

## Course files

- **[CURRICULUM.md](CURRICULUM.md)** — the full A1→C1 topic map (start here as a learner)
- **[AUTHORING.md](AUTHORING.md)** — the lesson production spec (for writing/dispatching lessons)
- **[MEMORY.md](MEMORY.md)** — the orchestrator's working memory: in-flight work, recent decisions, subagent quality notes. **Always update this at the end of every session** — include what was done, what's next, and a per-lesson checklist so the next agent can resume without re-reading everything.
- **[tasks/todo.md](tasks/todo.md)** — dispatch board with one work item per lesson
- **[tasks/lessons.md](tasks/lessons.md)** — long-term conventions log (the "rules for ourselves" file)
- **[personas/](personas/)** — character bible: name, nationality, voice, family for every recurring character
- **`A1/`, `A2/`, …** — one folder per topic:
  - `lesson.md` — the class (dialogues, vocabulary, grammar, phrases)
  - `exercises.md` — mixed telc-style test battery (Lückentext, Sprachbausteine, grammar, verbs, vocab, reading, writing)
  - `solutions.md` — answer key with explanations
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
2. Do `exercises.md` without peeking at the lesson.
   - For Hören sections: play the MP3 linked above each transcript (`audio/` folder).
3. Check with `solutions.md`; ≥ 80% → next topic, otherwise review and redo.
4. One topic per week is a solid pace.

**Current status:** A1 (14/14) + A2/01–A2/13 (13/14) complete (27 lessons total) — A2/14 (Prüfungstraining, solo mock exam) next. See `MEMORY.md` for the resume instructions.
