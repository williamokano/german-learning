<script lang="ts">
  import { onMount } from 'svelte';
  import type { ItemResult } from '@core/content/types';
  import type { OddOneOutExercise } from '@core/content/types';
  import { progress } from '@core/index';

  let { exercise, graded, results, lessonId }: {
    exercise: OddOneOutExercise;
    graded: boolean;
    results: ItemResult[];
    lessonId: string;
  } = $props();

  // { [groupIndex]: selected item index | null }
  let answers: Record<string, number | null> = $state({});
  let mounted = false;

  onMount(() => {
    const saved = progress.loadAnswers(lessonId, exercise.id) as Record<string, number | null> | null;
    if (saved && typeof saved === 'object') answers = saved;
    mounted = true;
  });

  $effect(() => { if (mounted) progress.saveAnswers(lessonId, exercise.id, { ...answers }); });

  export function check(): ItemResult[] {
    return exercise.groups.map((group, gi) => {
      const sel = answers[String(gi)] ?? null;
      return {
        ref: String(gi),
        correct: sel === group.odd,
        given: sel !== null ? group.items[sel] : '',
        expected: group.items[group.odd],
        scoreable: true,
      };
    });
  }

  export function reset(): void {
    answers = {};
    progress.clearAnswers(lessonId, exercise.id);
  }

  function toggle(gi: number, ii: number) {
    if (graded) return;
    const k = String(gi);
    answers = { ...answers, [k]: answers[k] === ii ? null : ii };
  }

  function resultFor(gi: number): ItemResult | undefined {
    return results.find(r => r.ref === String(gi));
  }

  function chipClass(gi: number, ii: number): string {
    const group = exercise.groups[gi];
    if (!graded) return answers[String(gi)] === ii ? 'selected' : '';
    if (ii === group.odd) return 'graded-correct';
    if (answers[String(gi)] === ii) return 'graded-wrong';
    return '';
  }
</script>

<div class="odd-one-out">
  {#each exercise.groups as group, gi}
    {@const r = resultFor(gi)}
    <div class="group">
      <span class="group-num">{gi + 1}.</span>
      <div class="chips">
        {#each group.items as item, ii}
          <button
            type="button"
            class="chip {chipClass(gi, ii)}"
            onclick={() => toggle(gi, ii)}
            disabled={graded}
          >{item}</button>
        {/each}
      </div>
      {#if graded && r != null}
        <div class="feedback">
          {#if r.correct}
            <span class="ok">✓</span>
          {:else}
            <span class="err">✗ → <strong>{r.expected}</strong></span>
          {/if}
          {#if group.why}<span class="why"> — {group.why}</span>{/if}
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .odd-one-out { display: flex; flex-direction: column; gap: 1rem; }
  .group { display: flex; align-items: flex-start; flex-wrap: wrap; gap: 0.4rem; }
  .group-num { font-weight: 600; min-width: 1.5rem; padding-top: 0.35rem; }
  .chips { display: flex; flex-wrap: wrap; gap: 0.4rem; flex: 1; }
  .chip {
    padding: 0.35rem 0.75rem;
    border: 1.5px solid #d1d5db;
    border-radius: 20px;
    background: #fff;
    cursor: pointer;
    font: inherit;
    font-size: 0.9rem;
    transition: all 0.1s;
  }
  .chip:hover:not(:disabled) { border-color: #2563eb; background: #eff6ff; }
  .chip:disabled { cursor: default; }
  .chip.selected { border-color: #2563eb; background: #eff6ff; font-weight: 600; }
  .chip.graded-correct { border-color: #16a34a; background: #dcfce7; font-weight: 700; }
  .chip.graded-wrong   { border-color: #dc2626; background: #fee2e2; }
  .feedback { width: 100%; padding-left: 1.5rem; font-size: 0.875rem; }
  .ok  { color: #16a34a; font-weight: 700; }
  .err { color: #dc2626; font-weight: 600; }
  .why { color: #4b5563; }
</style>
