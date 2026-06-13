#!/usr/bin/env python3
"""
generate_audio.py — generate Hören audio for german-learning exercises.

Usage:
    export ELEVEN_API_KEY=your_key_here
    python scripts/generate_audio.py A1/14-pruefungstraining-a1/exercises.md
    python scripts/generate_audio.py --all          # all exercises.md with transcripts
    python scripts/generate_audio.py --list-voices  # print available ElevenLabs voices

Each Gespräch / Ansage / Transcript block gets one MP3 saved to
<lesson>/audio/<slug>.mp3. The exercises.md is updated in-place to add
a 🎧 audio reference line above each transcript block.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from elevenlabs import ElevenLabs
from pydub import AudioSegment

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).parent
REPO_ROOT = SCRIPT_DIR.parent
CONFIG_PATH = SCRIPT_DIR / "audio_config.json"

with open(CONFIG_PATH) as f:
    CFG = json.load(f)

ELEVEN_API_KEY = os.environ.get("ELEVEN_API_KEY", "")

# Matches spelling dictation turns like "S-T-E-I-N-M-E-Y-E-R." or "B-E-R-L-I-N"
SPELL_RE = re.compile(r'^[A-Z](-[A-Z])+\.?$')


# ---------------------------------------------------------------------------
# ElevenLabs helpers
# ---------------------------------------------------------------------------

def get_client() -> ElevenLabs:
    if not ELEVEN_API_KEY:
        sys.exit("Error: ELEVEN_API_KEY environment variable is not set.")
    return ElevenLabs(api_key=ELEVEN_API_KEY)


def list_voices():
    client = get_client()
    voices = client.voices.get_all()
    for v in voices.voices:
        print(f"{v.voice_id}  {v.name}")


def speed_for_path(path: Path) -> float:
    """Return the configured TTS speed for the level inferred from the file path.

    Walks the path parts looking for a known level prefix (A1, A2, B1, …).
    Falls back to default_speed if no match.
    """
    level_speeds = CFG.get("level_speeds", {})
    for part in path.parts:
        level = part[:2].upper()
        if level in level_speeds:
            return level_speeds[level]
    return CFG.get("default_speed", 1.0)


def strip_markdown(text: str) -> str:
    """Remove inline markdown formatting before sending text to TTS.

    Bold (**word** or __word__), italic (*word* or _word_), and stray
    asterisks used as footnote markers all cause ElevenLabs artifacts.
    """
    # Remove paired bold/italic markers
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'__(.+?)__', r'\1', text)
    text = re.sub(r'\*(.+?)\*', r'\1', text)
    text = re.sub(r'_(.+?)_', r'\1', text)
    # Strip any remaining unpaired asterisks (footnote markers, dangling **)
    text = re.sub(r'\*+', '', text)
    return text.strip()


def tts(client: ElevenLabs, text: str, voice_key: str, speed: float = 1.0) -> bytes:
    """Generate TTS audio bytes for one text fragment.

    The `language` field is passed to the multilingual v2 model so it
    pronounces the text with native phonology (e.g. "de" for German) even
    when the chosen voice is an English-timbred default. Per-voice override
    is supported via the `language` key in audio_config.json.
    """
    vcfg = CFG["voices"][voice_key]
    language = vcfg.get("language", CFG.get("default_language"))
    audio = client.text_to_speech.convert(
        voice_id=vcfg["voice_id"],
        text=strip_markdown(text),
        model_id=CFG["model"],
        language_code=language,
        voice_settings={
            "stability": vcfg["stability"],
            "similarity_boost": vcfg["similarity_boost"],
            "speed": speed,
        },
    )
    return b"".join(audio)


# ---------------------------------------------------------------------------
# Voice assignment
# ---------------------------------------------------------------------------

_voice_cache: dict[str, str] = {}  # speaker name → voice key
_female_pool = ["female_1", "female_2", "female_3"]
_male_pool = ["male_1", "male_2", "male_3"]
_female_idx = 0
_male_idx = 0


def reset_voice_cache():
    global _voice_cache, _female_idx, _male_idx
    _voice_cache = {}
    _female_idx = 0
    _male_idx = 0


def voice_for_speaker(name: str) -> str:
    """Return a stable voice key for a speaker name."""
    global _female_idx, _male_idx
    if name in _voice_cache:
        return _voice_cache[name]
    # Named characters with fixed voices
    if name in CFG["voices"]:
        _voice_cache[name] = name
        return name
    gender = CFG["speaker_gender"].get(name, "male")
    if gender == "female":
        key = _female_pool[_female_idx % len(_female_pool)]
        _female_idx += 1
    else:
        key = _male_pool[_male_idx % len(_male_pool)]
        _male_idx += 1
    _voice_cache[name] = key
    return key


# ---------------------------------------------------------------------------
# Transcript parsing
# ---------------------------------------------------------------------------

# Matches lines like: > **Thomas:** Hallo, Selin!
DIALOG_LINE = re.compile(r"^>\s+\*\*(.+?):\*\*\s*(.+)$")
# Matches a plain blockquote line (no speaker label)
MONO_LINE = re.compile(r"^>\s+(.+)$")

# Matches a transcript header like:
#   **Gespräch 1 — Transcript**  or  **Transcript:**
TRANSCRIPT_HEADER = re.compile(
    r"\*\*(?:Gespräch\s*\d+\s*—\s*|Ansage\s*\d+\s*—\s*)?Transcript\*?\*?:?\*?\*?",
    re.IGNORECASE,
)

# Audio reference we insert (so we can detect it on re-runs)
AUDIO_REF_RE = re.compile(r"^🎧 \*\*Audio:\*\*")


def parse_transcripts(text: str) -> list[dict]:
    """
    Return a list of transcript blocks from an exercises.md string.
    Each item: { 'header_line': int, 'slug': str, 'context': str,
                 'mode': 'dialog'|'mono', 'lines': [{'speaker':str,'text':str}] }
    """
    results = []
    lines = text.splitlines()
    i = 0
    dialog_counter: dict[str, int] = {}

    while i < len(lines):
        line = lines[i]
        if TRANSCRIPT_HEADER.search(line):
            # Determine slug from surrounding context
            slug = _slug_from_context(lines, i)
            if slug in dialog_counter:
                dialog_counter[slug] += 1
                slug = f"{slug}_{dialog_counter[slug]}"
            else:
                dialog_counter[slug] = 1

            turns, mode = _collect_turns(lines, i + 1)
            context = _detect_context_from_turns(turns) if turns else "home"
            if turns:
                results.append({
                    "header_line": i,
                    "slug": slug,
                    "context": context,
                    "mode": mode,
                    "lines": turns,
                })
        i += 1

    return results


def _slug_from_context(lines: list[str], idx: int) -> str:
    """Walk backwards to find the nearest ## Aufgabe header; sub-tag from current line."""
    # First check the current line and nearby lines for Gespräch/Ansage N
    sub_tag = None
    for check in range(max(0, idx - 2), idx + 1):
        sub = re.search(r"(Gespräch|Ansage)\s*(\d+)", lines[check])
        if sub:
            tag = "gespraech" if sub.group(1).startswith("G") else "ansage"
            sub_tag = f"{tag}{sub.group(2)}"
            break

    # Walk back up to 120 lines to find ## Aufgabe N
    limit = max(-1, idx - 120) - 1
    for j in range(idx, limit, -1):
        m = re.search(r"##\s+Aufgabe\s+(\d+)", lines[j])
        if m:
            prefix = f"aufgabe{m.group(1)}"
            return f"{prefix}_{sub_tag}" if sub_tag else prefix
    return f"transcript_{sub_tag}" if sub_tag else "transcript"


