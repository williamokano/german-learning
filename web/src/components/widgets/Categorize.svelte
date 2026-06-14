<script lang="ts">
  import { onMount } from 'svelte';
  import type { ItemResult } from '@core/content/types';
  import type { CategorizeExercise } from '@core/content/types';
  import { progress } from '@core/index';

  let { exercise, graded, results, lessonId }: {
    exercise: CategorizeExercise;
    graded: boolean;
    results: ItemResult[];
    lessonId: string;
  } = $props();

  // placed[tokenIndex] = bucketKey | null
  let placed: Record<string, string | null> = $state({});
  // tokenIndex of the currently selected (lifted) token, or null
  let selected: string | null = $state(null);
  let mounted = false;

  onMount(() => {
    const saved = progress.loadAnswers(lessonId, exercise.id) as Record<string, string | null> | null;
    if (saved && typeof saved === 'object') placed = saved;
    mounted = true;
  });

  $effect(() => { if (mounted) progress.saveAnswers(lessonId, exercise.id, { ...placed }); });

  export function check(): ItemResult[] {
    return exercise.tokens.map((token, ti) => {
      const bucketKey = placed[String(ti)] ?? null;
      const correct = bucketKey === token.bucket;
      const expectedBucket = exercise.buckets.find(b => b.key === token.bucket);
      const givenBucket = bucketKey ? exercise.buckets.find(b => b.key === bucketKey) : null;
      return {
        ref: String(ti),
        correct,
        given: givenBucket?.label ?? bucketKey ?? '',
        expected: expectedBucket?.label ?? token.bucket,
        scoreable: true,
      };
    });
  }

  export function reset(): void {
    placed = {};
    selected = null;
    progress.clearAnswers(lessonId, exercise.id);
  }

  function clickToken(ti: number) {
    if (graded) return;
    const key = String(ti);
    if (placed[key]) {
      // Return placed token to pool
      placed = { ...placed, [key]: null };
      selected = null;
    } else {
      // Toggle selection for pool token
      selected = selected === key ? null : key;
    }
  }

  function clickBucket(bucketKey: string, e: MouseEvent) {
    // Prevent triggering when clicking a token inside the bucket
    if ((e.target as HTMLElement).closest('.token')) return;
    if (graded || selected === null) return;
    placed = { ...placed, [selected]: bucketKey };
    selected = null;
  }

  function resultFor(ti: number): ItemResult | undefined {
    return results.find(r => r.ref === String(ti));
  }

  function tokenClass(ti: number): string {
    const key = String(ti);
    if (!graded) {
      if (selected === key) return 'selected';
      if (placed[key]) return 'placed';
      return '';
    }
    const r = resultFor(ti);
    return r?.correct ? 'graded-correct' : 'graded-wrong';
  }

  const poolTokens = $derived(
    exercise.tokens.map((t, i) => ({ ...t, idx: i })).filter(t => !placed[String(t.idx)])
  );

  function bucketTokens(bucketKey: string) {
    return exercise.tokens
      .map((t, i) => ({ ...t, idx: i }))
      .filter(({ idx }) => placed[String(idx)] === bucketKey);
  }
</script>

<div class="categorize">
  {#if !graded && selected !== null}
    <p class="hint">Jetzt eine Kategorie anklicken.</p>
  {:else if !graded}
    <p class="hint">Wort auswählen, dann Kategorie anklicken.</p>
  {/if}

  <!-- Token pool -->
  <div class="pool">
    {#each poolTokens as { text, idx }}
      <button
        type="button"
        class="token {tokenClass(idx)}"
        onclick={() => clickToken(idx)}
      >{text}</button>
    {/each}
    {#if poolTokens.length === 0 && !graded}
      <span class="pool-empty">Alle Wörter eingeordnet.</span>
    {/if}
  </div>

  <!-- Buckets -->
  <div class="buckets">
    {#each exercise.buckets as bucket}
      <div
        class="bucket"
        class:targetable={!graded && selected !== null}
        onclick={(e) => clickBucket(bucket.key, e)}
        role="group"
        aria-label={bucket.label}
      >
        <div class="bucket-label">{bucket.label}</div>
        <div class="bucket-content">
          {#each bucketTokens(bucket.key) as { text, idx, tag }}
            <button
              type="button"
              class="token {tokenClass(idx)}"
              onclick={() => clickToken(idx)}
              disabled={graded}
            >
              {text}
              {#if graded}
                {@const r = resultFor(idx)}
                {#if r?.correct}
                  <span class="mark ok">✓</span>
                {:else}
                  <span class="mark err">✗</span>
                  <span class="correction">→ {r?.expected}</span>
                {/if}
                {#if tag}<span class="tag">{tag}</span>{/if}
              {/if}
            </button>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .categorize { display: flex; flex-direction: column; gap: 1rem; }
  .hint { margin: 0; font-size: 0.875rem; color: #6b7280; font-style: italic; }
  .pool {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    padding: 0.5rem 0.6rem;
    background: #f9fafb;
    border: 1px dashed #d1d5db;
    border-radius: 6px;
    min-height: 44px;
  }
  .pool-empty { font-size: 0.875rem; color: #9ca3af; font-style: italic; }
  .buckets {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.75rem;
  }
  .bucket {
    border: 1.5px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    cursor: default;
    transition: border-color 0.1s;
  }
  .bucket.targetable { border-color: #6366f1; cursor: pointer; }
  .bucket.targetable:hover { background: #f5f3ff; }
  .bucket-label {
    background: #f3f4f6;
    padding: 0.35rem 0.6rem;
    font-weight: 700;
    font-size: 0.875rem;
    border-bottom: 1px solid #e5e7eb;
    pointer-events: none;
  }
  .bucket-content {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    padding: 0.5rem 0.6rem;
    min-height: 44px;
  }
  .token {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border: 1.5px solid #d1d5db;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
    font: inherit;
    font-size: 0.9rem;
    transition: all 0.1s;
  }
  .token:hover:not(:disabled) { border-color: #6366f1; background: #eef2ff; }
  .token.selected { border-color: #6366f1; background: #eef2ff; font-weight: 700; }
  .token.placed { border-color: #93c5fd; background: #eff6ff; }
  .token.graded-correct { border-color: #16a34a; background: #dcfce7; cursor: default; }
  .token.graded-wrong   { border-color: #dc2626; background: #fee2e2; cursor: default; }
  .mark { font-size: 0.8em; font-weight: 700; }
  .mark.ok  { color: #16a34a; }
  .mark.err { color: #dc2626; }
  .correction { font-size: 0.8em; color: #16a34a; font-weight: 600; }
  .tag { font-size: 0.75em; color: #6b7280; }
</style>
