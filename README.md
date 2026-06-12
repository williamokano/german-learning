# German Self-Study Course — A1 → C1

A complete, book-like German course built lesson by lesson, benchmarked against
Menschen / Schritte international neu (Hueber) and Sicher! / Aspekte neu.

- **[CURRICULUM.md](CURRICULUM.md)** — the full A1→C1 topic map (start here)
- **[AUTHORING.md](AUTHORING.md)** — the lesson production spec (for writing/dispatching lessons)
- **[tasks/todo.md](tasks/todo.md)** — dispatch board with one work item per lesson
- **`A1/`, `A2/`, …** — one folder per topic:
  - `lesson.md` — the class (dialogues, vocabulary, grammar, phrases)
  - `exercises.md` — mixed telc-style test battery (Lückentext, Sprachbausteine, grammar, verbs, vocab, reading, writing)
  - `solutions.md` — answer key with explanations

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

Hören audio is pre-generated and committed. If you want to regenerate it (e.g. with
different voices, or after writing a new mock exam), you need an
[ElevenLabs](https://elevenlabs.io) API key — the Starter plan (~$5/month) covers all
current audio. Free accounts cannot use the API for voice generation.

```bash
# 1. Set your key (add to ~/.bashrc to make it permanent)
export ELEVEN_API_KEY=sk_...

# 2. Install Python dependencies
pip install -r scripts/requirements.txt

# 3. Regenerate audio for one lesson (skips files that already exist)
python scripts/generate_audio.py A1/14-pruefungstraining-a1/exercises.md

# 4. Regenerate all lessons with Hören transcripts
python scripts/generate_audio.py --all

# 5. Force-regenerate (delete the audio/ folder first)
rm -rf A1/14-pruefungstraining-a1/audio/
python scripts/generate_audio.py A1/14-pruefungstraining-a1/exercises.md
```

Voice assignments and background-noise settings live in `scripts/audio_config.json`.
To preview what would be generated without calling the API:

```bash
python scripts/generate_audio.py --dry-run A1/14-pruefungstraining-a1/exercises.md
```

## How to study

1. Read `lesson.md` actively (say the dialogues out loud).
2. Do `exercises.md` without peeking at the lesson.
   - For Hören sections: play the MP3 linked above each transcript (`audio/` folder).
3. Check with `solutions.md`; ≥ 80% → next topic, otherwise review and redo.
4. One topic per week is a solid pace.

**Current status:** A1 complete (14 Lektionen) — A2 next.