def _detect_context_from_turns(turns: list[dict]) -> str:
    """Infer background context from the actual spoken text (avoids MCQ answer lines)."""
    spoken = " ".join(t["text"] for t in turns)
    priority = ["phone", "pa_system", "train", "supermarket", "cafe",
                "museum", "office", "street", "store", "home"]
    kw_map = CFG["context_keywords"]
    for ctx in priority:
        for kw in kw_map.get(ctx, []):
            if kw in spoken:
                return ctx
    return "home"


def _collect_turns(lines: list[str], start: int, end: int | None = None) -> tuple[list[dict], str]:
    """Collect blockquote lines after a Transcript header (or a dialog header).

    A dialog block is contiguous blockquote lines. Stage directions, intro
    notes, and similar non-blockquote, non-blank lines BEFORE the first
    speaker line are skipped.

    After the first speaker line, a non-blockquote, non-blank line ends the
    block — UNLESS the next non-blank line is another blockquote (i.e. the
    current line is a one-line stage direction like "And the formal
    version…" that introduces a continuation of the same dialog).

    Wrapped speaker lines (a blockquote with no speaker label that
    immediately follows a DIALOG turn) are appended to the previous turn so
    they keep the same voice.
    """
    turns = []
    mode = "mono"
    i = start
    while i < len(lines):
        if end is not None and i >= end:
            break
        line = lines[i]
        if line.strip() == "":
            i += 1
            continue
        m = DIALOG_LINE.match(line)
        if m:
            mode = "dialog"
            turns.append({"speaker": m.group(1).strip(), "text": m.group(2).strip()})
            i += 1
            continue
        m2 = MONO_LINE.match(line)
        if m2:
            text = m2.group(1).strip()
            if turns and turns[-1]["speaker"] != "_mono":
                # Wrapped continuation of the previous speaker turn.
                turns[-1]["text"] = (turns[-1]["text"] + " " + text).strip()
            else:
                turns.append({"speaker": "_mono", "text": text})
            i += 1
            continue
        if not turns:
            # Skip stage direction / intro before the first speaker line.
            i += 1
            continue
        # Non-blockquote, non-blank line AFTER content started. Look ahead
        # across blank lines: if the next non-blank line is a blockquote,
        # treat this line as a one-line stage direction (e.g. "And the
        # formal version…") and keep going. Otherwise, this is a real
        # paragraph break and the block ends here.
        j = i + 1
        while j < len(lines) and (end is None or j < end) and lines[j].strip() == "":
            j += 1
        if (j < len(lines)) and (end is None or j < end) and lines[j].startswith(">"):
            i += 1
            continue
        break
    return turns, mode


