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
    const sel = answers[String(index)] ?? null;
    if (!graded) return sel === optionKey ? 'selected' : '';
    const item = exercise.items[index];
    if (sel === optionKey && optionKey === item.answer) return 'graded-correct'; // picked + right
    if (sel === optionKey && optionKey !== item.answer) return 'graded-wrong';   // picked + wrong
    if (optionKey === item.answer) return 'graded-reveal';                       // right but not picked
    return '';
  }
</script>

<div class="single-choice">
  {#each exercise.items as item, i}
    {@const r = resultFor(i)}
    <div class="item" class:graded-item={graded}>
      {#if item.audio}
        <div class="item-audio">
          <audio-play data-src="{audioDir}{item.audio}" data-enable-replay="1" data-replay-limit="2"></audio-play>
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
  .item { padding: 0.6rem 0; border-bottom: 1px solid var(--border, #e2e8f0); }
  .item:last-child { border-bottom: none; }
  .item-audio { margin-bottom: 0.4rem; }
  .question { margin: 0 0 0.6rem; }
  .options { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .option {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.8rem;
    border: 1.5px solid var(--border, #e2e8f0);
    border-radius: var(--radius, 10px);
    background: var(--surface, #fff);
    color: var(--text, #0f172a);
    cursor: pointer;
    font-size: 0.95rem;
    transition: border-color 0.12s, background 0.12s, color 0.12s;
  }
  .option:hover:not(:has(input:disabled)) {
    border-color: var(--brand-400, #5985fc);
    background: var(--brand-50, #eef4ff);
  }
  .option input[type="radio"] { display: none; }
  .option.selected {
    border-color: var(--brand-500, #3562f6);
    background: var(--brand-50, #eef4ff);
    color: var(--brand-700, #1a34d8);
    font-weight: 600;
  }
  .option.graded-correct {
    border-color: var(--ok-border, #86efac);
    background: var(--ok-bg, #f0fdf4);
    color: var(--ok-fg, #15803d);
    font-weight: 600;
  }
  .option.graded-wrong {
    border-color: var(--err-border, #fca5a5);
    background: var(--err-bg, #fef2f2);
    color: var(--err-fg, #b91c1c);
  }
  .option.graded-reveal {
    border: 2px dashed var(--ok-fg, #15803d);
    background: var(--ok-bg, #f0fdf4);
    color: var(--ok-fg, #15803d);
  }
  .opt-key { color: var(--text-subtle, #64748b); font-size: 0.85em; font-weight: 600; }
  .why { margin: 0.5rem 0 0; font-size: 0.875rem; color: var(--text-muted, #475569); font-style: italic; }
  .why::before { content: "💡 "; }
</style>
