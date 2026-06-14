<script lang="ts">
  import { onMount } from 'svelte';
  import { checkOrder } from '@core/engine/grading';
  import type { ItemResult } from '@core/content/types';
  import type { OrderExercise } from '@core/content/types';
  import { progress } from '@core/index';
  import { seededShuffle } from '../lib/dnd';

  let { exercise, graded, results, lessonId }: {
    exercise: OrderExercise;
    graded: boolean;
    results: ItemResult[];
    lessonId: string;
  } = $props();

  // strips[itemIndex] = tile indices in the order the learner placed them
  let strips: Record<string, number[]> = $state({});
  let mounted = false;

  // Stable shuffled pool display order per item
  const shuffledOrders = exercise.items.map((item, i) =>
    seededShuffle(item.tiles.length, `${exercise.id}-${i}`)
  );

  onMount(() => {
    const saved = progress.loadAnswers(lessonId, exercise.id) as Record<string, number[]> | null;
    if (saved && typeof saved === 'object') strips = saved;
    mounted = true;
  });

  $effect(() => { if (mounted) progress.saveAnswers(lessonId, exercise.id, { ...strips }); });

  export function check(): ItemResult[] {
    return exercise.items.map((item, i) => {
      const strip = strips[String(i)] ?? [];
      const allPlaced = strip.length === item.tiles.length;
      const correct = allPlaced && checkOrder(item.answer, strip, item.alt);
      const expectedSentence = item.answer.map(idx => item.tiles[idx]).join(' ');
      const givenSentence = strip.map(idx => item.tiles[idx]).join(' ');
      return {
        ref: String(i),
        correct,
        given: givenSentence,
        expected: expectedSentence,
        scoreable: true,
      };
    });
  }

  export function reset(): void {
    strips = {};
    progress.clearAnswers(lessonId, exercise.id);
  }

  function stripFor(i: number): number[] {
    return strips[String(i)] ?? [];
  }

  function poolFor(i: number): number[] {
    const inStrip = new Set(stripFor(i));
    return shuffledOrders[i].filter(idx => !inStrip.has(idx));
  }

  function addToStrip(itemIdx: number, tileIdx: number) {
    if (graded) return;
    const key = String(itemIdx);
    strips = { ...strips, [key]: [...(strips[key] ?? []), tileIdx] };
  }

  function removeFromStrip(itemIdx: number, pos: number) {
    if (graded) return;
    const key = String(itemIdx);
    strips = { ...strips, [key]: (strips[key] ?? []).filter((_, p) => p !== pos) };
  }

  function resultFor(i: number): ItemResult | undefined {
    return results.find(r => r.ref === String(i));
  }
</script>

<div class="order-widget">
  {#each exercise.items as item, i}
    {@const r = resultFor(i)}
    {@const strip = stripFor(i)}
    {@const pool = poolFor(i)}
    <div class="item">
      <!-- Build strip: sentence being assembled -->
      <div
        class="strip"
        class:correct={graded && r?.correct}
        class:wrong={graded && r != null && !r.correct}
      >
        {#if strip.length === 0 && !graded}
          <span class="strip-placeholder">Tiles hier ablegen…</span>
        {/if}
        {#each strip as tileIdx, pos}
          <button
            type="button"
            class="tile strip-tile"
            onclick={() => removeFromStrip(i, pos)}
            disabled={graded}
            title="Klicken, um zurückzulegen"
          >{item.tiles[tileIdx]}</button>
        {/each}
      </div>

      <!-- Pool: remaining tiles -->
      {#if !graded}
        <div class="pool">
          {#each pool as tileIdx}
            <button
              type="button"
              class="tile pool-tile"
              onclick={() => addToStrip(i, tileIdx)}
              title="Klicken, um hinzuzufügen"
            >{item.tiles[tileIdx]}</button>
          {/each}
        </div>
      {/if}

      <!-- Graded feedback -->
      {#if graded && r != null}
        <div class="feedback">
          {#if r.correct}
            <span class="ok">✓ Richtig!</span>
          {:else}
            <span class="err">✗</span>
            <span class="correction"> → {r.expected}</span>
          {/if}
          {#if item.note}
            <span class="note"> ({item.note})</span>
          {/if}
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .order-widget { display: flex; flex-direction: column; gap: 1.25rem; }
  .item { display: flex; flex-direction: column; gap: 0.5rem; }
  .strip {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    min-height: 44px;
    padding: 0.4rem 0.6rem;
    border: 1.5px solid #d1d5db;
    border-radius: 6px;
    background: #f9fafb;
    transition: border-color 0.1s;
  }
  .strip.correct { border-color: #16a34a; background: #f0fdf4; }
  .strip.wrong   { border-color: #dc2626; background: #fef2f2; }
  .strip-placeholder { color: #9ca3af; font-size: 0.875rem; font-style: italic; align-self: center; }
  .pool {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    padding: 0.4rem 0.6rem;
    background: #fff;
    border: 1px dashed #d1d5db;
    border-radius: 6px;
    min-height: 40px;
  }
  .tile {
    padding: 4px 10px;
    border: 1.5px solid #d1d5db;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
    font: inherit;
    font-size: 0.9rem;
    transition: all 0.1s;
  }
  .pool-tile:hover  { border-color: #2563eb; background: #eff6ff; }
  .strip-tile { border-color: #6366f1; background: #eef2ff; }
  .strip-tile:hover:not(:disabled) { border-color: #dc2626; background: #fee2e2; }
  .strip-tile:disabled { cursor: default; }
  .strip.correct .strip-tile { border-color: #16a34a; background: #dcfce7; cursor: default; }
  .strip.wrong .strip-tile   { border-color: #dc2626; background: #fee2e2; cursor: default; }
  .feedback { font-size: 0.875rem; padding-left: 0.2rem; }
  .ok  { color: #16a34a; font-weight: 700; }
  .err { color: #dc2626; font-weight: 600; }
  .correction { color: #374151; }
  .note { color: #6b7280; font-style: italic; }
</style>