# ---------------------------------------------------------------------------
# Audio generation
# ---------------------------------------------------------------------------

SILENCE_400 = AudioSegment.silent(duration=CFG["pause_ms"]["between_turns"])
SILENCE_200 = AudioSegment.silent(duration=CFG["pause_ms"]["between_sentences"])


def _write_tmp(data: bytes, suffix: str) -> str:
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        f.write(data)
        return f.name


def _pause_for_mode(mode: str) -> int:
    """Return the inter-turn pause (ms) for a given block mode."""
    p = CFG["pause_ms"]
    return p.get(mode, p["between_turns"])


def _generate_spelling_clip(client: ElevenLabs, text: str, voice_key: str, speed: float) -> str:
    """Generate a letter-by-letter spelling clip with deliberate inter-letter pauses.

    Each letter is synthesised individually at a reduced speed so ElevenLabs
    can't rush through the sequence, then the letters are stitched together with
    500 ms silences using ffmpeg.
    """
    letters = re.findall(r'[A-Z]', text)
    letter_speed = max(speed * 0.65, 0.7)  # ElevenLabs minimum speed is 0.7
    letter_parts: list[str] = []
    for letter in letters:
        audio_bytes = tts(client, letter, voice_key, speed=letter_speed)
        letter_parts.append(_write_tmp(audio_bytes, ".mp3"))

    # Stitch letters with 500 ms silence between each
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as lst:
        lst_path = lst.name
        for i, part in enumerate(letter_parts):
            lst.write(f"file '{part}'\n")
            if i < len(letter_parts) - 1:
                lst.write(f"file '{_generate_silence(500)}'\n")

    out = tempfile.mktemp(suffix=".mp3")
    subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", lst_path, "-c", "copy", out],
        check=True, capture_output=True,
    )
    for p in letter_parts:
        Path(p).unlink(missing_ok=True)
    Path(lst_path).unlink(missing_ok=True)
    return out


