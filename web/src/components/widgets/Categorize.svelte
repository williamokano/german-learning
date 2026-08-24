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
  .hint { margin: 0; font-size: var(--text-sm, 0.8125rem); color: var(--text-subtle, #64748b); }
  .pool {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    padding: 0.5rem 0.6rem;
    background: var(--surface-2, #f8fafc);
    border: 1px dashed var(--border-strong, #cbd5e1);
    border-radius: var(--radius-sm, 6px);
    min-height: 44px;
  }
  .pool-empty { font-size: var(--text-sm, 0.8125rem); color: var(--text-faint, #94a3b8); font-style: italic; }
  .buckets {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.75rem;
  }
  .bucket {
    border: 1.5px solid var(--border, #e2e8f0);
    border-radius: var(--radius, 10px);
    background: var(--surface, #fff);
    overflow: hidden;
    cursor: default;
    transition: border-color 0.12s, background 0.12s;
  }
  .bucket.targetable { border-color: var(--brand-400, #5985fc); cursor: pointer; }
  .bucket.targetable:hover { background: var(--brand-50, #eef4ff); }
  .bucket-label {
    background: var(--surface-3, #f1f5f9);
    color: var(--text, #0f172a);
    padding: 0.35rem 0.6rem;
    font-weight: 700;
    font-size: var(--text-base, 0.9375rem);
    border-bottom: 1px solid var(--border, #e2e8f0);
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
    border: 1.5px solid var(--border-strong, #cbd5e1);
    border-radius: var(--radius-sm, 6px);
    background: var(--surface, #fff);
    color: var(--text, #0f172a);
    cursor: pointer;
    font: inherit;
    font-size: 0.9rem;
    transition: border-color 0.12s, background 0.12s, color 0.12s;
  }
  .token:hover:not(:disabled) {
    border-color: var(--brand-500, #3562f6);
    background: var(--brand-50, #eef4ff);
    color: var(--brand-700, #1a34d8);
  }
  .token:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--focus-ring, rgba(53, 98, 246, 0.25));
  }
  /* Picked up and waiting for a bucket — the one thing waiting on the learner,
     so it gets the strongest state on screen. */
  .token.selected,
  .token.selected:hover:not(:disabled) {
    border-color: var(--brand-500, #3562f6);
    background: var(--brand-500, #3562f6);
    color: var(--text-invert, #fff);
    font-weight: 650;
  }
  .token.placed {
    border-color: var(--brand-200, #bcd0ff);
    background: var(--brand-50, #eef4ff);
    color: var(--brand-800, #1c2eaf);
  }
  .token.graded-correct {
    border-color: var(--ok-border, #86efac);
    background: var(--ok-bg, #f0fdf4);
    color: var(--ok-fg, #15803d);
    cursor: default;
  }
  .token.graded-wrong {
    border-color: var(--err-border, #fca5a5);
    background: var(--err-bg, #fef2f2);
    color: var(--err-fg, #b91c1c);
    cursor: default;
  }
  .mark { font-size: 0.8em; font-weight: 700; }
  .mark.ok  { color: var(--ok-fg, #15803d); }
  .mark.err { color: var(--err-fg, #b91c1c); }
  .correction { font-size: 0.8em; color: var(--ok-fg, #15803d); font-weight: 600; }
  .tag { font-size: 0.75em; color: var(--text-subtle, #64748b); }
</style>
