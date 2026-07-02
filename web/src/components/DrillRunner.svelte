<script lang="ts">
  import { onMount } from 'svelte';
  import { selectDrillSession, drillItemKey } from '@core/content/drills';
  import type { DrillItem } from '@core/content/drills';
  import { fehlerbuch } from '@core/index';
  import ExerciseShell from './ExerciseShell.svelte';

  // No session persistence — mirrors FehlerbuchReview.svelte's "always rebuilds
  // fresh" precedent, since a cross-lesson drill session has no natural "resume
  // where I left off" semantics.
  let { items, sessionSize = 10 }: { items: DrillItem[]; sessionSize?: number } = $props();

  let mounted = $state(false);
  let session: DrillItem[] = $state([]);
  let position = $state(0);
  let graded = $state(false);
  let shellRef: { check(): ReturnType<ExerciseShell['check']>; reset(): void } | null = $state(null);
  let tally = $state({ correct: 0, scoreable: 0 });

  function load(): void {
    session = selectDrillSession(items, sessionSize);
    position = 0;
    graded = false;
    tally = { correct: 0, scoreable: 0 };
  }

  onMount(() => {
    load();
    mounted = true;
  });

  const total = $derived(session.length);
  const finished = $derived(mounted && total > 0 && position >= total);
  const current = $derived(!finished ? session[position] : undefined);

  // "Prüfen" — immediate per-item feedback, not BlockRunner's batch-everything flow
  // (this session's established pill-mode UX: flashcards, deep-review, Fehlerbuch).
  function check(): void {
    if (!current || !shellRef) return;
    const results = shellRef.check();
    const scoreable = results.filter(r => r.scoreable);
    fehlerbuch.captureExerciseResults(current.lessonId, current.exercise, scoreable);
    tally = {
      correct: tally.correct + scoreable.filter(r => r.correct).length,
      scoreable: tally.scoreable + scoreable.length,
    };
    graded = true;
    // Deliberately never calls progress.recordResult — a drill session spans
    // multiple real lessons, so there is no single lessonId it could correctly
    // attribute progress to without corrupting a real lesson's tracked progress.
  }

  function next(): void {
    position += 1;
    graded = false;
  }
</script>

<div class="drill-runner">
  {#if !mounted}
    <p class="status">Lade …</p>
  {:else if total === 0}
    <p class="status">Für diese Fertigkeit gibt es noch keine Übungen.</p>
  {:else if finished}
    <div class="summary">
      <h2>Fertig! 🎉</h2>
      <p class="summary-count">{tally.correct} / {tally.scoreable} richtig</p>
      <button type="button" class="btn-restart" onclick={load}>Nochmal</button>
    </div>
  {:else if current}
    <p class="progress">{position + 1} / {total}</p>
    <p class="context">{current.lessonId}</p>

    {#key drillItemKey(current)}
      <ExerciseShell
        bind:this={shellRef}
        exercise={current.exercise}
        {graded}
        lessonId={current.lessonId}
        audioDir={current.audioDir}
      />
    {/key}

    <div class="runner-footer">
      {#if !graded}
        <button type="button" class="btn-check" onclick={check}>Prüfen</button>
      {:else}
        <button type="button" class="btn-next" onclick={next}>Weiter →</button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .drill-runner { display: flex; flex-direction: column; gap: 1rem; padding: 1rem 0 2rem; }
  .status { color: #6b7280; }
  .progress { color: #6b7280; font-size: 0.875rem; margin: 0; }
  .context { color: #9ca3af; font-size: 0.8rem; margin: 0; }

  .runner-footer { margin-top: 1rem; }
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

  .summary { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; text-align: center; }
  .summary-count { color: #374151; margin: 0; }
  .btn-restart {
    margin-top: 0.5rem;
    padding: 0.6rem 1.4rem;
    border-radius: 8px;
    border: none;
    background: #2563eb;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
  }
  .btn-restart:hover { background: #1d4ed8; }
</style>