def generate_clip(client: ElevenLabs, block: dict, out_path: Path, speed: float = 1.0):
    """Generate one MP3 — cleaner version avoiding pydub temp-file issues."""
    reset_voice_cache()
    tmp_parts: list[str] = []

    for turn in block["lines"]:
        speaker = turn["speaker"]
        voice_key = "announcer" if speaker == "_mono" else voice_for_speaker(speaker)
        text = turn["text"]
        if SPELL_RE.match(text.strip()):
            tmp = _generate_spelling_clip(client, text, voice_key, speed)
        else:
            audio_bytes = tts(client, text, voice_key, speed=speed)
            tmp = _write_tmp(audio_bytes, ".mp3")
        tmp_parts.append(tmp)

    if not tmp_parts:
        return

    # Concatenate parts with ffmpeg concat demuxer, inserting silence between turns.
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as lst:
        lst_path = lst.name
        silence_ms = _pause_for_mode(block.get("mode", "dialog"))
        for i, part in enumerate(tmp_parts):
            lst.write(f"file '{part}'\n")
            if i < len(tmp_parts) - 1:
                sil_path = _generate_silence(silence_ms)
                lst.write(f"file '{sil_path}'\n")

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_speech:
        tmp_speech_path = tmp_speech.name

    cmd = [
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", lst_path, "-c", "copy", tmp_speech_path
    ]
    subprocess.run(cmd, check=True, capture_output=True)

    # Apply post-effects + background
    _apply_effects(tmp_speech_path, block["context"], str(out_path))

    # Cleanup
    for p in tmp_parts:
        Path(p).unlink(missing_ok=True)
    Path(lst_path).unlink(missing_ok=True)
    Path(tmp_speech_path).unlink(missing_ok=True)

    print(f"  ✓  {out_path.name}  ({block['context']})")


_silence_cache: dict[int, str] = {}


def _generate_silence(ms: int) -> str:
    if ms in _silence_cache:
        return _silence_cache[ms]
    path = tempfile.mktemp(suffix=".mp3")
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", f"anullsrc=r=44100:cl=mono",
        "-t", str(ms / 1000),
        "-q:a", "9", path
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    _silence_cache[ms] = path
    return path


def _apply_effects(speech_path: str, context: str, out_path: str):
    """Apply background noise and/or audio effects via ffmpeg."""
    bg_cfg = CFG["backgrounds"].get(context, CFG["backgrounds"]["home"])
    post_effect = CFG["post_effects"].get(context, None)

    filters: list[str] = []
    if post_effect:
        filters.append(post_effect)

    if bg_cfg["filter"] and bg_cfg["volume"] > 0:
        # Mix speech with generated background noise
        bg_vol = bg_cfg["volume"]
        noise_filter = bg_cfg["filter"]
        # Build complex filter: speech + noise → amix
        af_speech = ",".join(filters) if filters else "anull"
        ffmpeg_cmd = [
            "ffmpeg", "-y",
            "-i", speech_path,
            "-f", "lavfi", "-i", f"{noise_filter}",
            "-filter_complex",
            f"[0]{af_speech}[speech];[1]volume={bg_vol}[bg];[speech][bg]amix=inputs=2:duration=first",
            "-q:a", "4", out_path
        ]
    else:
        # Just apply post effects (phone / PA) with no background
        if filters:
            af_str = ",".join(filters)
            ffmpeg_cmd = [
                "ffmpeg", "-y", "-i", speech_path,
                "-af", af_str,
                "-q:a", "4", out_path
            ]
        else:
            ffmpeg_cmd = [
                "ffmpeg", "-y", "-i", speech_path,
                "-q:a", "4", out_path
            ]

    subprocess.run(ffmpeg_cmd, check=True, capture_output=True)


# ---------------------------------------------------------------------------
# exercises.md patching
# ---------------------------------------------------------------------------

AUDIO_TAG = "🎧 **Audio:** [{filename}](audio/{filename})"


