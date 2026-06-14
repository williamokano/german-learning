#!/usr/bin/env python3
"""
check_hoertext.py — detect Hörtext turns that would be split mid-sentence
or end without sentence-ending punctuation, across all A1/A2/.../lesson.md
files. Reports the affected hoertext.mp3 files so you can regenerate
only those.

Usage:
    python scripts/check_hoertext.py              # scan all lessons
    python scripts/check_hoertext.py A1          # scan only A1
    python scripts/check_hoertext.py A1/02-*     # scan one lesson
"""

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(REPO_ROOT / "scripts"))

import generate_audio as ga


def scan_lesson(lesson_path: Path) -> list[dict]:
    """Re-parse a lesson.md and return any problematic Hörtext blocks.

    Each Hörtext is one TTS turn; we flag any block whose text does not end
    with sentence-ending punctuation, OR whose length is suspiciously short
    (< 20 chars) or empty.
    """
    issues = []
    text = lesson_path.read_text(encoding="utf-8")
    for block in ga.parse_lesson_hoertext(text):
        if not block["lines"]:
            issues.append({
                "lesson": lesson_path.parent.name,
                "mp3": f"{block['slug']}.mp3",
                "turn": 0,
                "text": "(no turns)",
                "reason": "empty",
            })
            continue
        for i, turn in enumerate(block["lines"], 1):
            txt = turn["text"]
            if len(txt.strip()) < 20:
                issues.append({
                    "lesson": lesson_path.parent.name,
                    "mp3": f"{block['slug']}.mp3",
                    "turn": i,
                    "text": txt,
                    "reason": f"too short ({len(txt.strip())} chars)",
                })
                continue
            ends_ok = txt.rstrip().endswith((".", "!", "?"))
            if not ends_ok:
                issues.append({
                    "lesson": lesson_path.parent.name,
                    "mp3": f"{block['slug']}.mp3",
                    "turn": i,
                    "text": txt,
                    "reason": "no . ! or ? at end",
                })
    return issues


def main():
    # Accept 0+ path arguments; default = entire repo
    if len(sys.argv) > 1:
        roots = [REPO_ROOT / p for p in sys.argv[1:]]
    else:
        roots = [REPO_ROOT / "A1"]

    all_issues: list[dict] = []
    files_scanned = 0
    for root in roots:
        for lesson_md in sorted(root.rglob("lesson.md")):
            files_scanned += 1
            all_issues.extend(scan_lesson(lesson_md))

    print(f"Scanned {files_scanned} lesson.md file(s).")
    if not all_issues:
        print("✓ All Hörtext blocks are well-formed: one turn each, ≥ 20 chars, ending with . ! or ?")
        return 0

    print(f"✗ Found {len(all_issues)} Hörtext issue(s):\n")
    by_lesson: dict[str, list[dict]] = {}
    for issue in all_issues:
        by_lesson.setdefault(issue["lesson"], []).append(issue)
    for lesson, items in by_lesson.items():
        print(f"  {lesson}:")
        seen_mp3s = set()
        for it in items:
            reason = it.get("reason", "?")
            print(f"    {it['mp3']}  turn {it['turn']} ({reason}): \"{it['text']}\"")
            seen_mp3s.add(it['mp3'])
        print(f"    -> {len(seen_mp3s)} MP3 file(s) to regenerate: {', '.join(sorted(seen_mp3s))}")
        print()
    affected = sorted({(it["lesson"], it["mp3"]) for it in all_issues})
    print(f"Affected MP3 files: {len(affected)}")
    print("Run to regenerate (only missing files are generated):")
    for lesson, mp3 in affected:
        print(f"  rm {lesson}/audio/{mp3} && ELEVEN_API_KEY=... python scripts/generate_audio.py {lesson}/lesson.md")
    return 1


if __name__ == "__main__":
    sys.exit(main())
