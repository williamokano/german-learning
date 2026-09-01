<script lang="ts">
  import type { PathNode } from '@core/content/path';
  import { path } from '@core/index';

  let { manifest, base }: {
    manifest: PathNode[];
    base: string;
  } = $props();

  type Level = 'A1' | 'A2' | 'B1' | 'B2';
  type Stage = Level; // the level currently being tested

  interface Question {
    q: string;
    options: string[];
    answer: number; // index into options
  }

  const QUESTIONS: Record<Level, Question[]> = {
    A1: [
      { q: 'Ich ___ Anna.', options: ['heißt', 'heiße', 'heißen', 'heißt du'], answer: 1 },
      { q: 'Das ist ___ Frau.', options: ['ein', 'eine', 'einen', 'einem'], answer: 1 },
      { q: 'Wo ___ du?', options: ['wohne', 'wohnst', 'wohnt', 'wohnen'], answer: 1 },
    ],
    A2: [
      { q: 'Ich ___ gestern ins Kino gegangen.', options: ['habe', 'bin', 'hat', 'ist'], answer: 1 },
      { q: 'Er gibt ___ Kind ein Geschenk.', options: ['das', 'dem', 'den', 'der'], answer: 1 },
      { q: 'Wir ___ jeden Tag Deutsch.', options: ['lerne', 'lernst', 'lernen', 'lernt'], answer: 2 },
    ],
    B1: [
      { q: 'Die Fenster ___ jeden Morgen geputzt.', options: ['werden', 'sind', 'wird', 'haben'], answer: 0 },
      { q: 'Ich weiß nicht, ___ er heute kommt.', options: ['dass', 'ob', 'wenn', 'weil'], answer: 1 },
      { q: 'Das ist die Frau, ___ mir geholfen hat.', options: ['der', 'die', 'das', 'den'], answer: 1 },
    ],
    B2: [
      { q: 'Wenn ich mehr Zeit ___, würde ich öfter Sport machen.', options: ['habe', 'hatte', 'hätte', 'haben würde'], answer: 2 },
      { q: '___ des schlechten Wetters fand das Fest trotzdem statt.', options: ['Wegen', 'Trotz', 'Während', 'Statt'], answer: 1 },
      { q: 'Er behauptete, er ___ die Wahrheit gesagt.', options: ['hat', 'habe', 'hätte', 'hatte'], answer: 1 },
    ],
  };

  const LEVEL_LABEL: Record<Level | 'C1', string> = {
    A1: 'A1 · Anfänger', A2: 'A2 · Grundlagen', B1: 'B1 · Mittelstufe', B2: 'B2 · Selbstständig', C1: 'C1 · Fachkundig',
  };

  type Phase = 'intro' | 'quiz' | 'result';
  let phase: Phase = $state('intro');
  let stage: Stage = $state('A2'); // staircase starts in the middle
  let qIndex = $state(0);
  let correctCount = $state(0);
  let selected: number | null = $state(null);
  let recommendation: Level | 'C1' | null = $state(null);
  let jumped = $state(false);

  function start(): void {
    phase = 'quiz';
    stage = 'A2';
    qIndex = 0;
    correctCount = 0;
    selected = null;
    recommendation = null;
    jumped = false;
  }

  function choose(i: number): void {
    if (selected !== null) return; // one answer per question
    selected = i;
    if (i === QUESTIONS[stage][qIndex].answer) correctCount++;
    setTimeout(next, 550);
  }

  function next(): void {
    if (qIndex + 1 < QUESTIONS[stage].length) {
      qIndex++;
      selected = null;
      return;
    }
    finishStage();
  }

  // Staircase: A2 is the entry stage. Passing (≥2/3) climbs a level; failing drops
  // to test the floor (A1) once, or ends the test at the level that first stumped
  // the learner — that's where they still have gaps, so that's where they start.
  function finishStage(): void {
    const passed = correctCount >= 2;
    if (stage === 'A2') {
      if (passed) { advanceTo('B1'); } else { advanceTo('A1'); }
    } else if (stage === 'B1') {
      if (passed) { advanceTo('B2'); } else { finish('B1'); }
    } else if (stage === 'B2') {
      finish(passed ? 'C1' : 'B2');
    } else if (stage === 'A1') {
      finish(passed ? 'A2' : 'A1');
    }
  }

  function advanceTo(newStage: Stage): void {
    stage = newStage;
    qIndex = 0;
    correctCount = 0;
    selected = null;
  }

  function finish(rec: Level | 'C1'): void {
    recommendation = rec;
    phase = 'result';
  }

  // First manifest node at or after `level` — the node the "Los geht's" button
  // routes to and marks everything before as complete via path.markComplete.
  const targetNode = $derived.by<PathNode | null>(() => {
    if (!recommendation) return null;
    const idx = manifest.findIndex(n => n.level === recommendation);
    return idx >= 0 ? manifest[idx] : null;
  });
  const targetIndex = $derived(targetNode ? manifest.findIndex(n => n.id === targetNode.id) : -1);
  const targetHref = $derived(
    targetNode ? `${base}/${targetNode.level.toLowerCase()}/${targetNode.slug}/` : `${base}/`
  );

  function jumpToRecommendation(): void {
    if (targetIndex < 0) return;
    for (let i = 0; i < targetIndex; i++) path.markComplete(manifest[i].id);
    jumped = true;
  }

  const progressLabel = $derived(`Frage ${qIndex + 1} von ${QUESTIONS[stage].length} — Niveau ${stage}`);
