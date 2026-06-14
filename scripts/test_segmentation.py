#!/usr/bin/env python3
"""
test_segmentation.py — unit tests for the audio text segmentation logic.

Run with:  python3 scripts/test_segmentation.py
(no pytest dependency required)
"""

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(REPO_ROOT / "scripts"))

import generate_audio as ga


# ---------------------------------------------------------------------------
# Test harness (minimal — no pytest needed)
# ---------------------------------------------------------------------------

_passed = 0
_failed = 0


def test(name: str):
    def decorator(fn):
        global _passed, _failed
        try:
            fn()
            _passed += 1
            print(f"  ✓ {name}")
        except AssertionError as e:
            _failed += 1
            print(f"  ✗ {name}: {e}")
        return fn
    return decorator


# ---------------------------------------------------------------------------
# parse_lesson_hoertext tests
# ---------------------------------------------------------------------------

@test("Hörtext: a single blockquote yields a SINGLE TTS turn (one call per Hörtext)")
def t_hoertext_single_turn():
    text = "## 6. Hörtext\n\n> Hallo! Wie geht es dir? Mir geht es gut.\n"
    blocks = ga.parse_lesson_hoertext(text)
    assert len(blocks) == 1
    assert len(blocks[0]["lines"]) == 1, \
        f"expected 1 turn, got {len(blocks[0]['lines'])}: {[l['text'] for l in blocks[0]['lines']]}"
    assert blocks[0]["lines"][0]["text"] == "Hallo! Wie geht es dir? Mir geht es gut."
    assert blocks[0]["lines"][0]["speaker"] == "_mono"


@test("Hörtext: wrapped markdown lines are joined into one turn (regression)")
def t_hoertext_wrapped_line():
    text = (
        "## 6. Hörtext\n\n"
        "> Hallo! Ich heiße Anna. Ich wohne jetzt in\n"
        "> Berlin und lerne Deutsch.\n"
    )
    blocks = ga.parse_lesson_hoertext(text)
    assert len(blocks) == 1
    lines = blocks[0]["lines"]
    assert len(lines) == 1
    assert lines[0]["text"] == "Hallo! Ich heiße Anna. Ich wohne jetzt in Berlin und lerne Deutsch."


@test("Hörtext: 4-line wrap yields one turn, full joined text")
def t_hoertext_multi_line_wrap():
    text = (
        "## 6. Hörtext\n\n"
        "> Hallo! Ich heiße Yuki Tanaka. Ich komme aus Japan, aus Osaka. Ich wohne jetzt in\n"
        "> München und lerne Deutsch. Ich spreche Japanisch, Englisch und ein bisschen\n"
        "> Deutsch. Mein Deutschkurs ist super! Die Lehrerin heißt Frau Schmidt. Sie kommt\n"
        "> aus Hamburg. Im Kurs sind elf Frauen und neun Männer. Und du? Wer bist du,\n"
        "> woher kommst du und welche Sprachen sprichst du?\n"
    )
    blocks = ga.parse_lesson_hoertext(text)
    assert len(blocks[0]["lines"]) == 1
    full = blocks[0]["lines"][0]["text"]
    expected = ("Hallo! Ich heiße Yuki Tanaka. Ich komme aus Japan, aus Osaka. "
                "Ich wohne jetzt in München und lerne Deutsch. "
                "Ich spreche Japanisch, Englisch und ein bisschen Deutsch. "
                "Mein Deutschkurs ist super! Die Lehrerin heißt Frau Schmidt. "
                "Sie kommt aus Hamburg. Im Kurs sind elf Frauen und neun Männer. "
                "Und du? Wer bist du, woher kommst du und welche Sprachen sprichst du?")
    assert full == expected
    # Sanity: the joined text must end with sentence-ending punctuation.
    assert full.rstrip()[-1] in ".!?"


@test("Hörtext: Hörtext text ends with sentence-ending punctuation (warning if not)")
def t_hoertext_ends_with_punct():
    text = "## 6. Hörtext\n\n> Hallo! Wie geht es dir? Mir geht es gut. Bis morgen!\n"
    blocks = ga.parse_lesson_hoertext(text)
    txt = blocks[0]["lines"][0]["text"]
    assert txt.rstrip()[-1] in ".!?"


@test("Hörtext: no header → empty result")
def t_hoertext_no_header():
    text = "> Just a blockquote, no Hörtext header.\n"
    blocks = ga.parse_lesson_hoertext(text)
    assert blocks == []


@test("Hörtext: empty blockquote → skipped")
def t_hoertext_empty_body():
    text = "## 6. Hörtext\n\n"
    blocks = ga.parse_lesson_hoertext(text)
    assert blocks == []


