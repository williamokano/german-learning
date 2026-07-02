<script lang="ts">
  import type { DrillItem } from '@core/content/drills';
  import { fehlerbuch } from '@core/index';
  import ExerciseShell from './ExerciseShell.svelte';

  // Single-item drill display for the F9 Daily Mix orchestrator (issue #344).
  // Extracted from DrillRunner.svelte's render block — single item + an advance
  // callback (the orchestrator manages the outer position counter).

  let { item, onAdvance }:
    { item: DrillItem; onAdvance: (correct: number, scoreable: number) => void; } = $props();

  let graded = $state(false);
  let correct = $state(false);
  let scoreable = $state(false);
  let shellRef = $state<{ check(): ReturnType<ExerciseShell['check']>; reset(): void } | null>(null);

  function check(): void {
    if (!shellRef) return;
    const results = shellRef.check();
    const scoreableResults = results.filter(r => r.scoreable);
    fehlerbuch.captureExerciseResults(item.lessonId, item.exercise, scoreableResults);
    scoreable = scoreableResults.length;
    correct = scoreableResults.filter(r => r.correct).length;
    graded = true;
  }

  function next(): void {
    // Pass THIS item's tally back so the orchestrator accumulates correctly.
    // (Without this, passing the running total from outside would double-count.)
    const itemCorrect = correct;
    const itemScoreable = scoreable;
    graded = false;
    correct = false;
    scoreable = false;
    shellRef?.reset();
    onAdvance(itemCorrect, itemScoreable);
  }
</script>

<div class="drill-item-runner">
  <p class="context">{item.lessonId}</p>
  <ExerciseShell
    bind:this={shellRef}
    exercise={item.exercise}
    {graded}
    lessonId={item.lessonId}
    audioDir={item.audioDir}
  />
  <div class="runner-footer">
    {#if !graded}
      <button type="button" class="btn-check" onclick={check}>Prüfen</button>
    {:else}
      <div class="feedback">
        <span class="feedback-count">{correct} / {scoreable} richtig</span>
        <button type="button" class="btn-next" onclick={next}>Weiter →</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .drill-item-runner { display: flex; flex-direction: column; gap: 1rem; padding: 1rem 0 2rem; }
  .context { color: #9ca3af; font-size: 0.8rem; margin: 0; }

  .runner-footer { margin-top: 1rem; display: flex; justify-content: center; }
  .feedback { display: flex; align-items: center; gap: 1rem; }
  .feedback-count { color: #374151; font-size: 0.95rem; font-weight: 500; }

  .btn-check, .btn-next {
    padding: 0.6rem 1.75rem;
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.12s;
  }
  .btn-check:hover, .btn-next:hover { background: #1d4ed8; }
</style>
