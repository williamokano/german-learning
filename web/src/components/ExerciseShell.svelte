<script lang="ts">
  import type { ItemResult } from '@core/content/types';
  import type { ExerciseUnion } from '@core/content/types';
  import InstructionBlocks from './InstructionBlocks.svelte';
  import PassageBody from './PassageBody.svelte';
  import { parsePassage } from '@core/content/instructions';
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
    level,
  }: {
    exercise: ExerciseUnion;
    graded: boolean;
    lessonId: string;
    audioDir: string;
    level?: string;
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
    <div class="exercise-instructions">
      <InstructionBlocks source={exercise.instructions} />
      {#if exercise.instructionsEn}
        <div class="exercise-instructions-en">
          <InstructionBlocks source={exercise.instructionsEn} />
        </div>
      {/if}
    </div>
  {/if}
  {#if exercise.audio}
    <div class="exercise-audio">
      <audio-play data-src="{audioDir}{exercise.audio}" data-enable-replay="1" data-replay-limit="2"></audio-play>
    </div>
  {/if}

  {#if exercise.transcript}
    <details class="transcript">
      <summary>📄 Transkript (erst nach dem Hören öffnen!)</summary>
      <blockquote class="transcript-body">
        <PassageBody paragraphs={parsePassage(exercise.transcript)} />
      </blockquote>
    </details>
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
    <FreeWrite bind:this={widgetRef} {exercise} {graded} {lessonId} {level} />
  {:else if exercise.type === 'speaking-prompt'}
    <SpeakingPrompt bind:this={widgetRef} {exercise} {graded} />
  {/if}
</section>

<style>
  .exercise-shell {
    margin: 1.5rem 0;
    padding: 1.35rem 1.6rem 1.6rem;
    border: 1px solid var(--border, #e2e8f0);
    border-radius: var(--radius-lg, 14px);
    background: var(--surface, #fff);
    box-shadow: var(--shadow-sm, 0 1px 3px rgba(15, 23, 42, 0.07));
  }
  .exercise-title {
    font-size: 1.05rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
    color: var(--text, #0f172a);
    border-bottom: 1px solid var(--border, #e2e8f0);
    padding-bottom: 0.55rem;
  }
  .exercise-instructions {
    margin: 0.5rem 0 0.9rem;
    font-size: 0.925rem;
    color: var(--text-muted, #475569);
  }
  .exercise-instructions-en {
    display: block;
    font-size: 0.8rem;
    color: var(--text-faint, #94a3b8);
    margin-top: 0.2rem;
  }
  .exercise-audio { margin-bottom: 0.75rem; }

  /* The instructions tell the learner to listen before reading this, so it
     stays collapsed by default — mirroring the generated markdown. */
  .transcript {
    margin: 0 0 0.9rem;
    font-size: 0.925rem;
  }
  .transcript summary {
    cursor: pointer;
    color: var(--text-muted, #475569);
    padding: 0.25rem 0;
  }
  .transcript-body {
    margin: 0.5rem 0 0;
    padding: 0.7rem 1rem;
    border-left: 4px solid var(--border-strong, #cbd5e1);
    background: var(--surface-2, #f8fafc);
    color: var(--text, #0f172a);
    border-radius: 0 var(--radius, 10px) var(--radius, 10px) 0;
    line-height: 1.7;
  }
</style>
