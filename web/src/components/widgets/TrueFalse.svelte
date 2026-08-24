<script lang="ts">
  import { onMount } from 'svelte';
  import type { ItemResult } from '@core/content/types';
  import type { TrueFalseExercise } from '@core/content/types';
  import { progress } from '@core/index';

  let {
    exercise,
    graded,
    results,
    lessonId,
    audioDir = '',
  }: {
    exercise: TrueFalseExercise;
    graded: boolean;
    results: ItemResult[];
    lessonId: string;
    audioDir?: string;
  } = $props();

  // answers: { [itemIndex]: true | false | null }
  let answers: Record<string, boolean | null> = $state({});
  let mounted = false;

  const pos = $derived(exercise.positiveLabel ?? 'Richtig');
  const neg = $derived(exercise.negativeLabel ?? 'Falsch');

  onMount(() => {
    const saved = progress.loadAnswers(lessonId, exercise.id) as Record<string, boolean | null> | null;
    if (saved && typeof saved === 'object') answers = saved;
    mounted = true;
  });

  $effect(() => {
    if (mounted) {
      progress.saveAnswers(lessonId, exercise.id, { ...answers });
    }
  });

  export function check(): ItemResult[] {
    return exercise.items.map((item, i) => {
      const selected = answers[String(i)] ?? null;
      const correct = selected === item.answer;
      return {
        ref: String(i),
        correct: selected != null && correct,
        given: selected == null ? '' : (selected ? pos : neg),
        expected: item.answer ? pos : neg,
        scoreable: selected != null,
      };
    });
  }

  export function reset(): void {
    answers = {};
    progress.clearAnswers(lessonId, exercise.id);
  }

  function resultFor(index: number): ItemResult | undefined {
    return results.find(r => r.ref === String(index));
  }

  function btnClass(index: number, value: boolean): string {
    const sel = answers[String(index)] ?? null;
    if (!graded) return sel === value ? 'active' : '';
    const item = exercise.items[index];
    if (sel === value && value === item.answer) return 'graded-correct'; // picked + right
    if (sel === value && value !== item.answer) return 'graded-wrong';   // picked + wrong
    if (value === item.answer) return 'graded-reveal';                   // right but not picked
    return '';
  }
</script>

<div class="true-false">
  {#each exercise.items as item, i}
    {@const r = resultFor(i)}
    <div class="item" class:has-audio={!!item.audio}>
      {#if item.audio}
        <div class="item-audio">
          <audio-play data-src="{audioDir}{item.audio}" data-enable-replay="1" data-replay-limit="2"></audio-play>
        </div>
      {/if}
      <span class="statement">{i + 1}. {item.q}</span>
      <span class="toggle">
        <button
          type="button"
          class="btn {btnClass(i, true)}"
          disabled={graded}
          onclick={() => { if (!graded) answers[String(i)] = answers[String(i)] === true ? null : true; }}
        >{pos}</button>
        <button
          type="button"
          class="btn {btnClass(i, false)}"
          disabled={graded}
          onclick={() => { if (!graded) answers[String(i)] = answers[String(i)] === false ? null : false; }}
        >{neg}</button>
      </span>
      {#if graded && r != null && !r.correct}
        <span class="verdict">
          ✗ <em>{item.why}</em>
        </span>
      {:else if graded && r?.correct}
        <span class="verdict ok">✓</span>
      {/if}
    </div>
  {/each}
</div>

<style>
  .true-false { display: flex; flex-direction: column; gap: 0.6rem; }
  .item {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.4rem 0;
    border-bottom: 1px solid var(--border, #e2e8f0);
  }
  .item.has-audio { flex-direction: column; align-items: flex-start; }
  .item-audio { margin-bottom: 0.2rem; }
  .item:last-child { border-bottom: none; }
  .statement { flex: 1 1 14rem; color: var(--text, #0f172a); }
  .toggle {
    display: inline-flex;
    border-radius: var(--radius-sm, 6px);
    overflow: hidden;
    border: 1.5px solid var(--border-strong, #cbd5e1);
  }
  .btn {
    padding: 0.25rem 0.85rem;
    font: inherit;
    font-size: 0.9rem;
    border: none;
    background: var(--surface-2, #f8fafc);
    color: var(--text, #0f172a);
    cursor: pointer;
    transition: background 0.1s, color 0.1s;
  }
  .btn:first-child { border-right: 1.5px solid var(--border-strong, #cbd5e1); }
  .btn:hover:not(:disabled) {
    background: var(--brand-50, #eef4ff);
    color: var(--brand-700, #1a34d8);
  }
  .btn:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--brand-500, #3562f6);
  }
  .btn.active,
  .btn.active:hover:not(:disabled) {
    background: var(--brand-600, #2043eb);
    color: var(--text-invert, #fff);
    font-weight: 600;
  }
  .btn:disabled { cursor: default; }
  .btn.graded-correct { background: var(--ok-bg, #f0fdf4); color: var(--ok-fg, #15803d); font-weight: 700; }
  .btn.graded-wrong   { background: var(--err-bg, #fef2f2); color: var(--err-fg, #b91c1c); font-weight: 700; }
  /* The right answer the learner did not pick — dashed, so it reads as
     "this was it" rather than "you got this". */
  .btn.graded-reveal {
    background: var(--ok-bg, #f0fdf4);
    color: var(--ok-fg, #15803d);
    outline: 2px dashed var(--ok-fg, #15803d);
    outline-offset: -2px;
  }
  .verdict {
    font-size: var(--text-base, 0.9375rem);
    color: var(--text-muted, #475569);
    font-style: italic;
    flex-basis: 100%;
    padding-left: 0.25rem;
  }
  .verdict.ok { color: var(--ok-fg, #15803d); font-style: normal; font-weight: 700; }
</style>
