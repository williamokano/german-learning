<script lang="ts">
  import { onMount } from 'svelte';
  import { checkBank } from '@core/engine/grading';
  import type { ItemResult } from '@core/content/types';
  import type { GapBankExercise } from '@core/content/types';
  import { progress } from '@core/index';
  import { seededShuffle } from '../lib/dnd';

  let { exercise, graded, results, lessonId }: {
    exercise: GapBankExercise;
    graded: boolean;
    results: ItemResult[];
    lessonId: string;
  } = $props();

  // placed[gapKey] = bank array index | null
  let placed: Record<string, number | null> = $state({});
  let mounted = false;

  // Stable display order for bank tokens, seeded by exercise id
  const bankOrder = seededShuffle(exercise.bank.length, exercise.id);

  onMount(() => {
    const saved = progress.loadAnswers(lessonId, exercise.id) as Record<string, number | null> | null;
    if (saved && typeof saved === 'object') placed = saved;
    mounted = true;
  });

  $effect(() => { if (mounted) progress.saveAnswers(lessonId, exercise.id, { ...placed }); });

  export function check(): ItemResult[] {
    return Object.keys(exercise.answers).map(key => {
      const expected = exercise.answers[key];
      const expectedWord = Array.isArray(expected) ? expected[0] : expected;
      const placedIdx = placed[key] ?? null;
      const placedWord = placedIdx !== null ? exercise.bank[placedIdx] : null;
      return {
        ref: key,
        correct: checkBank(expectedWord, placedWord),
        given: placedWord ?? '',
        expected: expectedWord,
        scoreable: true,
      };
    });
  }

  export function reset(): void {
    placed = {};
    progress.clearAnswers(lessonId, exercise.id);
  }

  // Bank indices currently placed in slots
  const placedIndices = $derived(
    new Set(Object.values(placed).filter((v): v is number => v !== null))
  );

  // Tokens visible in the pool (not yet placed), in seeded display order
  const pool = $derived(
    bankOrder
      .filter(i => !placedIndices.has(i))
      .map(i => ({ idx: i, word: exercise.bank[i] }))
  );

  const gapKeys = $derived(Object.keys(exercise.answers));

  function clickPoolToken(bankIdx: number) {
    if (graded) return;
    const nextEmpty = gapKeys.find(k => placed[k] == null);
    if (nextEmpty !== undefined) {
      placed = { ...placed, [nextEmpty]: bankIdx };
    }
  }

  function clickPlaced(gapKey: string) {
    if (graded) return;
    placed = { ...placed, [gapKey]: null };
  }

  type Segment = { type: 'text'; value: string } | { type: 'gap'; key: string };

  function parseSegments(text: string): Segment[] {
    const segs: Segment[] = [];
    let last = 0;
    const re = /\{(\d+)\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) segs.push({ type: 'text', value: text.slice(last, m.index) });
      segs.push({ type: 'gap', key: m[1] });
      last = re.lastIndex;
    }
    if (last < text.length) segs.push({ type: 'text', value: text.slice(last) });
    return segs;
  }

  const segments = $derived(parseSegments(exercise.text));

  function resultFor(key: string): ItemResult | undefined {
    return results.find(r => r.ref === key);
  }

  function slotClass(key: string): string {
    if (!graded) return placed[key] != null ? 'filled' : 'empty';
    const r = resultFor(key);
    if (r?.correct) return 'graded-correct';
    return placed[key] != null ? 'graded-wrong' : 'graded-empty';
  }
</script>

<div class="gap-bank">
  <p class="text-block">
    {#each segments as seg}
      {#if seg.type === 'text'}
        {seg.value}
      {:else}
        {@const placedIdx = placed[seg.key] ?? null}
        {@const word = placedIdx !== null ? exercise.bank[placedIdx] : null}
        {@const r = resultFor(seg.key)}
        <span class="slot {slotClass(seg.key)}">
          {#if word !== null}
            <button
              type="button"
              class="token placed-token"
              onclick={() => clickPlaced(seg.key)}
              disabled={graded}
            >{word}</button>
          {:else}
            <span class="slot-blank">_____</span>
          {/if}
          {#if graded && r != null && !r.correct}
            <span class="expected">{r.expected}</span>
          {/if}
        </span>
      {/if}
    {/each}
  </p>

  {#if !graded}
    <div class="pool">
      {#each pool as { idx, word }}
        <button
          type="button"
          class="token pool-token"
          onclick={() => clickPoolToken(idx)}
        >{word}</button>
      {/each}
      {#if pool.length === 0}
        <span class="pool-empty">Alle Wörter platziert.</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .gap-bank { display: flex; flex-direction: column; gap: 1rem; }
  .text-block { margin: 0; line-height: 2.4; white-space: pre-wrap; }
  .slot { display: inline-flex; align-items: center; gap: 4px; vertical-align: middle; }
  .slot-blank {
    display: inline-block;
    min-width: 70px;
    height: 28px;
    border-bottom: 2px solid #9ca3af;
    background: transparent;
    vertical-align: middle;
  }
  .slot.graded-empty .slot-blank { border-color: #dc2626; }
  .token {
    display: inline-block;
    padding: 3px 10px;
    border: 1.5px solid #d1d5db;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
    font: inherit;
    font-size: 0.9rem;
    transition: all 0.1s;
  }
  .pool-token:hover { border-color: #2563eb; background: #eff6ff; }
  .placed-token { border-color: #6366f1; background: #eef2ff; }
  .placed-token:hover:not(:disabled) { border-color: #dc2626; background: #fee2e2; }
  .placed-token:disabled { cursor: default; }
  .slot.graded-correct .placed-token { border-color: #16a34a; background: #dcfce7; cursor: default; }
  .slot.graded-wrong .placed-token   { border-color: #dc2626; background: #fee2e2; cursor: default; }
  .pool {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
    background: #f9fafb;
    border: 1px dashed #d1d5db;
    border-radius: 6px;
    min-height: 44px;
  }
  .pool-empty { font-size: 0.875rem; color: #9ca3af; font-style: italic; }
  .expected {
    font-size: 0.82em;
    color: #16a34a;
    font-weight: 600;
    border: 1px solid #bbf7d0;
    border-radius: 3px;
    padding: 0 4px;
    background: #f0fdf4;
  }
</style>
