<script lang="ts">
  import type { ExerciseUnion } from '@core/content/types';
  import type { ExerciseScore } from '@core/engine/scoring';
  import type { Block } from '@core/content/types';
  import { aggregateLesson, type LessonScore } from '@core/engine/scoring';
  import { progress } from '@core/index';
  import ExerciseShell from './ExerciseShell.svelte';

  let {
    exercises,
    lessonId,
    audioDir,
  }: {
    exercises: ExerciseUnion[];
    lessonId: string;
    audioDir: string;
  } = $props();

  let graded = $state(false);
  let lessonScore: LessonScore | null = $state(null);
  // Plain array — only accessed imperatively in auswerten/reset, not in templates
  let shellRefs: Array<{ check(): ReturnType<ExerciseShell['check']>; reset(): void }> = [];

  function auswerten() {
    const scores: ExerciseScore[] = [];
    for (let i = 0; i < exercises.length; i++) {
      const shell = shellRefs[i];
      if (!shell) continue;
      const results = shell.check();
      const scoreable = results.filter(r => r.scoreable);
      scores.push({
        id: exercises[i].id,
        block: exercises[i].block as Block,
        correct: scoreable.filter(r => r.correct).length,
        scoreable: scoreable.length,
      });
    }
    const score = aggregateLesson(lessonId, scores);
    progress.recordResult(lessonId, score);
    lessonScore = score;
    graded = true;
  }

  function nochmal() {
    graded = false;
    lessonScore = null;
    for (const shell of shellRefs) shell?.reset();
  }

  const pctLabel = $derived(
    lessonScore ? `${Math.round(lessonScore.pct * 100)} %` : ''
  );
</script>

<div class="block-runner">
  {#each exercises as exercise, i (exercise.id)}
    <ExerciseShell
      bind:this={shellRefs[i]}
      {exercise}
      {graded}
      {lessonId}
      {audioDir}
    />
  {/each}

  <div class="runner-footer">
    {#if !graded}
      <button type="button" class="btn-auswerten" onclick={auswerten}>
        Auswerten
      </button>
    {:else}
      <div class="score-panel">
        <div class="score-summary" class:passed={lessonScore?.passed} class:failed={lessonScore && !lessonScore.passed}>
          <span class="score-pct">{pctLabel}</span>
          <span class="score-verdict">
            {#if lessonScore?.passed}
              ✓ Bestanden
            {:else}
              ✗ Noch nicht bestanden (Ziel: 80 %)
            {/if}
          </span>
        </div>
        {#if lessonScore && lessonScore.byBlock.length > 1}
          <div class="score-by-block">
            {#each lessonScore.byBlock as b}
              <span class="block-score">Block {b.block}: {b.correct}/{b.scoreable}</span>
            {/each}
          </div>
        {/if}
        <button type="button" class="btn-reset" onclick={nochmal}>Nochmal</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .block-runner { padding-bottom: 2rem; }
  .runner-footer { margin-top: 2rem; display: flex; justify-content: flex-start; }

  .btn-auswerten {
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
  .btn-auswerten:hover { background: #1d4ed8; }

  .score-panel { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; }
  .score-summary {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.85rem 1.25rem;
    border-radius: 8px;
    border: 2px solid #e5e7eb;
    background: #f9fafb;
  }
  .score-summary.passed { border-color: #16a34a; background: #f0fdf4; }
  .score-summary.failed { border-color: #dc2626; background: #fef2f2; }
  .score-pct { font-size: 1.5rem; font-weight: 800; }
  .score-summary.passed .score-pct { color: #15803d; }
  .score-summary.failed .score-pct { color: #dc2626; }
  .score-verdict { font-size: 0.95rem; font-weight: 600; }
  .score-summary.passed .score-verdict { color: #15803d; }
  .score-summary.failed .score-verdict { color: #dc2626; }

  .score-by-block { display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.875rem; color: #6b7280; }

  .btn-reset {
    align-self: flex-start;
    padding: 0.45rem 1.25rem;
    background: #f3f4f6;
    border: 1.5px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.1s;
  }
  .btn-reset:hover { background: #e5e7eb; }
</style>
