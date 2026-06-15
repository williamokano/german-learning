#!/usr/bin/env python3
"""
Create GitHub issues for the B1/B2/C1 lesson pipeline.

- 3 master issues (B1, B2, C1) with checklists of all sub-lessons
- 14 + 14 + 12 = 40 sub-issues (one per lesson) cross-referenced to masters

Usage:  python3 scripts/create_issues.py
"""
import json
import subprocess
import sys
import time
from pathlib import Path

REPO = "williamokano/german-learning"

# ---------------------------------------------------------------------------
# Lesson data: per-lesson grammar anchor, theme, characters, Hörtext
# ---------------------------------------------------------------------------

B1_LESSONS = [
    {
        "num": "01", "slug": "frueher-und-heute",
        "title": "Früher und heute",
        "grammar": "Präteritum (regular + key irregular: sein, haben, werden, wissen, können, müssen), Plusquamperfekt",
        "theme": "Wie hat sich dein Leben verändert?",
        "dialog_a": "Mia, Lukas, Anna + Bruno (dinner party — 4 voices): 'Wie hat sich Berlin seit 2015 verändert?'",
        "dialog_b": "Bruno, Frau Yilmaz (at the office): 'Wie hat sich Ihre Branche in den letzten 10 Jahren verändert?'",
        "hoertext": "Lukas's mother calling from a small Bavarian village; tells about the changes in her town",
        "first_appear": "Mia, Lukas",
    },
    {
        "num": "02", "slug": "gegensaetze-und-folgen",
        "title": "Gegensätze und Folgen",
        "grammar": "obwohl, trotzdem, deshalb / darum / deswegen, einerseits … andererseits, zwar … aber",
        "theme": "Warum hast du dein Land verlassen?",
        "dialog_a": "Tomáš + Pavel + Mia (brothers' mini-debate with moderator)",
        "dialog_b": "Frau Yilmaz + Anna (workplace)",
        "hoertext": "DW-Nachrichten clip about brain drain in Southern Europe",
        "first_appear": "Tomáš, Pavel",
    },
    {
        "num": "03", "slug": "wuensche-und-irreales",
        "title": "Wünsche und Irreales",
        "grammar": "Konjunktiv II full (hätte, wäre, würde + Inf), irreale Bedingungssätze (Wenn ich … hätte, würde ich …), advice",
        "theme": "Was würdest du tun, wenn du eine Million hättest? + Wenn ich nochmal 18 wäre, …",
        "dialog_a": "Anna + Bruno + Mia (over coffee, hypotheticals)",
        "dialog_b": "Yusuf (giving career advice to a young colleague) — first appearance of Dr. El-Sayed",
        "hoertext": "Lukas's podcast snippet 'Was wäre, wenn Berlin autofrei wäre?'",
        "first_appear": "Yusuf",
    },
    {
        "num": "04", "slug": "das-passiv",
        "title": "Das Passiv",
        "grammar": "Passiv Präsens/Präteritum/Perfekt, Passiv + Modal (kann gemacht werden), von/durch + agent, Zustandspassiv (intro)",
        "theme": "Wie funktioniert KI eigentlich? Und wer kontrolliert das?",
        "dialog_a": "Anna + Lukas + Bruno (KI debate at a café)",
        "dialog_b": "Frau Yilmaz + Bruno (at work)",
        "hoertext": "DW/DLF science segment 'Wie wird KI eigentlich trainiert?'",
        "first_appear": "—",
    },
    {
        "num": "05", "slug": "relativsaetze-komplett",
        "title": "Relativsätze komplett",
        "grammar": "Relativsätze in Dativ, Relativsätze mit Präposition, wo/wohin + was als Relativpronomen",
        "theme": "Was macht eigentlich ein gutes Leben aus?",
        "dialog_a": "Yusuf + Hannah (the couple) — Sunday morning philosophical chat",
        "dialog_b": "Anna + Frau Yilmaz (workplace)",
        "hoertext": "Book review / Feuilleton snippet",
        "first_appear": "Hannah",
    },
    {
        "num": "06", "slug": "ziele-und-absichten",
        "title": "Ziele und Absichten",
        "grammar": "um … zu + Infinitiv, damit + Verb-End, versuchen zu / anfangen zu / aufhören zu, ohne … zu / statt … zu",
        "theme": "Wie lernt man am besten eine Sprache?",
        "dialog_a": "Pavel + Tomáš + Bruno (comparing language-learning strategies)",
        "dialog_b": "Anna + Frau Yilmaz",
        "hoertext": "Short podcast 'Tipps zum Deutschlernen'",
        "first_appear": "—",
    },
    {
        "num": "07", "slug": "der-genitiv",
        "title": "Der Genitiv",
        "grammar": "Genitiv nach Artikeln, Genitiv mit n-Deklination, wegen + Gen, trotz + Gen, während + Gen, statt + Gen",
        "theme": "Wem gehört was?",
        "dialog_a": "Hannah + Yusuf + Salma (El-Sayed family at home)",
        "dialog_b": "Bruno + Frau Yilmaz",
        "hoertext": "Nachrichten-Snippet 'Wegen des Sturms …'",
        "first_appear": "Salma (Yusuf's daughter)",
    },
    {
        "num": "08", "slug": "verben-mit-praepositionen",
        "title": "Verben mit Präpositionen II",
        "grammar": "Full set (sich freuen auf/über, sich ärgern über, sich interessieren für, sich beschweren bei/über, sich entschuldigen bei/für, achten auf, denken an); Pronominaladverbien (darauf, daran, darüber, worüber?)",
        "theme": "Worauf achtest du bei der Arbeit?",
        "dialog_a": "Anna + Mia + Bruno (workplace values)",
        "dialog_b": "Bruno + Frau Yilmaz",
        "hoertext": "Interview 'Worauf achten Sie bei Ihrer Arbeit?'",
        "first_appear": "—",
    },
    {
        "num": "09", "slug": "indirekte-fragen",
        "title": "Indirekte Fragen & Höflichkeit",
        "grammar": "Indirect questions with ob and W-wort, verb position, Höflichkeitsregister, Ich wollte fragen, ob …, Könnten Sie mir sagen, …",
        "theme": "Service- and phone-call situations",
        "dialog_a": "Yuki + Frau Hoffmann (Sekretärin — phone call from Osaka)",
        "dialog_b": "Bruno + Frau Yilmaz",
        "hoertext": "Recorded phone announcement (voicemail at a Berlin Amt)",
        "first_appear": "—",
    },
    {
        "num": "10", "slug": "zweiteilige-konnektoren",
        "title": "Zweiteilige Konnektoren",
        "grammar": "nicht nur … sondern auch, sowohl … als auch, entweder … oder, weder … noch, zwar … aber",
        "theme": "Was muss man tun, um ein Land zu regieren?",
        "dialog_a": "Yusuf + Hannah + Anna (political debate over dinner)",
        "dialog_b": "Anna + Frau Yilmaz",
        "hoertext": "DW 'Politik erklärt' on coalition formation",
        "first_appear": "—",
    },
    {
        "num": "11", "slug": "arbeitswelt-und-bewerbung",
        "title": "Arbeitswelt & Bewerbung",
        "grammar": "Review in context; Bewerbungs-flavor language (sich bewerben bei/um, gefragt werden)",
        "theme": "Wie bewerbe ich mich richtig?",
        "dialog_a": "Pavel + Mia (Pavel asks Mia for advice on his Bewerbung)",
        "dialog_b": "Anna + Frau Yilmaz + Herr Steinmeyer (3-person formal interview panel)",
        "hoertext": "Anna's recorded self-presentation audio (for the Bewerbungsvideo-Anlage)",
        "first_appear": "—",
    },
    {
        "num": "12", "slug": "umwelt-und-gesellschaft",
        "title": "Umwelt und Gesellschaft",
        "grammar": "Nominalization (intro): das Recyceln, die Reduzierung von …, der Verzicht auf …; Verbalstil → Nominalstil transformation",
        "theme": "Wie retten wir das Klima?",
        "dialog_a": "Mia + Lukas + Bruno (climate/roundtable)",
        "dialog_b": "Bruno + Frau Yilmaz",
        "hoertext": "DW 'Klimaschutz' segment — interview with a climate scientist",
        "first_appear": "—",
    },
    {
        "num": "13", "slug": "schreiben-und-sprechen",
        "title": "Schreiben und Sprechen B1",
        "grammar": "— (review of B1/01–B1/12)",
        "theme": "Wie hält man einen guten Vortrag?",
        "dialog_a": "Anna + Mia (Anna practices her Vortrag)",
        "dialog_b": "Yusuf + Hannah + Anna (Yusuf mentors Anna on her B1 Prüfungsvortrag)",
        "hoertext": "Short podcast where Yusuf explains 'Wie man einen guten Vortrag hält'",
        "first_appear": "—",
    },
    {
        "num": "14", "slug": "pruefungstraining-b1",
        "title": "Prüfungstraining B1 (mock exam)",
        "grammar": "Full review",
        "theme": "Mock exam: Goethe-Zertifikat B1 / telc Deutsch B1 (all modules)",
        "dialog_a": "—",
        "dialog_b": "—",
        "hoertext": "4 Hören Ansagen + 1 längerer Dialog; 2 Telefongespräche; 1 Kurzvortrag; 1 Planungsdiskussion (3-person)",
        "first_appear": "—",
        "note": "Mock exam — do solo, not in parallel batch. Last in level.",
    },
]

