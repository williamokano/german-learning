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
    background: var(--info-bg, #eef4ff);
    border: 1px solid var(--info-border, #bcd0ff);
    border-radius: var(--radius, 10px);
  }
  .part-label {
    margin: 0 0 0.25rem;
    font-size: 0.95rem;
    color: var(--info-fg, #1a34d8);
    font-weight: 700;
  }
  .part-prompt { margin: 0; font-weight: 500; color: var(--text, #0f172a); }
  .bullets {
    margin: 0.35rem 0 0;
    padding-left: 1.25rem;
    font-size: 0.9rem;
    color: var(--text-muted, #475569);
  }
  .criteria {
    background: var(--surface-2, #f8fafc);
    border: 1px solid var(--border, #e2e8f0);
    border-radius: var(--radius-sm, 6px);
    padding: 0.5rem 0.75rem;
  }
  .criteria-title {
    margin: 0 0 0.25rem;
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text, #0f172a);
  }
  .criteria ul { margin: 0; padding-left: 1.25rem; font-size: var(--text-base, 0.9375rem); }
  .self-note {
    font-size: var(--text-base, 0.9375rem);
    color: var(--text-subtle, #64748b);
    margin: 0;
    font-style: italic;
  }
  .graded-note { font-size: var(--text-base, 0.9375rem); color: var(--text-muted, #475569); margin: 0; }
</style>
