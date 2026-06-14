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
        scoreable: true,
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
          <audio-play data-src="{audioDir}{item.audio}"></audio-play>
        </div>
      {/if}
      <span class="statement">{i + 1}. {item.q}</span>
      <span class="toggle">
        <button
          type="button"
          class="btn {btnClass(i, true)}"
          disabled={graded}
          onclick={() => { if (!graded) answers[String(i)] = true; }}
        >{pos}</button>
        <button
          type="button"
          class="btn {btnClass(i, false)}"
          disabled={graded}
          onclick={() => { if (!graded) answers[String(i)] = false; }}
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
    border-bottom: 1px solid #f3f4f6;
  }
  .item.has-audio { flex-direction: column; align-items: flex-start; }
  .item-audio { margin-bottom: 0.2rem; }
  .item:last-child { border-bottom: none; }
  .statement { flex: 1 1 14rem; }
  .toggle { display: inline-flex; border-radius: 6px; overflow: hidden; border: 1.5px solid #e5e7eb; }
  .btn {
    padding: 0.25rem 0.85rem;
    font: inherit;
    font-size: 0.9rem;
    border: none;
    background: #f9fafb;
    cursor: pointer;
    transition: background 0.1s, color 0.1s;
  }
  .btn:first-child { border-right: 1.5px solid #e5e7eb; }
  .btn:hover:not(:disabled) { background: #eff6ff; }
  .btn.active { background: #2563eb; color: #fff; font-weight: 600; }
  .btn:disabled { cursor: default; }
  .btn.graded-correct { background: #dcfce7; color: #15803d; font-weight: 700; }
  .btn.graded-wrong   { background: #fee2e2; color: #dc2626; font-weight: 700; }
  .btn.graded-reveal  { background: #f0fdf4; color: #15803d; }
  .verdict { font-size: 0.85rem; color: #374151; font-style: italic; flex-basis: 100%; padding-left: 0.25rem; }
  .verdict.ok { color: #16a34a; font-style: normal; font-weight: 700; }
</style>