def patch_exercises(exercises_path: Path, blocks: list[dict]):
    """Insert audio reference lines into exercises.md above each transcript."""
    text = exercises_path.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)

    # Process in reverse order so line indices stay valid
    for block in reversed(blocks):
        hi = block["header_line"]
        # Skip if already has an audio tag in the 3 lines above
        preceding = "".join(lines[max(0, hi - 3): hi])
        if "🎧" in preceding:
            continue
        filename = f"{block['slug']}.mp3"
        tag_line = AUDIO_TAG.format(filename=filename) + "\n\n"
        lines.insert(hi, tag_line)

    exercises_path.write_text("".join(lines), encoding="utf-8")


# ---------------------------------------------------------------------------
# lesson.md parsing — dialogs and Hör-zu pronunciation blocks
# ---------------------------------------------------------------------------

DIALOG_SECTION = re.compile(r"^##\s+(\d+)\.\s+Dialoge?\b", re.IGNORECASE)
DIALOG_SUB = re.compile(r"^###\s+Dialog\s+([A-Za-z]):\s*(.+?)\s*$", re.IGNORECASE)
HOERZU_LINE = re.compile(r"^>\s+\*\*Hör zu (\d+)\s*[—–-]\s*(.+?):\*\*\s*(.+)$")
HOERTEXT_SECTION = re.compile(r"^##\s+(\d+)\.\s+Hörtext\b", re.IGNORECASE)


def parse_lesson_dialogs(text: str) -> list[dict]:
    """Extract numbered Dialog sections from lesson.md.

    Supports two layouts:
      - Flat:  `## N. Dialog` (or `Dialoge`) followed by speaker blockquotes.
      - Nested: `## N. Dialoge` containing `### Dialog A:`, `### Dialog B:`, …
        sub-headers; each sub-dialog is recorded as `dialog{n}_{letter}`.
    """
    results = []
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        m = DIALOG_SECTION.match(lines[i])
        if not m:
            i += 1
            continue
        n = m.group(1)
        # Look ahead within this H2 section for any `### Dialog X:` sub-headers.
        sub_starts: list[tuple[int, str, str]] = []
        j = i + 1
        while j < len(lines):
            line = lines[j]
            if line.startswith("## "):  # next H2 — stop scanning
                break
            sm = DIALOG_SUB.match(line)
            if sm:
                sub_starts.append((j, sm.group(1), sm.group(2).strip()))
            j += 1

        if sub_starts:
            for k, (h_line, letter, label) in enumerate(sub_starts):
                next_h = sub_starts[k + 1][0] if k + 1 < len(sub_starts) else j
                turns, mode = _collect_turns(lines, h_line + 1, end=next_h)
                # A real spoken dialog needs at least 2 turns; skip written
                # artefacts (emails, notices) that only have one speaker label.
                if turns and mode == "dialog" and len(turns) >= 2:
                    context = _detect_context_from_turns(turns)
                    results.append({
                        "header_line": h_line,
                        "slug": f"dialog{n}_{letter.lower()}",
                        "context": context,
                        "mode": mode,
                        "lines": turns,
                        "label": label,
                    })
            i = j
        else:
            # Flat layout: collect turns until the next H2.
            turns, mode = _collect_turns(lines, i + 1)
            if turns and mode == "dialog" and len(turns) >= 2:
                context = _detect_context_from_turns(turns)
                results.append({
                    "header_line": i,
                    "slug": f"dialog{n}",
                    "context": context,
                    "mode": mode,
                    "lines": turns,
                })
            i += 1
    return results


def parse_lesson_hoerzu(text: str) -> list[dict]:
    """Extract Hör-zu pronunciation word-list lines from lesson.md."""
    results = []
    lines = text.splitlines()
    for i, line in enumerate(lines):
        m = HOERZU_LINE.match(line)
        if m:
            n, label, words_str = m.group(1), m.group(2).strip(), m.group(3)
            words = [w.strip() for w in words_str.split("·") if w.strip()]
            # Each word becomes a turn spoken by the announcer
            turns = [{"speaker": "_mono", "text": w} for w in words]
            results.append({
                "header_line": i,
                "slug": f"hoerzu{n}",
                "context": "pronunciation",
                "mode": "wordlist",
                "lines": turns,
                "label": label,
            })
    return results