@test("Hörtext: blank lines between blockquote lines are tolerated")
def t_hoertext_blank_lines():
    text = (
        "## 6. Hörtext\n\n"
        "> Erste Zeile.\n"
        "\n"
        "> Zweite Zeile. Dritte Zeile.\n"
    )
    blocks = ga.parse_lesson_hoertext(text)
    assert len(blocks[0]["lines"]) == 1
    assert blocks[0]["lines"][0]["text"] == "Erste Zeile. Zweite Zeile. Dritte Zeile."


# ---------------------------------------------------------------------------
# _collect_turns tests (dialog parsing — covers the wrapped-line fix)
# ---------------------------------------------------------------------------

@test("Dialog: wrapped speaker line merges into previous turn (regression)")
def t_dialog_wrapped_speaker():
    text = (
        "## 1. Dialog: Test\n\n"
        "> **Anna:** Hallo! Ich heiße Anna. Ich wohne jetzt in\n"
        "> Berlin und lerne Deutsch.\n"
        "> **Bruno:** Hallo Anna!\n"
    )
    blocks = ga.parse_lesson_dialogs(text)
    assert len(blocks) == 1
    lines = blocks[0]["lines"]
    assert len(lines) == 2
    assert lines[0]["speaker"] == "Anna"
    assert lines[0]["text"] == "Hallo! Ich heiße Anna. Ich wohne jetzt in Berlin und lerne Deutsch."
    assert lines[1]["speaker"] == "Bruno"


@test("Dialog: no speaker label on first line (intro) is skipped")
def t_dialog_intro_skipped():
    text = (
        "## 1. Dialog: Test\n\n"
        "*Anna besucht Bruno in Berlin.*\n"
        "\n"
        "> **Anna:** Hallo Bruno!\n"
        "> **Bruno:** Hallo Anna!\n"
    )
    blocks = ga.parse_lesson_dialogs(text)
    lines = blocks[0]["lines"]
    assert len(lines) == 2
    assert all(t["speaker"] != "_mono" for t in lines)


@test("Dialog: one-line stage direction between sub-dialogs keeps both (regression)")
def t_dialog_stage_direction_between():
    text = (
        "## 1. Dialog: Test\n\n"
        "> **Anna:** Hallo!\n"
        "> **Bruno:** Hi!\n"
        "\n"
        "And the formal version — note **Sie** instead of **du**:\n"
        "\n"
        "> **Frau Weber:** Guten Tag!\n"
        "> **Herr Wegner:** Guten Tag, Frau Weber.\n"
    )
    blocks = ga.parse_lesson_dialogs(text)
    lines = blocks[0]["lines"]
    assert len(lines) == 4, f"expected 4 turns (2 informal + 2 formal), got {len(lines)}"
    speakers = [t["speaker"] for t in lines]
    assert speakers == ["Anna", "Bruno", "Frau Weber", "Herr Wegner"]
    # Confirm the stage direction was NOT captured as a turn
    assert all(t["speaker"] != "_mono" for t in lines)


@test("Dialog: H3 sub-dialogs (## 1. Dialoge + ### Dialog A/B) split into separate MP3s")
def t_dialog_subdialogs():
    text = (
        "## 1. Dialoge\n\n"
        "### Dialog A: First\n"
        "> **Anna:** Hallo!\n"
        "> **Bruno:** Hi Anna!\n"
        "\n"
        "### Dialog B: Second\n"
        "> **Bruno:** Tschüss!\n"
        "> **Anna:** Bis morgen!\n"
    )
    blocks = ga.parse_lesson_dialogs(text)
    assert len(blocks) == 2
    slugs = sorted(b["slug"] for b in blocks)
    assert slugs == ["dialog1_a", "dialog1_b"]


@test("Dialog: a sub-dialog with < 2 turns is skipped (e.g. an email under ### Dialog)")
def t_dialog_subdialog_email_skipped():
    text = (
        "## 1. Dialoge\n\n"
        "### Dialog A: Phone call\n"
        "> **Anna:** Hallo!\n"
        "> **Bruno:** Hi!\n"
        "\n"
        "### Dialog B: Email\n"
        "> **Betreff:** Frage\n"
    )
    blocks = ga.parse_lesson_dialogs(text)
    slugs = sorted(b["slug"] for b in blocks)
    assert slugs == ["dialog1_a"], f"email sub-dialog should be skipped: got {slugs}"


# ---------------------------------------------------------------------------
# End-of-run summary
# ---------------------------------------------------------------------------

print()
if _failed == 0:
    print(f"OK — {_passed} test(s) passed.")
    sys.exit(0)
else:
    print(f"FAIL — {_failed}/{_passed + _failed} test(s) failed.")
    sys.exit(1)
