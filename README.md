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

## How to study

1. Read `lesson.md` actively (say the dialogues out loud).
2. Do `exercises.md` without peeking at the lesson.
   - For Hören sections: play the MP3 linked above each transcript (`audio/` folder).
3. Check with `solutions.md`; ≥ 80% → next topic, otherwise review and redo.
4. One topic per week is a solid pace.

**Current status:** A1 complete (14 Lektionen) — A2 next.
