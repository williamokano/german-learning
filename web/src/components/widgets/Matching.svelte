<script lang="ts">
  import { onMount } from 'svelte';
  import type { ItemResult } from '@core/content/types';
  import type { MatchingExercise } from '@core/content/types';
  import { progress } from '@core/index';

  let { exercise, graded, results, lessonId }: {
    exercise: MatchingExercise;
    graded: boolean;
    results: ItemResult[];
    lessonId: string;
  } = $props();

  // { [leftKey]: rightKey | null }
  let pairs: Record<string, string | null> = $state({});
  let activeLeft: string | null = $state(null);
  let mounted = false;

  onMount(() => {
    const saved = progress.loadAnswers(lessonId, exercise.id) as Record<string, string | null> | null;
    if (saved && typeof saved === 'object') pairs = saved;
    mounted = true;
  });

  $effect(() => { if (mounted) progress.saveAnswers(lessonId, exercise.id, { ...pairs }); });

  export function check(): ItemResult[] {
    return exercise.left.map(l => {
      const given = pairs[l.key] ?? null;
      const correct = given === exercise.answers[l.key];
      const expectedKey = exercise.answers[l.key];
      const expectedItem = exercise.right.find(r => r.key === expectedKey);
      const givenItem = given ? exercise.right.find(r => r.key === given) : null;
      return {
        ref: l.key,
        correct,
        given: givenItem?.text ?? given ?? '',
        expected: expectedItem?.text ?? expectedKey,
        scoreable: true,
      };
    });
  }

  export function reset(): void {
    pairs = {};
    activeLeft = null;
    progress.clearAnswers(lessonId, exercise.id);
  }

  function clickLeft(key: string) {
    if (graded) return;
    activeLeft = activeLeft === key ? null : key;
  }

  function clickRight(key: string) {
    if (graded || activeLeft === null) return;
    const newPairs = { ...pairs };
    if (newPairs[activeLeft] === key) {
      newPairs[activeLeft] = null;
    } else {
      for (const lk of Object.keys(newPairs)) {
        if (newPairs[lk] === key) newPairs[lk] = null;
      }
      newPairs[activeLeft] = key;
    }
    pairs = newPairs;
    activeLeft = null;
  }

  function resultFor(leftKey: string): ItemResult | undefined {
    return results.find(r => r.ref === leftKey);
  }

  function leftClass(key: string): string {
    if (!graded) {
      if (activeLeft === key) return 'active';
      if (pairs[key]) return 'paired';
      return '';
    }
    const r = resultFor(key);
    return r?.correct ? 'graded-correct' : 'graded-wrong';
  }

  const usedRights = $derived(
    new Set(Object.values(pairs).filter((v): v is string => v !== null))
  );
</script>

<div class="matching">
  {#if !graded && activeLeft !== null}
    <p class="hint">Jetzt rechts klicken, um zu verbinden.</p>
  {:else if !graded}
    <p class="hint">Links klicken, um ein Element auszuwählen.</p>
  {/if}

  <div class="columns">
    <!-- Left column -->
    <div class="col">
      {#each exercise.left as item}
        {@const pairKey = pairs[item.key]}
        {@const pairText = pairKey ? exercise.right.find(r => r.key === pairKey)?.text : null}
        <button
          type="button"
          class="item left-item {leftClass(item.key)}"
          onclick={() => clickLeft(item.key)}
          disabled={graded}
        >
          <span class="item-key">{item.key}.</span>
          <span class="item-text">{item.text}</span>
          {#if pairKey && !graded}
            <span class="pair-badge">→ {pairKey}</span>
          {/if}
          {#if graded}
            {@const r = resultFor(item.key)}
            {#if r?.correct}
              <span class="mark ok">✓</span>
            {:else}
              <span class="mark err">✗</span>
            {/if}
          {/if}
        </button>
      {/each}
    </div>

    <!-- Right column -->
    <div class="col">
      {#each exercise.right as item}
        <button
          type="button"
          class="item right-item"
          class:used={usedRights.has(item.key) && !graded}
          class:targetable={!graded && activeLeft !== null}
          onclick={() => clickRight(item.key)}
          disabled={graded || activeLeft === null}
        >
          <span class="item-key">{item.key})</span>
          <span class="item-text">{item.text}</span>
        </button>
      {/each}
    </div>
  </div>

  {#if graded}
    <div class="corrections">
      {#each exercise.left as item}
        {@const r = resultFor(item.key)}
        {#if r && !r.correct}
          <p class="correction-line">
            {item.key}. → <strong>{r.expected}</strong>
            {#if r.given} (deine Antwort: {r.given}){/if}
          </p>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .matching { display: flex; flex-direction: column; gap: 0.75rem; }
  .hint { margin: 0; font-size: 0.875rem; color: #6b7280; font-style: italic; }
  .columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  @media (max-width: 500px) {
    .columns { grid-template-columns: 1fr; }
  }
  .col { display: flex; flex-direction: column; gap: 0.4rem; }
  .item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.7rem;
    border: 1.5px solid #e5e7eb;
    border-radius: 6px;
    background: #fff;
    text-align: left;
    cursor: pointer;
    font: inherit;
    font-size: 0.9rem;
    transition: all 0.1s;
  }
  .left-item:hover:not(:disabled) { border-color: #6366f1; background: #eef2ff; }
  .left-item.active { border-color: #6366f1; background: #eef2ff; font-weight: 600; }
  .left-item.paired { border-color: #93c5fd; background: #eff6ff; }
  .left-item.graded-correct { border-color: #16a34a; background: #dcfce7; }
  .left-item.graded-wrong   { border-color: #dc2626; background: #fee2e2; }
  .right-item.targetable:not(:disabled) { border-color: #d1d5db; cursor: pointer; }
  .right-item.targetable:hover:not(:disabled) { border-color: #6366f1; background: #eef2ff; }
  .right-item.used { opacity: 0.55; }
  .right-item:disabled:not(.targetable) { cursor: default; opacity: 0.8; }
  .item-key { color: #6b7280; font-size: 0.85em; min-width: 1.25rem; }
  .item-text { flex: 1; }
  .pair-badge {
    font-size: 0.8em;
    color: #2563eb;
    background: #dbeafe;
    border-radius: 3px;
    padding: 0 4px;
    white-space: nowrap;
  }
  .mark { font-weight: 700; font-size: 0.9em; }
  .mark.ok  { color: #16a34a; }
  .mark.err { color: #dc2626; }
  .corrections { font-size: 0.875rem; display: flex; flex-direction: column; gap: 0.2rem; }
  .correction-line { margin: 0; color: #374151; }
</style>
