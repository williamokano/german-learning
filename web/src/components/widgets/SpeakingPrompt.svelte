<script lang="ts">
  import type { ItemResult } from '@core/content/types';
  import type { SpeakingPromptExercise } from '@core/content/types';

  let { exercise, graded }: {
    exercise: SpeakingPromptExercise;
    graded: boolean;
  } = $props();

  export function check(): ItemResult[] {
    return exercise.parts.map((_, i) => ({
      ref: String(i),
      correct: true,
      given: '',
      expected: '',
      scoreable: false,
    }));
  }

  export function reset(): void {}
</script>

<div class="speaking-prompt">
  {#each exercise.parts as part}
    <div class="part">
      <h3 class="part-label">{part.label}</h3>
      <p class="part-prompt">{part.prompt}</p>
      {#if part.bullets && part.bullets.length > 0}
        <ul class="bullets">
          {#each part.bullets as b}<li>{b}</li>{/each}
        </ul>
      {/if}
    </div>
  {/each}

  {#if exercise.criteria && exercise.criteria.length > 0}
    <div class="criteria">
      <p class="criteria-title">Kriterien:</p>
      <ul>
        {#each exercise.criteria as c}<li>{c}</li>{/each}
      </ul>
    </div>
  {/if}

  <p class="self-note">Selbstbeurteilung — kein automatisches Scoring.</p>

  {#if graded}
    <p class="graded-note">Vergleiche deine Antwort mit den Kriterien oben.</p>
  {/if}
</div>

<style>
  .speaking-prompt { display: flex; flex-direction: column; gap: 1rem; }
  .part {
    padding: 0.75rem 1rem;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 8px;
  }
  .part-label { margin: 0 0 0.25rem; font-size: 0.95rem; color: #0369a1; font-weight: 700; }
  .part-prompt { margin: 0; font-weight: 500; }
  .bullets { margin: 0.35rem 0 0; padding-left: 1.25rem; font-size: 0.9rem; color: #374151; }
  .criteria {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
  }
  .criteria-title { margin: 0 0 0.25rem; font-weight: 600; font-size: 0.9rem; }
  .criteria ul { margin: 0; padding-left: 1.25rem; font-size: 0.875rem; }
  .self-note { font-size: 0.85rem; color: #6b7280; margin: 0; font-style: italic; }
  .graded-note { font-size: 0.875rem; color: #374151; margin: 0; }
</style>