def parse_lesson_hoertext(text: str) -> list[dict]:
    """Extract `## N. Hörtext` sections from lesson.md.

    The Hörtext is rendered as a SINGLE TTS turn. The transcript may be
    placed directly as a blockquote or hidden inside a `<details>` spoiler
    tag so students cannot read it before listening. Both layouts are
    supported:

      Direct (legacy):
        ## 6. Hörtext
        > Sentence one. Sentence two.

      Spoiler (preferred):
        ## 6. Hörtext
        <details><summary>📄 Transkript …</summary>
        > Sentence one. Sentence two.
        </details>
    """
    results = []
    lines = text.splitlines()
    for i, line in enumerate(lines):
        m = HOERTEXT_SECTION.match(line)
        if not m:
            continue
        # Scan forward until the next ## heading, collecting blockquote lines.
        # If the blockquotes are inside a <details> block we still find them.
        body: list[str] = []
        j = i + 1
        while j < len(lines):
            row = lines[j]
            if re.match(r'^##\s', row):
                break
            if row.startswith(">"):
                cleaned = row.lstrip(">").strip()
                if cleaned:
                    body.append(cleaned)
            j += 1
        if not body:
            continue
        full_text = " ".join(body)
        turns = [{"speaker": "_mono", "text": full_text}]
        results.append({
            "header_line": i,
            "slug": "hoertext",
            "context": "hoertext",
            "mode": "hoertext",
            "lines": turns,
        })
    return results


def patch_lesson(lesson_path: Path, blocks: list[dict]):
    """Insert 🎧 audio links into lesson.md above each dialog/hoerzu block."""
    text = lesson_path.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)
    for block in reversed(blocks):
        hi = block["header_line"]
        # Check a window around the header: 3 lines before and 6 lines after,
        # so we catch both the pre-header placement (dialog/hoerzu) and the
        # post-header placement used in the Hörtext spoiler layout.
        window = "".join(lines[max(0, hi - 3): min(len(lines), hi + 7)])
        if "🎧" in window:
            continue
        filename = f"{block['slug']}.mp3"
        tag_line = AUDIO_TAG.format(filename=filename) + "\n\n"
        lines.insert(hi, tag_line)
    lesson_path.write_text("".join(lines), encoding="utf-8")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def find_exercises_files() -> list[Path]:
    return [
        p for p in REPO_ROOT.rglob("exercises.md")
        if "**Transcript**" in p.read_text(encoding="utf-8")
        or "Transcript:" in p.read_text(encoding="utf-8")
    ]


def find_lesson_files() -> list[Path]:
    """Find all lesson.md files that have Dialog sections, Hör-zu blocks, or Hörtext."""
    results = []
    for p in sorted(REPO_ROOT.rglob("lesson.md")):
        t = p.read_text(encoding="utf-8")
        if (DIALOG_SECTION.search(t) or HOERZU_LINE.search(t)
                or HOERTEXT_SECTION.search(t)):
            results.append(p)
    return results


def _process_blocks(source_path: Path, blocks: list[dict],
                    client, dry_run: bool, patch_fn, verbose: bool = False,
                    section: str | None = None):
    if not blocks:
        print("  (no audio blocks found)")
        return
    audio_dir = source_path.parent / "audio"
    audio_dir.mkdir(exist_ok=True)
    speed = speed_for_path(source_path)
    for block in blocks:
        slug = block['slug']
        out_path = audio_dir / f"{slug}.mp3"
        context = block["context"]
        if section and slug != section:
            continue
        if dry_run:
            print(f"  [DRY] {slug}.mp3  context={context}  turns={len(block['lines'])}  speed={speed}")
            for i, t in enumerate(block['lines'], 1):
                txt = t['text']
                ends_ok = txt.rstrip().endswith(('.', '!', '?'))
                # Only flag fragments in hoertext mode — dialogs are speaker
                # turns (always one sentence) and wordlist items are single
                # words / digits (no punctuation by design).
                is_frag = (block['mode'] == 'hoertext' and not ends_ok)
                flag = '✗FRAG' if is_frag else '✓'
                prefix = f"        {i:2d}. [{flag}] [{t['speaker']}] "
                if verbose:
                    print(f"{prefix}{txt}")
                else:
                    head = txt[:60] + ('…' if len(txt) > 60 else '')
                    print(f"{prefix}{head}")
            continue
        if out_path.exists():
            if section:
                out_path.unlink()  # force regeneration when section is specified
            else:
                print(f"  skip {slug}.mp3 (exists)")
                continue
        generate_clip(client, block, out_path, speed=speed)
    if not dry_run:
        patch_fn(source_path, blocks)


