<script lang="ts">
  import { onMount } from 'svelte';
  import type { ItemResult } from '@core/content/types';
  import type { FreeWriteExercise } from '@core/content/types';
  import { progress } from '@core/index';
  import PassageBody from '../PassageBody.svelte';
  import { parsePassage } from '@core/content/instructions';

  let { exercise, graded, lessonId, level }: {
    exercise: FreeWriteExercise;
    graded: boolean;
    lessonId: string;
    level?: string;
  } = $props();

  let text = $state('');
  let mounted = false;
  let copyState: 'idle' | 'copied' | 'failed' = $state('idle');
  let showHelp = $state(false);
  let copyTimer: ReturnType<typeof setTimeout> | undefined;

  onMount(() => {
    const saved = progress.loadAnswers(lessonId, exercise.id) as { text?: string } | null;
    if (saved?.text) text = saved.text;
    mounted = true;
  });

  $effect(() => { if (mounted) progress.saveAnswers(lessonId, exercise.id, { text }); });

  export function check(): ItemResult[] {
    return [{ ref: '0', correct: true, given: text, expected: exercise.model ?? '', scoreable: false }];
  }

  export function reset(): void {
    text = '';
    progress.clearAnswers(lessonId, exercise.id);
  }

  // Builds a self-contained grading prompt for an external LLM (ChatGPT, Claude, …).
  // Deliberately instructs the model to check the given criteria, not to rewrite
  // or second-guess the learner's approach — grading, not ghost-writing.
  function buildGradingPrompt(): string {
    const levelLabel = level ? `Niveau ${level} (GER)` : 'unbekanntes Niveau';
    const lines: string[] = [
      `Du bist eine erfahrene Deutschlehrkraft und bewertest einen Schülertext, ${levelLabel}.`,
      '',
      'AUFGABE, die die/der Lernende bekommen hat:',
      exercise.prompt,
    ];
    if (exercise.stimulus) {
      lines.push('', 'AUSGANGSTEXT / KONTEXT (worauf der Text reagiert):', exercise.stimulus);
    }
    if (exercise.use && exercise.use.length > 0) {
      lines.push('', 'Vorgaben, die im Text vorkommen sollten:', ...exercise.use.map(u => `- ${u}`));
    }
    lines.push(
      '',
      'BEWERTUNGSKRITERIEN — prüfe NUR, ob der vorliegende Text diese Punkte erfüllt.',
      'Schlage NICHT vor, was der Text stattdessen hätte sagen sollen, und schreib keine',
      'eigene Musterlösung — bewerte ausschließlich, ob DIESER Text seine Aufgabe inhaltlich',
      'sinnvoll, stimmig und im passenden Register erfüllt:',
      ...(exercise.selfCheck && exercise.selfCheck.length > 0
        ? exercise.selfCheck.map(c => `- ${c}`)
        : [
            '- Erfüllt der Text die oben genannte Aufgabe inhaltlich vollständig?',
            '- Ist der Text in sich stimmig und bleibt er beim Thema?',
          ]),
      '',
      'Gib mir:',
      '1. Für jedes Kriterium: erfüllt / teilweise / nicht erfüllt, mit einem kurzen Grund.',
      '2. Grammatik- und Wortschatzkorrekturen als Liste: "Original" → "Korrektur" (kurze Begründung).',
      '3. Eine Gesamteinschätzung in 2–3 Sätzen: Ist der Text für dieses Niveau angemessen?',
      'Antworte auf Deutsch, in einfacher, klarer Sprache.',
      '',
      'TEXT DER LERNENDEN / DES LERNENDEN:',
      '"""',
      text,
      '"""',
    );
    return lines.join('\n');
  }

  async function copyPrompt(): Promise<void> {
    clearTimeout(copyTimer);
    try {
      await navigator.clipboard.writeText(buildGradingPrompt());
      copyState = 'copied';
    } catch {
      copyState = 'failed';
    }
    copyTimer = setTimeout(() => { copyState = 'idle'; }, 2500);
  }

  const helpHref = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/hilfe/ki-bewertung/`;
</script>

<div class="free-write">
  {#if exercise.stimulus}
    <blockquote class="stimulus">
      <PassageBody paragraphs={parsePassage(exercise.stimulus)} />
    </blockquote>
  {/if}

  <p class="prompt">{exercise.prompt}</p>

  {#if exercise.use && exercise.use.length > 0}
    <ul class="use-list">
      {#each exercise.use as item}<li>{item}</li>{/each}
    </ul>
  {/if}

  <textarea
    class="answer-area"
    rows={6}
    bind:value={text}
    disabled={graded}
    placeholder="Schreib deine Antwort hier…"
  ></textarea>

  {#if graded}
    {#if exercise.selfCheck && exercise.selfCheck.length > 0}
      <div class="self-check">
        <p class="self-check-title">✅ Self-check:</p>
        <ul>
          {#each exercise.selfCheck as q}<li>{q}</li>{/each}
        </ul>
      </div>
    {/if}
    {#if exercise.model}
      <details class="model-spoiler">
        <summary>📄 Musterantwort (erst nach dem Schreiben öffnen!)</summary>
        <blockquote class="model">
          <PassageBody paragraphs={parsePassage(exercise.model)} />
        </blockquote>
      </details>
    {/if}
  {/if}

  <div class="ai-grade">
    <div class="ai-grade-row">
      <button
        type="button"
        class="btn-ai-copy"
        class:copied={copyState === 'copied'}
        disabled={!text.trim()}
        onclick={copyPrompt}
      >
        {#if copyState === 'copied'}✅ Kopiert!{:else}🤖 Mit KI bewerten lassen{/if}
      </button>
      <button
        type="button"
        class="btn-help"
        aria-expanded={showHelp}
        aria-label="Hilfe: Wie funktioniert die KI-Bewertung? / How does AI grading work?"
        onclick={() => showHelp = !showHelp}
      >?</button>
    </div>
    {#if copyState === 'failed'}
      <p class="copy-error">Kopieren nicht möglich — bitte den Text unten manuell markieren und kopieren.</p>
    {/if}

    {#if showHelp}
      <div class="ai-help">
        <p class="ai-help-title">So geht's — How it works</p>
        <ol class="ai-help-steps">
          <li>
            <span class="step-icon" aria-hidden="true">🤖</span>
            <span>Klicke auf „Mit KI bewerten lassen" — der Prompt landet in der Zwischenablage.
              <em>Click "Grade with AI" — the prompt is copied to your clipboard.</em></span>
          </li>
          <li>
            <span class="step-icon" aria-hidden="true">🌐</span>
            <span>Öffne ChatGPT, Claude oder ein anderes KI-Chat-Tool in einem neuen Tab.
              <em>Open ChatGPT, Claude, or another AI chat tool in a new tab.</em></span>
          </li>
          <li>
            <span class="step-icon" aria-hidden="true">📥</span>
            <span>Füge den Text ins Chat-Feld ein (Strg+V / Cmd+V) und sende ihn ab.
              <em>Paste the text into the chat box (Ctrl+V / Cmd+V) and send it.</em></span>
          </li>
          <li>
            <span class="step-icon" aria-hidden="true">📖</span>
            <span>Lies die Rückmeldung — sie prüft nur, ob dein Text die Aufgabe erfüllt, nicht wie du ihn hättest schreiben sollen.
              <em>Read the feedback — it only checks whether your text meets the task, not how you should have written it.</em></span>
          </li>
        </ol>
        <a href={helpHref} class="ai-help-link">
          Ausführliche Anleitung mit Screenshots → / Detailed step-by-step guide with screenshots →
        </a>
      </div>
    {/if}
  </div>
</div>

<style>
  .free-write { display: flex; flex-direction: column; gap: 0.75rem; }
  /* stimulus/model carry numbered transformation drills or a sample text.
     PassageBody keeps each drill item on its own line and breaks running
     prose one thought per line — see core/content/instructions.ts. */
  .stimulus {
    margin: 0;
    padding: 0.7rem 1rem;
    border-left: 4px solid var(--brand-400, #5985fc);
    background: var(--surface-2, #f8fafc);
    color: var(--text, #0f172a);
    border-radius: 0 var(--radius, 10px) var(--radius, 10px) 0;
    line-height: 1.7;
  }
  .prompt { margin: 0; font-weight: 550; }
  .use-list {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.9rem;
    color: var(--text-muted, #475569);
  }
  .answer-area {
    width: 100%;
    padding: 0.6rem 0.8rem;
    font: inherit;
    font-size: 0.95rem;
    border: 1.5px solid var(--border-input, #b6c2d2);
    border-radius: var(--radius-sm, 6px);
    background: var(--surface, #fff);
    color: var(--text, #0f172a);
    resize: vertical;
    box-sizing: border-box;
    line-height: 1.6;
    transition: border-color 0.12s, box-shadow 0.12s;
  }
  .answer-area:focus {
    outline: none;
    border-color: var(--brand-500, #3562f6);
    box-shadow: 0 0 0 3px var(--focus-ring, rgba(53, 98, 246, 0.25));
  }
  .answer-area:disabled { background: var(--surface-2, #f8fafc); color: var(--text-muted, #475569); }
  .self-check {
    background: var(--ok-bg, #f0fdf4);
    border: 1px solid var(--ok-border, #86efac);
    border-radius: var(--radius, 10px);
    padding: 0.6rem 0.85rem;
  }
  .self-check-title {
    margin: 0 0 0.25rem;
    font-weight: 650;
    color: var(--ok-fg, #15803d);
    font-size: 0.9rem;
  }
  .self-check ul { margin: 0; padding-left: 1.25rem; font-size: 0.875rem; }
  .model-spoiler { font-size: 0.9rem; }
  .model-spoiler summary {
    cursor: pointer;
    color: var(--text-muted, #475569);
    padding: 0.25rem 0;
  }
  .model {
    margin: 0.5rem 0 0;
    padding: 0.7rem 1rem;
    border-left: 4px solid var(--ok-border, #86efac);
    background: var(--surface-2, #f8fafc);
    color: var(--text, #0f172a);
    border-radius: 0 var(--radius, 10px) var(--radius, 10px) 0;
    line-height: 1.7;
  }

  .ai-grade { display: flex; flex-direction: column; gap: 0.5rem; }
  .ai-grade-row { display: flex; align-items: center; gap: 0.5rem; }
  .btn-ai-copy {
    padding: 0.5rem 0.9rem;
    font: inherit;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--brand-700, #1d3fb0);
    background: var(--brand-50, #eef2ff);
    border: 1.5px solid var(--brand-300, #a8bcfb);
    border-radius: var(--radius-sm, 6px);
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s;
  }
  .btn-ai-copy:hover:not(:disabled) { background: var(--brand-100, #e0e7ff); }
  .btn-ai-copy:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-ai-copy.copied {
    color: var(--ok-fg, #15803d);
    background: var(--ok-bg, #f0fdf4);
    border-color: var(--ok-border, #86efac);
  }
  .btn-help {
    display: grid;
    place-items: center;
    width: 1.9rem;
    height: 1.9rem;
    flex-shrink: 0;
    padding: 0;
    font: inherit;
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--text-muted, #475569);
    background: var(--surface-2, #f8fafc);
    border: 1.5px solid var(--border, #e2e8f0);
    border-radius: 999px;
    cursor: pointer;
  }
  .btn-help:hover { background: var(--surface-3, #eef2f7); }
  .copy-error { margin: 0; font-size: 0.8rem; color: var(--danger-fg, #b91c1c); }

  .ai-help {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 0.75rem 1rem;
    background: var(--info-bg, #eef4ff);
    border: 1px solid var(--info-border, #bcd0ff);
    border-radius: var(--radius, 10px);
    font-size: 0.875rem;
  }
  .ai-help-title { margin: 0; font-weight: 700; color: var(--info-fg, #1a34d8); }
  .ai-help-steps { margin: 0; padding-left: 0; list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
  .ai-help-steps li { display: flex; align-items: flex-start; gap: 0.55rem; }
  .step-icon { font-size: 1.1rem; line-height: 1.4; flex-shrink: 0; }
  .ai-help-steps em { display: block; font-style: italic; color: var(--text-muted, #475569); font-size: 0.85em; margin-top: 0.1rem; }
  .ai-help-link { align-self: flex-start; font-size: 0.85rem; font-weight: 600; color: var(--brand-700, #1d3fb0); }
  .ai-help-link:hover { text-decoration: underline; }
</style>
