<script lang="ts">
  import type { ItemResult } from '@core/content/types';
  import type { ExerciseUnion } from '@core/content/types';
  import GapText from './widgets/GapText.svelte';
  import TableFill from './widgets/TableFill.svelte';
  import GapBank from './widgets/GapBank.svelte';
  import SingleChoice from './widgets/SingleChoice.svelte';
  import TrueFalse from './widgets/TrueFalse.svelte';
  import Matching from './widgets/Matching.svelte';
  import Categorize from './widgets/Categorize.svelte';
  import OddOneOut from './widgets/OddOneOut.svelte';
  import Order from './widgets/Order.svelte';
  import FreeWrite from './widgets/FreeWrite.svelte';
  import SpeakingPrompt from './widgets/SpeakingPrompt.svelte';

  let {
    exercise,
    graded,
    lessonId,
    audioDir,
  }: {
    exercise: ExerciseUnion;
    graded: boolean;
    lessonId: string;
    audioDir: string;
  } = $props();

  let widgetRef: { check(): ItemResult[]; reset(): void } | null = $state(null);
  let results: ItemResult[] = $state([]);

  export function check(): ItemResult[] {
    const r = widgetRef?.check() ?? [];
    results = r;
    return r;
  }

  export function reset(): void {
    results = [];
    widgetRef?.reset();
  }
</script>

<section class="exercise-shell">
  <h2 class="exercise-title">Übung {exercise.id} — {exercise.title}</h2>
  {#if exercise.instructions}
    <p class="exercise-instructions">{exercise.instructions}</p>
  {/if}
  {#if exercise.audio}
    <div class="exercise-audio">
      <audio-play data-src="{audioDir}{exercise.audio}"></audio-play>
    </div>
  {/if}

  {#if exercise.type === 'gap-text'}
    <GapText bind:this={widgetRef} {exercise} {graded} {results} {lessonId} />
  {:else if exercise.type === 'table-fill'}
    <TableFill bind:this={widgetRef} {exercise} {graded} {results} {lessonId} />
  {:else if exercise.type === 'gap-bank'}
    <GapBank bind:this={widgetRef} {exercise} {graded} {results} {lessonId} />
  {:else if exercise.type === 'single-choice'}
    <SingleChoice bind:this={widgetRef} {exercise} {graded} {results} {lessonId} {audioDir} />
  {:else if exercise.type === 'true-false'}
    <TrueFalse bind:this={widgetRef} {exercise} {graded} {results} {lessonId} {audioDir} />
  {:else if exercise.type === 'matching'}
    <Matching bind:this={widgetRef} {exercise} {graded} {results} {lessonId} />
  {:else if exercise.type === 'categorize'}
    <Categorize bind:this={widgetRef} {exercise} {graded} {results} {lessonId} />
  {:else if exercise.type === 'odd-one-out'}
    <OddOneOut bind:this={widgetRef} {exercise} {graded} {results} {lessonId} />
  {:else if exercise.type === 'order'}
    <Order bind:this={widgetRef} {exercise} {graded} {results} {lessonId} />
  {:else if exercise.type === 'free-write'}
    <FreeWrite bind:this={widgetRef} {exercise} {graded} {lessonId} />
  {:else if exercise.type === 'speaking-prompt'}
    <SpeakingPrompt bind:this={widgetRef} {exercise} {graded} />
  {/if}
</section>

<style>
  .exercise-shell {
    margin: 2rem 0;
    padding: 1.25rem 1.5rem 1.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #fff;
  }
  .exercise-title {
    font-size: 1.05rem;
    font-weight: 700;
    margin: 0 0 0.4rem;
    color: #1a1a1a;
    border-bottom: 1px solid #f3f4f6;
    padding-bottom: 0.4rem;
  }
  .exercise-instructions {
    margin: 0.4rem 0 0.75rem;
    font-size: 0.925rem;
    color: #374151;
  }
  .exercise-audio { margin-bottom: 0.75rem; }
</style>
