<script lang="ts">
  import type { ExerciseUnion } from '@core/content/types';
  import type { ExerciseScore } from '@core/engine/scoring';
  import { aggregateLesson, PASS_THRESHOLD } from '@core/engine/scoring';
  import { progress } from '@core/index';
  import ExerciseShell from './ExerciseShell.svelte';

  // Lesson exercise page (#470). Each exercise is checked on its own ("Prüfen" in
  // ExerciseShell); this runner only aggregates. Untouched exercises are "not yet
  // checked", never wrong, and a lesson result is recorded only once every scored
  // exercise has been checked — one perfect exercise must not pass the lesson.

  let {
    exercises,
    lessonId,
    audioDir,
    level,
  }: {
    exercises: ExerciseUnion[];
    lessonId: string;
    audioDir: string;
    level?: string;
  } = $props();

  const scoredIds = exercises
    .filter(e => e.type !== 'free-write' && e.type !== 'speaking-prompt')
    .map(e => e.id);

  let checks: Record<string, ExerciseScore> = $state({});
  let shellRefs: Array<{ checkIfAttempted(): boolean; resetAll(): void }> = [];

  const checked = $derived(scoredIds.filter(id => checks[id]).map(id => checks[id]));
  const summary = $derived(checked.length ? aggregateLesson(lessonId, checked) : null);
  const complete = $derived(checked.length === scoredIds.length && scoredIds.length > 0);
  const pctLabel = $derived(summary ? `${Math.round(summary.pct * 100)} %` : '');

  function onChecked(id: string, score: ExerciseScore | null): void {
    const next = { ...checks };
    if (score) next[id] = score; else delete next[id];
    checks = next;
    const ids = scoredIds.filter(x => next[x]);
    if (score && ids.length === scoredIds.length) {
      progress.recordResult(lessonId, aggregateLesson(lessonId, ids.map(x => next[x])));
    }
  }

  function checkAll(): void {
    for (const shell of shellRefs) shell?.checkIfAttempted();
  }

  function resetAll(): void {
    for (const shell of shellRefs) shell?.resetAll();
  }
</script>

<div class="block-runner">
  {#each exercises as exercise, i (exercise.id)}
    <ExerciseShell
      bind:this={shellRefs[i]}
      {exercise}
      {lessonId}
      {audioDir}
      {level}
      standalone
      onChecked={score => onChecked(exercise.id, score)}
    />
  {/each}

  <div class="runner-footer" role="status">
    <div class="summary" class:passed={complete && summary?.passed} class:failed={complete && summary && !summary.passed}>
      <span class="summary-count">{checked.length} / {scoredIds.length} Übungen geprüft</span>
      {#if summary}
        <span class="summary-pct">{pctLabel} richtig</span>
      {/if}
      {#if complete && summary}
        <span class="summary-verdict">
          {summary.passed ? '✓ Bestanden' : `✗ Noch nicht bestanden (Ziel: ${PASS_THRESHOLD * 100} %)`}
        </span>
      {/if}
    </div>
    {#if summary && summary.byBlock.length > 1}
      <div class="by-block">
        {#each summary.byBlock as b}
          <span>Block {b.block}: {b.correct}/{b.scoreable}</span>
        {/each}
      </div>
    {/if}
    <div class="actions">
      {#if !complete}
        <button type="button" class="btn btn-primary" onclick={checkAll}>Alle bearbeiteten prüfen</button>
      {/if}
      <button type="button" class="btn btn-ghost" onclick={resetAll}>Alles zurücksetzen</button>
    </div>
  </div>
</div>

<style>
  .block-runner { padding-bottom: 2rem; }
  .runner-footer {
    position: sticky;
    bottom: 0;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin-top: var(--space-6);
    padding: var(--space-4);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--surface);
    box-shadow: var(--shadow);
  }
  .summary { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--space-4); }
  .summary-count { color: var(--text-muted); }
  .summary-pct { font-size: var(--text-xl); font-weight: 800; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .summary-verdict { font-weight: 600; }
  .summary.passed .summary-pct, .summary.passed .summary-verdict { color: var(--ok-fg); }
  .summary.failed .summary-pct, .summary.failed .summary-verdict { color: var(--err-fg); }
  .by-block { display: flex; flex-wrap: wrap; gap: var(--space-4); font-size: var(--text-sm); color: var(--text-subtle); }
  .actions { display: flex; flex-wrap: wrap; gap: var(--space-3); }
</style>