def process_lesson_file(lesson_path: Path, client, dry_run: bool = False,
                        verbose: bool = False, section: str | None = None):
    print(f"\n→ {lesson_path.relative_to(REPO_ROOT)}")
    text = lesson_path.read_text(encoding="utf-8")
    dialog_blocks = parse_lesson_dialogs(text)
    hoerzu_blocks = parse_lesson_hoerzu(text)
    hoertext_blocks = parse_lesson_hoertext(text)
    all_blocks = dialog_blocks + hoerzu_blocks + hoertext_blocks
    _process_blocks(lesson_path, all_blocks, client, dry_run, patch_lesson,
                    verbose=verbose, section=section)
    if not dry_run and all_blocks:
        print(f"  ✓  lesson.md patched")


def process_exercises_file(exercises_path: Path, client, dry_run: bool = False,
                           verbose: bool = False, section: str | None = None):
    print(f"\n→ {exercises_path.relative_to(REPO_ROOT)}")
    text = exercises_path.read_text(encoding="utf-8")
    blocks = parse_transcripts(text)
    _process_blocks(exercises_path, blocks, client, dry_run, patch_exercises,
                    verbose=verbose, section=section)
    if not dry_run and blocks:
        print(f"  ✓  exercises.md patched")


def main():
    parser = argparse.ArgumentParser(
        description="Generate Hören/dialogue/pronunciation audio for german-learning.")
    parser.add_argument("files", nargs="*",
                        help="lesson.md or exercises.md file(s) to process")
    parser.add_argument("--all", action="store_true",
                        help="Process all exercises.md files that have Transcript blocks")
    parser.add_argument("--all-lessons", action="store_true",
                        help="Process all lesson.md files (dialogues + Hör-zu blocks)")
    parser.add_argument("--list-voices", action="store_true",
                        help="List available ElevenLabs voices and exit")
    parser.add_argument("--dry-run", action="store_true",
                        help="Parse only — no API calls, no file writes")
    parser.add_argument("--verbose", "-v", action="store_true",
                        help="With --dry-run: print FULL text of every turn, not just the first 60 chars")
    parser.add_argument("--section", metavar="SLUG",
                        help="Regenerate only the block matching this slug, e.g. hoertext, "
                             "dialog1, dialog1_a, dialog1_b, hoerzu2. Forces re-generation "
                             "even if the MP3 already exists.")
    args = parser.parse_args()

    if args.list_voices:
        list_voices()
        return

    client = None if args.dry_run else get_client()

    targets_lessons: list[Path] = []
    targets_exercises: list[Path] = []

    if args.all_lessons:
        targets_lessons = find_lesson_files()
    if args.all:
        targets_exercises = find_exercises_files()

    for f in args.files:
        p = Path(f).resolve()
        if p.name == "lesson.md":
            targets_lessons.append(p)
        else:
            targets_exercises.append(p)

    if not targets_lessons and not targets_exercises:
        parser.print_help()
        return

    for p in targets_lessons:
        process_lesson_file(p, client, dry_run=args.dry_run, verbose=args.verbose,
                            section=args.section)
    for p in targets_exercises:
        process_exercises_file(p, client, dry_run=args.dry_run, verbose=args.verbose,
                               section=args.section)

    print("\nDone.")


if __name__ == "__main__":
    main()
