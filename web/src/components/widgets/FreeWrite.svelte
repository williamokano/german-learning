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
  .stimulus {
    margin: 0;
    padding: 0.5rem 0.75rem;
    border-left: 3px solid #93c5fd;
    background: #eff6ff;
    font-style: italic;
    border-radius: 0 4px 4px 0;
  }
  .prompt { margin: 0; font-weight: 500; }
  .use-list { margin: 0; padding-left: 1.25rem; font-size: 0.9rem; color: #374151; }
  .answer-area {
    width: 100%;
    padding: 0.5rem 0.75rem;
    font: inherit;
    font-size: 0.95rem;
    border: 1.5px solid #9ca3af;
    border-radius: 6px;
    resize: vertical;
    box-sizing: border-box;
    line-height: 1.5;
  }
  .answer-area:focus { outline: none; border-color: #2563eb; }
  .answer-area:disabled { background: #f9fafb; color: #374151; }
  .self-check {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
  }
  .self-check-title { margin: 0 0 0.25rem; font-weight: 600; color: #15803d; font-size: 0.9rem; }
  .self-check ul { margin: 0; padding-left: 1.25rem; font-size: 0.875rem; }
  .model-spoiler { font-size: 0.9rem; }
  .model-spoiler summary { cursor: pointer; color: #374151; padding: 0.25rem 0; }
  .model {
    margin: 0.5rem 0 0;
    padding: 0.5rem 0.75rem;
    border-left: 3px solid #d1d5db;
    font-style: italic;
    background: #f9fafb;
  }
</style>
