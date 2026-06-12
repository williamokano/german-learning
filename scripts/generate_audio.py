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


def tts(client: ElevenLabs, text: str, voice_key: str) -> bytes:
    """Generate TTS audio bytes for one text fragment."""
    vcfg = CFG["voices"][voice_key]
    audio = client.text_to_speech.convert(
        voice_id=vcfg["voice_id"],
        text=text,
        model_id=CFG["model"],
        voice_settings={
            "stability": vcfg["stability"],
            "similarity_boost": vcfg["similarity_boost"],
        },
    )
    return b"".join(audio)


# ---------------------------------------------------------------------------
# Voice assignment
# ---------------------------------------------------------------------------

_voice_cache: dict[str, str] = {}  # speaker name → voice key
_female_pool = ["Anna", "female_1", "female_2", "female_3"]
_male_pool = ["Bruno", "male_1", "male_2", "male_3"]
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


def _collect_turns(lines: list[str], start: int) -> tuple[list[dict], str]:
    """Collect blockquote lines after a Transcript header."""
    turns = []
    mode = "mono"
    i = start
    while i < len(lines):
        line = lines[i]
        if line.strip() == "" and i > start:
            # stop at first blank line after content started
            if turns:
                break
        m = DIALOG_LINE.match(line)
        if m:
            mode = "dialog"
            turns.append({"speaker": m.group(1).strip(), "text": m.group(2).strip()})
        else:
            m2 = MONO_LINE.match(line)
            if m2:
                turns.append({"speaker": "_mono", "text": m2.group(1).strip()})
            elif turns:
                break
        i += 1
    return turns, mode


# ---------------------------------------------------------------------------
# Audio generation
# ---------------------------------------------------------------------------

SILENCE_400 = AudioSegment.silent(duration=CFG["pause_ms"]["between_turns"])
SILENCE_200 = AudioSegment.silent(duration=CFG["pause_ms"]["between_sentences"])


def generate_clip(client: ElevenLabs, block: dict, out_path: Path):
    """Generate one MP3 file for a transcript block."""
    reset_voice_cache()
    segments: list[AudioSegment] = []

    for turn in block["lines"]:
        speaker = turn["speaker"]
        if speaker == "_mono":
            voice_key = "announcer"
        else:
            voice_key = voice_for_speaker(speaker)

        audio_bytes = tts(client, turn["text"], voice_key)
        seg = AudioSegment.from_file(
            tempfile.NamedTemporaryFile(suffix=".mp3", delete=False,
                                        dir=tempfile.gettempdir()).name.__class__(
                _write_tmp(audio_bytes, ".mp3")),
            format="mp3",
        )
        segments.append(seg)
        segments.append(SILENCE_400)

    if not segments:
        return

    combined = segments[0]
    for s in segments[1:]:
        combined = combined + s

    # Export combined speech to a temp file
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_speech:
        tmp_speech_path = tmp_speech.name
    combined.export(tmp_speech_path, format="mp3")

    # Apply post-effects + background mixing via ffmpeg
    _apply_effects(tmp_speech_path, block["context"], str(out_path))
    Path(tmp_speech_path).unlink(missing_ok=True)

    print(f"  ✓  {out_path.name}  ({block['context']})")


def _write_tmp(data: bytes, suffix: str) -> str:
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        f.write(data)
        return f.name


def generate_clip_v2(client: ElevenLabs, block: dict, out_path: Path):
    """Generate one MP3 — cleaner version avoiding pydub temp-file issues."""
    reset_voice_cache()
    tmp_parts: list[str] = []

    for turn in block["lines"]:
        speaker = turn["speaker"]
        voice_key = "announcer" if speaker == "_mono" else voice_for_speaker(speaker)
        audio_bytes = tts(client, turn["text"], voice_key)
        tmp = _write_tmp(audio_bytes, ".mp3")
        tmp_parts.append(tmp)

    if not tmp_parts:
        return

    # Concatenate with ffmpeg (with 400ms silence between turns)
    # Build concat filter
    inputs = []
    filter_parts = []
    label_idx = 0
    for i, part in enumerate(tmp_parts):
        inputs += ["-i", part]
        filter_parts.append(f"[{i}]")
        label_idx = i + 1
        if i < len(tmp_parts) - 1:
            # add a silence segment
            filter_parts.append(f"[silence{i}]")

    # Build a simpler approach: concatenate with anull padding
    # Use ffmpeg concat demuxer via a list file
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as lst:
        lst_path = lst.name
        # Write each part, adding silence between
        silence_ms = CFG["pause_ms"]["between_turns"]
        for i, part in enumerate(tmp_parts):
            lst.write(f"file '{part}'\n")
            if i < len(tmp_parts) - 1:
                # Generate a silence file
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
# Main
# ---------------------------------------------------------------------------

def find_exercises_files() -> list[Path]:
    return [
        p for p in REPO_ROOT.rglob("exercises.md")
        if "**Transcript**" in p.read_text(encoding="utf-8")
        or "Transcript:" in p.read_text(encoding="utf-8")
    ]


def process_file(exercises_path: Path, client: ElevenLabs, dry_run: bool = False):
    print(f"\n→ {exercises_path.relative_to(REPO_ROOT)}")
    text = exercises_path.read_text(encoding="utf-8")
    blocks = parse_transcripts(text)
    if not blocks:
        print("  (no transcripts found)")
        return

    audio_dir = exercises_path.parent / "audio"
    audio_dir.mkdir(exist_ok=True)

    for block in blocks:
        out_path = audio_dir / f"{block['slug']}.mp3"
        if dry_run:
            turns_preview = " / ".join(
                f"{t['speaker']}: {t['text'][:30]}…" for t in block["lines"][:2]
            )
            print(f"  [DRY] {block['slug']}.mp3  context={block['context']}  turns={len(block['lines'])}")
            print(f"        {turns_preview}")
            continue

        if out_path.exists():
            print(f"  skip {out_path.name} (already exists — delete to regenerate)")
            continue

        generate_clip_v2(client, block, out_path)

    if not dry_run:
        patch_exercises(exercises_path, blocks)
        print(f"  ✓  exercises.md patched with audio references")


def main():
    parser = argparse.ArgumentParser(description="Generate Hören audio for german-learning exercises.")
    parser.add_argument("files", nargs="*", help="exercises.md file(s) to process")
    parser.add_argument("--all", action="store_true", help="Process all exercises.md files that have transcripts")
    parser.add_argument("--list-voices", action="store_true", help="List available ElevenLabs voices and exit")
    parser.add_argument("--dry-run", action="store_true", help="Parse transcripts only, do not call API or write files")
    args = parser.parse_args()

    if args.list_voices:
        list_voices()
        return

    client = None if args.dry_run else get_client()

    if args.all:
        targets = find_exercises_files()
    elif args.files:
        targets = [Path(f).resolve() for f in args.files]
    else:
        parser.print_help()
        return

    for target in targets:
        process_file(target, client, dry_run=args.dry_run)

    print("\nDone.")


if __name__ == "__main__":
    main()
