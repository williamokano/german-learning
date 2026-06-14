<script lang="ts">
  import { onMount } from 'svelte';
  import type { ItemResult } from '@core/content/types';
  import type { SingleChoiceExercise } from '@core/content/types';
  import { progress } from '@core/index';

  let {
    exercise,
    graded,
    results,
    lessonId,
    audioDir = '',
  }: {
    exercise: SingleChoiceExercise;
    graded: boolean;
    results: ItemResult[];
    lessonId: string;
    audioDir?: string;
  } = $props();

  // answers: { [itemIndex]: selectedKey | null }
  let answers: Record<string, string | null> = $state({});
  let mounted = false;

  onMount(() => {
    const saved = progress.loadAnswers(lessonId, exercise.id) as Record<string, string | null> | null;
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
      const correctOpt = item.options.find(o => o.key === item.answer);
      return {
        ref: String(i),
        correct,
        given: selected ?? '',
        expected: correctOpt?.text ?? item.answer,
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

  function optionClass(index: number, optionKey: string): string {
    if (!graded) return answers[String(index)] === optionKey ? 'selected' : '';
    const r = resultFor(index);
    const item = exercise.items[index];
    if (optionKey === item.answer) return 'graded-correct';
    if (answers[String(index)] === optionKey && !r?.correct) return 'graded-wrong';
    return '';
  }
</script>

<div class="single-choice">
  {#each exercise.items as item, i}
    {@const r = resultFor(i)}
    <div class="item" class:graded-item={graded}>
      {#if item.audio}
        <div class="item-audio">
          <audio-play data-src="{audioDir}{item.audio}"></audio-play>
        </div>
      {/if}
      <p class="question"><strong>{i + 1}.</strong> {item.q}</p>
      <div class="options">
        {#each item.options as opt}
          <label class="option {optionClass(i, opt.key)}">
            <input
              type="radio"
              name="{exercise.id}-{i}"
              value={opt.key}
              bind:group={answers[String(i)]}
              disabled={graded}
            />
            <span class="opt-key">{opt.key})</span>
            <span class="opt-text">{opt.text}</span>
          </label>
        {/each}
      </div>
      {#if graded && r != null && !r.correct && item.why}
        <p class="why">{item.why}</p>
      {/if}
    </div>
  {/each}
</div>

<style>
  .single-choice { display: flex; flex-direction: column; gap: 1.25rem; }
  .item { padding: 0.5rem 0; border-bottom: 1px solid #f3f4f6; }
  .item:last-child { border-bottom: none; }
  .item-audio { margin-bottom: 0.4rem; }
  .question { margin: 0 0 0.5rem; }
  .options { display: flex; flex-wrap: wrap; gap: 0.4rem 1rem; }
  .option {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.3rem 0.65rem;
    border: 1.5px solid #e5e7eb;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.95rem;
    transition: border-color 0.1s, background 0.1s;
  }
  .option:hover:not(:has(input:disabled)) { border-color: #2563eb; background: #eff6ff; }
  .option input[type="radio"] { display: none; }
  .option.selected { border-color: #2563eb; background: #eff6ff; font-weight: 500; }
  .option.graded-correct { border-color: #16a34a; background: #dcfce7; font-weight: 600; }
  .option.graded-wrong   { border-color: #dc2626; background: #fee2e2; }
  .opt-key { color: #6b7280; font-size: 0.85em; }
  .why { margin: 0.4rem 0 0; font-size: 0.875rem; color: #374151; font-style: italic; }
  .why::before { content: "💡 "; }
</style>
