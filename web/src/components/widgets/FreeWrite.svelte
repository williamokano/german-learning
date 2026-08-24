<script lang="ts">
  import { onMount } from 'svelte';
  import type { ItemResult } from '@core/content/types';
  import type { FreeWriteExercise } from '@core/content/types';
  import { progress } from '@core/index';

  let { exercise, graded, lessonId }: {
    exercise: FreeWriteExercise;
    graded: boolean;
    lessonId: string;
  } = $props();

  let text = $state('');
  let mounted = false;

  onMount(() => {
    const saved = progress.loadAnswers(lessonId, exercise.id) as { text?: string } | null;
    if (saved?.text) text = saved.text;
    mounted = true;
  });

  $effect(() => { if (mounted) progress.saveAnswers(lessonId, exercise.id, { text }); });

  export function check(): ItemResult[] {
    return [{ ref: '0', correct: true, given: text, expected: exercise.model ?? '', scoreable: false }];
  }

  export function reset(): void {
    text = '';
    progress.clearAnswers(lessonId, exercise.id);
  }
</script>

<div class="free-write">
  {#if exercise.stimulus}
    <blockquote class="stimulus">{exercise.stimulus}</blockquote>
  {/if}

  <p class="prompt">{exercise.prompt}</p>

  {#if exercise.use && exercise.use.length > 0}
    <ul class="use-list">
      {#each exercise.use as item}<li>{item}</li>{/each}
    </ul>
  {/if}

  <textarea
    class="answer-area"
    rows={6}
    bind:value={text}
    disabled={graded}
    placeholder="Schreib deine Antwort hier…"
  ></textarea>

  {#if graded}
    {#if exercise.selfCheck && exercise.selfCheck.length > 0}
      <div class="self-check">
        <p class="self-check-title">✅ Self-check:</p>
        <ul>
          {#each exercise.selfCheck as q}<li>{q}</li>{/each}
        </ul>
      </div>
    {/if}
    {#if exercise.model}
      <details class="model-spoiler">
        <summary>📄 Musterantwort (erst nach dem Schreiben öffnen!)</summary>
        <blockquote class="model">{exercise.model}</blockquote>
      </details>
    {/if}
  {/if}
</div>

<style>
  .free-write { display: flex; flex-direction: column; gap: 0.75rem; }
  /* stimulus/model are YAML block scalars: numbered transformation drills,
     one item per line. Without pre-wrap they collapse into a single
     unreadable run-on line. */
  .stimulus {
    margin: 0;
    padding: 0.7rem 1rem;
    border-left: 4px solid var(--brand-400, #5985fc);
    background: var(--surface-2, #f8fafc);
    color: var(--text, #0f172a);
    border-radius: 0 var(--radius, 10px) var(--radius, 10px) 0;
    white-space: pre-wrap;
    line-height: 1.7;
  }
  .prompt { margin: 0; font-weight: 550; }
  .use-list {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.9rem;
    color: var(--text-muted, #475569);
  }
  .answer-area {
    width: 100%;
    padding: 0.6rem 0.8rem;
    font: inherit;
    font-size: 0.95rem;
    border: 1.5px solid var(--border-input, #b6c2d2);
    border-radius: var(--radius-sm, 6px);
    background: var(--surface, #fff);
    color: var(--text, #0f172a);
    resize: vertical;
    box-sizing: border-box;
    line-height: 1.6;
    transition: border-color 0.12s, box-shadow 0.12s;
  }
  .answer-area:focus {
    outline: none;
    border-color: var(--brand-500, #3562f6);
    box-shadow: 0 0 0 3px var(--focus-ring, rgba(53, 98, 246, 0.25));
  }
  .answer-area:disabled { background: var(--surface-2, #f8fafc); color: var(--text-muted, #475569); }
  .self-check {
    background: var(--ok-bg, #f0fdf4);
    border: 1px solid var(--ok-border, #86efac);
    border-radius: var(--radius, 10px);
    padding: 0.6rem 0.85rem;
  }
  .self-check-title {
    margin: 0 0 0.25rem;
    font-weight: 650;
    color: var(--ok-fg, #15803d);
    font-size: 0.9rem;
  }
  .self-check ul { margin: 0; padding-left: 1.25rem; font-size: 0.875rem; }
  .model-spoiler { font-size: 0.9rem; }
  .model-spoiler summary {
    cursor: pointer;
    color: var(--text-muted, #475569);
    padding: 0.25rem 0;
  }
  .model {
    margin: 0.5rem 0 0;
    padding: 0.7rem 1rem;
    border-left: 4px solid var(--ok-border, #86efac);
    background: var(--surface-2, #f8fafc);
    color: var(--text, #0f172a);
    border-radius: 0 var(--radius, 10px) var(--radius, 10px) 0;
    white-space: pre-wrap;
    line-height: 1.7;
  }
</style>