# B2 and C1 lessons are inherited from CURRICULUM.md; titles + slugs are stable.
# Each sub-issue gets grammar + theme + dialog summary from the curriculum table.
B2_LESSONS = [
    ("01", "nominalstil-und-verbalstil",      "Nominalstil und Verbalstil",            "Nominalisierung ↔ Verbalisierung; Präposition + Nomen vs. Nebensatz (bei/während/wegen ↔ wenn/als/weil)"),
    ("02", "passiv-und-alternativen",         "Passiv und seine Alternativen",         "Passiversatz: man, sich lassen, -bar, sein + zu + Infinitiv; Zustandspassiv"),
    ("03", "vergangenheit-der-moeglichkeit",  "Vergangenheit der Möglichkeit",        "Konjunktiv II der Vergangenheit (hätte gemacht, wäre gegangen); irreale Vergleiche (als ob)"),
    ("04", "indirekte-rede",                  "Indirekte Rede",                        "Konjunktiv I; Redewiedergabe in Nachrichten; solle/wolle/könne"),
    ("05", "partizipien-als-attribute",       "Partizipien als Attribute",             "Partizip I/II als Adjektiv; erweiterte Partizipialattribute; Relativsatz-Umformung"),
    ("06", "modalverben-subjektiv",           "Modalverben: subjektive Bedeutung",     "Er muss/dürfte/könnte/soll/will reich sein — Vermutung & Distanzierung"),
    ("07", "konnektoren-fuer-profis",         "Konnektoren für Profis",                "je … desto, indem, sodass, falls, sofern, es sei denn; Konzessivität vertieft"),
    ("08", "funktionsverbgefuige",            "Funktionsverbgefüge & feste Verbindungen", "eine Entscheidung treffen, zur Verfügung stehen, in Frage kommen …"),
    ("09", "wortbildung",                     "Wortbildung",                           "Präfixe (ver-, zer-, ent-, miss-…); Suffixe; Komposita; Bedeutungsnuancen"),
    ("10", "wissenschaft-und-technik",       "Wissenschaft und Technik",              "Grammatik im Kontext (Passiv, Nominalstil); Fachtexte, Digitalisierung, Forschung"),
    ("11", "wirtschaft-und-arbeitswelt",     "Wirtschaft und Arbeitswelt",            "Verhandeln, Meetings, Berichte, Wirtschaftsnachrichten"),
    ("12", "argumentieren-und-eroertern",    "Argumentieren und Erörtern",            "Redemittel der Stellungnahme; Erörterung, Kommentar, Pro-Contra, Leserbrief"),
    ("13", "grafiken-und-berichte",           "Grafiken und Berichte",                 "Grafikbeschreibung, Daten versprachlichen (telc B2 / TestDaF-Stil)"),
    ("14", "pruefungstraining-b2",           "Prüfungstraining B2",                   "Modelltest: Goethe B2 / telc B2"),
]

