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
    const sel = answers[String(gi)] ?? null;
    if (!graded) return sel === ii ? 'selected' : '';
    if (sel === ii && ii === group.odd) return 'graded-correct'; // picked + right
    if (sel === ii && ii !== group.odd) return 'graded-wrong';   // picked + wrong
    if (ii === group.odd) return 'graded-reveal';                // right but not picked
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
  .group-num {
    font-weight: 600;
    min-width: 1.5rem;
    padding-top: 0.35rem;
    color: var(--text-subtle, #64748b);
    font-variant-numeric: tabular-nums;
  }
  .chips { display: flex; flex-wrap: wrap; gap: 0.4rem; flex: 1; }
  .chip {
    padding: 0.35rem 0.75rem;
    border: 1.5px solid var(--border-strong, #cbd5e1);
    border-radius: 999px;
    background: var(--surface, #fff);
    color: var(--text, #0f172a);
    cursor: pointer;
    font: inherit;
    font-size: 0.9rem;
    transition: border-color 0.12s, background 0.12s, color 0.12s;
  }
  .chip:hover:not(:disabled) {
    border-color: var(--brand-500, #3562f6);
    background: var(--brand-50, #eef4ff);
    color: var(--brand-700, #1a34d8);
  }
  .chip:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--focus-ring, rgba(53, 98, 246, 0.25));
  }
  .chip:disabled { cursor: default; }
  .chip.selected,
  .chip.selected:hover:not(:disabled) {
    border-color: var(--brand-500, #3562f6);
    background: var(--brand-500, #3562f6);
    color: var(--text-invert, #fff);
    font-weight: 600;
  }
  .chip.graded-correct {
    border-color: var(--ok-border, #86efac);
    background: var(--ok-bg, #f0fdf4);
    color: var(--ok-fg, #15803d);
    font-weight: 700;
  }
  .chip.graded-wrong {
    border-color: var(--err-border, #fca5a5);
    background: var(--err-bg, #fef2f2);
    color: var(--err-fg, #b91c1c);
  }
  /* The odd one out the learner did not pick — dashed, so it reads as
     "this was it" rather than "you got this". */
  .chip.graded-reveal {
    border: 2px dashed var(--ok-fg, #15803d);
    background: var(--ok-bg, #f0fdf4);
    color: var(--ok-fg, #15803d);
  }
  .feedback {
    width: 100%;
    padding-left: 1.5rem;
    font-size: var(--text-base, 0.9375rem);
    color: var(--text-muted, #475569);
  }
  .ok  { color: var(--ok-fg, #15803d); font-weight: 700; }
  .err { color: var(--err-fg, #b91c1c); font-weight: 600; }
  .why { color: var(--text-muted, #475569); }
</style>