</script>

<div class="placement-quiz card">
  {#if phase === 'intro'}
    <div class="intro">
      <p>
        6–9 kurze Fragen zu Grammatik, die du aus dem Kurs kennst (Perfekt, Kasus,
        Passiv, Konjunktiv II …). Der Test passt sich an: Antwortest du richtig,
        wird es schwerer; antwortest du falsch, wird es leichter. Am Ende bekommst
        du eine Empfehlung, wo du einsteigen solltest.
      </p>
      <p class="hint">Kein Zeitlimit, keine Bewertung — nur eine Orientierung.</p>
      <button type="button" class="btn btn-primary" onclick={start}>Test starten</button>
    </div>
  {:else if phase === 'quiz'}
    <div class="quiz">
      <p class="progress">{progressLabel}</p>
      <p class="question">{QUESTIONS[stage][qIndex].q}</p>
      <div class="options">
        {#each QUESTIONS[stage][qIndex].options as opt, i}
          <button
            type="button"
            class="option"
            class:correct={selected !== null && i === QUESTIONS[stage][qIndex].answer}
            class:wrong={selected === i && i !== QUESTIONS[stage][qIndex].answer}
            disabled={selected !== null}
            onclick={() => choose(i)}
          >
            {opt}
          </button>
        {/each}
      </div>
    </div>
  {:else if phase === 'result'}
    <div class="result">
      {#if !jumped}
        <p class="result-lead">Empfehlung:</p>
        <p class="result-level">{LEVEL_LABEL[recommendation ?? 'A1']}</p>
        {#if targetNode}
          <p class="result-detail">Start bei: <strong>{targetNode.title}</strong> ({targetNode.lessonId})</p>
        {/if}
        <p class="result-note">
          „Los geht's" markiert alle Lektionen davor als erledigt in deinem Lernpfad
          und bringt dich direkt zur Startlektion. Das überschreibt keinen
          bestehenden Fortschritt danach — falls du schon weiter warst, bleibt das
          erhalten.
        </p>
        <div class="result-actions">
          <button type="button" class="btn btn-primary" onclick={jumpToRecommendation}>
            Los geht's — hierher springen
          </button>
          <button type="button" class="btn btn-ghost" onclick={start}>Test wiederholen</button>
        </div>
      {:else}
        <p class="result-lead">Fertig!</p>
        <p class="result-detail">
          Dein Lernpfad beginnt jetzt bei <strong>{targetNode?.title}</strong>.
        </p>
        <div class="result-actions">
          <a class="btn btn-primary" href={targetHref}>Zur Lektion →</a>
          <a class="btn btn-secondary" href={`${base}/path/`}>Lernpfad ansehen</a>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .placement-quiz {
    padding: var(--space-6);
    max-width: 40rem;
  }
  .intro, .quiz, .result { display: flex; flex-direction: column; gap: var(--space-4); }
  .intro p { margin: 0; color: var(--text-muted); line-height: 1.6; }
  .hint { font-size: var(--text-sm); color: var(--text-faint); font-style: italic; }

  .progress { margin: 0; font-size: var(--text-sm); color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; }
  .question { margin: 0; font-size: var(--text-lg); font-weight: 650; color: var(--text); }
  .options { display: flex; flex-direction: column; gap: var(--space-2); }
  .option {
    text-align: left;
    padding: 0.65rem 1rem;
    font: inherit;
    font-size: var(--text-base);
    border: 1.5px solid var(--border-strong, #cbd5e1);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
    transition: background var(--transition), border-color var(--transition);
  }
  .option:hover:not(:disabled) { background: var(--surface-hover); border-color: var(--brand-400); }
  .option:disabled { cursor: default; }
  .option.correct { background: var(--ok-bg, #f0fdf4); border-color: var(--ok-border, #86efac); color: var(--ok-fg, #15803d); font-weight: 650; }
  .option.wrong { background: var(--danger-bg, #fef2f2); border-color: var(--danger-border, #fecaca); color: var(--danger-fg, #b91c1c); }

  .result-lead { margin: 0; font-size: var(--text-sm); color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; }
  .result-level { margin: 0; font-size: var(--text-2xl); font-weight: 800; color: var(--brand-700); }
  .result-detail { margin: 0; color: var(--text-muted); }
  .result-note { margin: 0; font-size: var(--text-sm); color: var(--text-faint); line-height: 1.55; }
  .result-actions { display: flex; gap: var(--space-3); flex-wrap: wrap; }
</style>