C1_LESSONS = [
    ("01", "stil-und-register",               "Stil und Register",                     "Gehobene vs. umgangssprachliche Register, Stilebenen erkennen und gezielt einsetzen"),
    ("02", "komplexe-syntax",                 "Komplexe Syntax",                       "Satzperioden, Apposition, Parenthese, vorangestellte/nachgestellte Attribute, Ellipse"),
    ("03", "modalpartikeln-und-nuancen",     "Modalpartikeln und Nuancen",             "doch, ja, eben, halt, wohl, schon, mal, eigentlich — Bedeutung und Wirkung"),
    ("04", "idiomatik-und-kollokationen",     "Idiomatik und Kollokationen",           "Redewendungen, Sprichwörter, starke Kollokationen"),
    ("05", "wissenschaftssprache",            "Wissenschaftssprache",                  "Strukturen der Wissenschaftssprache, Hedging, Verweise, abstrakter Wortschatz"),
    ("06", "feinheiten-der-grammatik",        "Feinheiten der Grammatik",               "Konjunktiv-Feinheiten, Negationsnuancen, Wortstellung im Mittelfeld, es-Konstruktionen"),
    ("07", "synonymik-und-bedeutungsnuancen","Synonymik und Bedeutungsnuancen",        "Nahezu-synonyme Verben/Nomen unterscheiden, falsche Freunde, Konnotationen"),
    ("08", "textproduktion-c1",               "Textproduktion C1",                     "Erörterung, Zusammenfassung, Stellungnahme, wissenschaftliches Abstract"),
    ("09", "vortrag-und-diskussion",          "Vortrag und Diskussion",                "Präsentationen, Moderation, spontanes Argumentieren, rhetorische Mittel"),
    ("10", "literatur-und-medien",            "Literatur und Medien",                  "Literarische Texte, Feuilleton, Satire, Hörfunk-Features"),
    ("11", "gesellschaft-politik-zukunft",   "Gesellschaft, Politik, Zukunft",        "C1-Prüfungsthemen lexikalisch: Politik, Globalisierung, KI, Demografie"),
    ("12", "pruefungstraining-c1",           "Prüfungstraining C1",                   "Modelltest: Goethe C1 / telc C1 Hochschule"),
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def gh_issue_create(title, body, labels):
    """Create a GitHub issue and return its number."""
    args = [
        "gh", "issue", "create",
        "--title", title,
        "--body", body,
        "--label", ",".join(labels),
        "--repo", REPO,
    ]
    res = subprocess.run(args, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"  ✗ {title[:60]}… → {res.stderr.strip()[:120]}", file=sys.stderr)
        return None
    # Output: https://github.com/owner/repo/issues/N
    out = res.stdout.strip()
    if "/issues/" in out:
        return int(out.rsplit("/", 1)[1])
    return None


def make_sub_issue_body(level, lesson, master_ref, plan_note=None):
    """Build the body for a sub-issue (one per lesson)."""
    n = lesson["num"]
    title = lesson["title"]
    slug = lesson["slug"]
    folder = f"{level}/{n}-{slug}"

    lines = [
        f"## {level}/{n} — {title}",
        "",
        f"**Folder:** `{folder}/`  ",
        f"**Scaffolding:** `lesson.md` + `exercises.yml` (then `gen-exercises` regenerates `.md`).  ",
        f"**Part of:** #{master_ref} (master tracking issue)",
        "",
    ]

    if "note" in lesson:
        lines += [f"> ⚠️ **{lesson['note']}**", ""]

    if "grammar" in lesson:
        lines += [f"**Grammar anchor:** {lesson['grammar']}", ""]
    if "theme" in lesson:
        lines += [f"**Theme:** {lesson['theme']}", ""]
    if "dialog_a" in lesson:
        lines += [f"**Dialog A:** {lesson['dialog_a']}", ""]
    if "dialog_b" in lesson:
        lines += [f"**Dialog B:** {lesson['dialog_b']}", ""]
    if "hoertext" in lesson:
        lines += [f"**Hörtext:** {lesson['hoertext']}", ""]
    if "first_appear" in lesson and lesson["first_appear"] != "—":
        lines += [f"**Characters introduced in this lesson:** {lesson['first_appear']} (create persona files first if new)", ""]

    if plan_note:
        lines += ["---", "", plan_note, ""]

    lines += [
        "---",
        "",
        "## Definition of Done",
        "",
        "- [ ] `lesson.md` + `exercises.yml` written per `AUTHORING.md`",
        "- [ ] `npx tsx build/gen-exercises.ts <dir>` exits 0",
        "- [ ] `python3 scripts/generate_audio.py <dir>/lesson.md` produces all audio",
        "- [ ] `python3 scripts/generate_audio.py <dir>/exercises.md` produces H4 mp3",
        "- [ ] Committed + pushed (one commit per lesson)",
        "- [ ] Cross-references the master tracking issue (#" + str(master_ref) + ")",
        "",
        "## Reference",
        "",
        "- B1 plan: see chat history of commit `22e73b8`",
        "- Personas: `personas/README.md`",
        "- Voice registry: `scripts/audio_config.json`",
        "- Authoring spec: `AUTHORING.md`",
        "",
    ]
    return "\n".join(lines)


def make_sub_issue_body_simple(level, num, slug, title, grammar, master_ref, is_exam=False):
    """Build a sub-issue body for B2/C1 (less detail in plan)."""
    folder = f"{level}/{num}-{slug}"
    lines = [
        f"## {level}/{num} — {title}",
        "",
        f"**Folder:** `{folder}/`  ",
        f"**Scaffolding:** `lesson.md` + `exercises.yml` (then `gen-exercises` regenerates `.md`).  ",
        f"**Part of:** #{master_ref} (master tracking issue)",
        "",
    ]
    if is_exam:
        lines += [
            "> ⚠️ **Mock exam — do solo, not in a parallel batch. Last in level.**",
            "",
        ]
    if grammar:
        lines += [f"**Grammar anchor:** {grammar}", ""]
    lines += [
        "**Cast (re-use existing B1 personas; add new B2/C1 characters as needed):**",
        "Anna, Bruno, Mia, Lukas, Yusuf, Hannah, Tomáš, Pavel, plus new B2/C1 personas per topic.",
        "",
        "---",
        "",
        "## Definition of Done",
        "",
        "- [ ] `lesson.md` + `exercises.yml` written per `AUTHORING.md`",
        "- [ ] `npx tsx build/gen-exercises.ts <dir>` exits 0",
        "- [ ] `python3 scripts/generate_audio.py <dir>/lesson.md` produces all audio",
        "- [ ] `python3 scripts/generate_audio.py <dir>/exercises.md` produces H4 mp3",
        "- [ ] Committed + pushed (one commit per lesson)",
        "- [ ] Cross-references the master tracking issue (#" + str(master_ref) + ")",
        "",
        "## Reference",
        "",
        "- Authoring spec: `AUTHORING.md`",
        "- Personas: `personas/README.md`",
        "- Voice registry: `scripts/audio_config.json`",
        "- Curriculum topic row: `CURRICULUM.md`",
        "",
    ]
    return "\n".join(lines)


def make_master_body(level, lessons, sub_issue_numbers):
    """Build the body of a master tracking issue."""
    n_lessons = len(lessons)
    lines = [
        f"# {level} — Master tracking issue",
        "",
        f"**{n_lessons} lessons** to author (one folder per topic: `{level}/<NN>-<slug>/`).",
        "",
        "Each lesson: `lesson.md` + `exercises.yml` (canonical source).",
        "`exercises.md` + `solutions.md` are generated by `npx tsx build/gen-exercises.ts`.",
        "Audio by `python3 scripts/generate_audio.py`.",
        "",
        "Authoring spec: **`AUTHORING.md`**.  Personas: **`personas/README.md`**.",
        "Voice registry: **`scripts/audio_config.json`**.",
        "",
        "---",
        "",
        "## Lesson checklist",
        "",
    ]
    for i, (lesson, num) in enumerate(zip(lessons, sub_issue_numbers)):
        if isinstance(lesson, dict):
            n = lesson["num"]
            title = lesson["title"]
            slug = lesson["slug"]
        else:
            n, slug, title, _ = lesson
        closed = "x"  # visual: every entry is a checkbox
        lines.append(f"- [{closed}] **{level}/{n}** [{title}](#{num})")
    lines += [
        "",
        "---",
        "",
        "## Definition of Done for the level",
        "",
        f"- [ ] All {n_lessons} sub-issues closed",
        "- [ ] `npx tsx build/gen-exercises.ts --all --check` is green for every lesson in the level",
        "- [ ] Site at `okano.dev/german-learning/{level}/` serves every lesson with audio",
        "- [ ] `tasks/todo.md` checkbox row updated to ✅ DONE for every lesson",
        "- [ ] `CURRICULUM.md` Progress section updated",
        "",
    ]
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    # 1) Create master issues, capture their numbers
    masters = {}
    for level, _lessons in [("B1", B1_LESSONS), ("B2", B2_LESSONS), ("C1", C1_LESSONS)]:
        n = len(_lessons)
        title = f"{level} — Master tracking issue ({n} lessons to author)"
        body = make_master_body(level, _lessons, sub_issue_numbers=range(0, n))  # placeholder #N
        num = gh_issue_create(
            title=title,
            body=body,
            labels=["content", level, "master-issue"],
        )
        if num is None:
            print(f"FATAL: could not create {level} master", file=sys.stderr)
            sys.exit(1)
        print(f"✓ {level} master: #{num}")
        masters[level] = num
        time.sleep(0.5)

    # 2) Create sub-issues
    sub_numbers = {"B1": [], "B2": [], "C1": []}

    # B1 — full detail
    for lesson in B1_LESSONS:
        n = lesson["num"]
        slug = lesson["slug"]
        title = lesson["title"]
        body = make_sub_issue_body("B1", lesson, masters["B1"])
        is_exam = "note" in lesson
        num = gh_issue_create(
            title=f"B1/{n} — {title}",
            body=body,
            labels=["content", "B1", "lesson"],
        )
        if num is None:
            print(f"  ✗ B1/{n} skipped", file=sys.stderr)
            sub_numbers["B1"].append(None)
        else:
            print(f"  ✓ B1/{n} — {title}: #{num}")
            sub_numbers["B1"].append(num)
        time.sleep(0.3)

    # B2 — simpler body
    for (num, slug, title, grammar), place in zip(B2_LESSONS, range(len(B2_LESSONS))):
        is_exam = (num == "14")
        body = make_sub_issue_body_simple("B2", num, slug, title, grammar, masters["B2"], is_exam)
        n = gh_issue_create(
            title=f"B2/{num} — {title}",
            body=body,
            labels=["content", "B2", "lesson"],
        )
        if num is None:
            print(f"  ✗ B2/{num} skipped", file=sys.stderr)
            sub_numbers["B2"].append(None)
        else:
            print(f"  ✓ B2/{num} — {title}: #{n}")
            sub_numbers["B2"].append(n)
        time.sleep(0.3)

    # C1 — simpler body
    for (num, slug, title, grammar), place in zip(C1_LESSONS, range(len(C1_LESSONS))):
        is_exam = (num == "12")
        body = make_sub_issue_body_simple("C1", num, slug, title, grammar, masters["C1"], is_exam)
        n = gh_issue_create(
            title=f"C1/{num} — {title}",
            body=body,
            labels=["content", "C1", "lesson"],
        )
        if num is None:
            print(f"  ✗ C1/{num} skipped", file=sys.stderr)
            sub_numbers["C1"].append(None)
        else:
            print(f"  ✓ C1/{num} — {title}: #{n}")
            sub_numbers["C1"].append(n)
        time.sleep(0.3)

    # 3) Write the master→sub mapping to a file for later use
    out = Path("scripts/.issue_map.json")
    out.write_text(json.dumps({
        "masters": masters,
        "subs": sub_numbers,
    }, indent=2))
    print(f"\nMap written to {out}")
    print(f"Masters: {masters}")
    print(f"Total sub-issues: {sum(len(v) for v in sub_numbers.values())}")


if __name__ == "__main__":
    main()
