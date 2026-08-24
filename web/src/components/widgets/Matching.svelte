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
  /** The half-made pair: whichever side was clicked first. */
  let active: { side: 'left' | 'right'; key: string } | null = $state(null);
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
    active = null;
    progress.clearAnswers(lessonId, exercise.id);
  }

  /** Which left item, if any, currently holds this right item. */
  function leftKeyFor(rightKey: string): string | undefined {
    return Object.keys(pairs).find(lk => pairs[lk] === rightKey);
  }

  function link(leftKey: string, rightKey: string) {
    const next = { ...pairs };
    // A right item belongs to one left item at a time — release its old owner.
    for (const lk of Object.keys(next)) {
      if (next[lk] === rightKey) next[lk] = null;
    }
    next[leftKey] = rightKey;
    pairs = next;
    active = null;
  }

  function unlink(leftKey: string) {
    pairs = { ...pairs, [leftKey]: null };
  }

  // Clicking a paired item breaks the pair; clicking an unpaired one selects it,
  // or completes the pair when the opposite side is already selected. Either
  // column can go first.
  function clickLeft(key: string) {
    if (graded) return;
    if (pairs[key]) { unlink(key); active = null; return; }
    if (active?.side === 'right') { link(key, active.key); return; }
    active = active?.key === key ? null : { side: 'left', key };
  }

  function clickRight(key: string) {
    if (graded) return;
    const owner = leftKeyFor(key);
    if (owner !== undefined) { unlink(owner); active = null; return; }
    if (active?.side === 'left') { link(active.key, key); return; }
    active = active?.key === key ? null : { side: 'right', key };
  }

  function resultFor(leftKey: string): ItemResult | undefined {
    return results.find(r => r.ref === leftKey);
  }

  function leftClass(key: string): string {
    if (graded) return resultFor(key)?.correct ? 'graded-correct' : 'graded-wrong';
    if (active?.side === 'left' && active.key === key) return 'active';
    if (pairs[key]) return 'paired';
    return '';
  }

  function rightClass(key: string): string {
    if (graded) return '';
    if (active?.side === 'right' && active.key === key) return 'active';
    return leftKeyFor(key) !== undefined ? 'paired' : '';
  }

  const hint = $derived(
    active === null
      ? 'Klicke ein Element — links oder rechts —, um ein Paar zu beginnen.'
      : 'Klicke jetzt auf der anderen Seite, um das Paar zu schließen.',
  );
</script>

<div class="matching">
  {#if !graded}
    <p class="hint" class:hint-active={active !== null}>{hint}</p>
  {/if}

  <div class="columns">
    <!-- Left column -->
    <div class="col">
      {#each exercise.left as item}
        {@const pairKey = pairs[item.key]}
        <button
          type="button"
          class="item left-item {leftClass(item.key)}"
          onclick={() => clickLeft(item.key)}
          disabled={graded}
          aria-pressed={active?.side === 'left' && active.key === item.key}
        >
          <span class="item-key">{item.key}.</span>
          <span class="item-text">{item.text}</span>
          {#if pairKey && !graded}
            <span class="pair-badge">{pairKey}</span>
          {/if}
          {#if graded}
            {@const r = resultFor(item.key)}
            <span class="mark" class:ok={r?.correct} class:err={!r?.correct}>
              {r?.correct ? '✓' : '✗'}
            </span>
          {/if}
        </button>
      {/each}
    </div>

    <!-- Right column -->
    <div class="col">
      {#each exercise.right as item}
        {@const owner = leftKeyFor(item.key)}
        <button
          type="button"
          class="item right-item {rightClass(item.key)}"
          onclick={() => clickRight(item.key)}
          disabled={graded}
          aria-pressed={active?.side === 'right' && active.key === item.key}
        >
          <span class="item-key">{item.key})</span>
          <span class="item-text">{item.text}</span>
          {#if owner !== undefined && !graded}
            <span class="pair-badge">{owner}</span>
          {/if}
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
            {#if r.given} <span class="given">(deine Antwort: {r.given})</span>{/if}
          </p>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .matching { display: flex; flex-direction: column; gap: 0.75rem; }
  .hint {
    margin: 0;
    font-size: var(--text-sm, 0.8125rem);
    color: var(--text-subtle, #64748b);
  }
  .hint-active { color: var(--brand-600, #2043eb); font-weight: 600; }
  .columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  @media (max-width: 560px) {
    .columns { grid-template-columns: 1fr; }
  }
  .col { display: flex; flex-direction: column; gap: 0.4rem; }
  .item {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.5rem 0.7rem;
    /* A transparent 3px rail on the left: the paired/active states colour it
       in without the box shifting by a pixel. */
    border: 1.5px solid var(--border, #e2e8f0);
    border-left: 3px solid transparent;
    border-radius: var(--radius-sm, 6px);
    background: var(--surface, #fff);
    color: var(--text, #0f172a);
    text-align: left;
    cursor: pointer;
    font: inherit;
    font-size: 0.9rem;
    transition: border-color 0.12s, background 0.12s, box-shadow 0.12s;
  }
  .item:hover:not(:disabled) {
    border-color: var(--brand-400, #5985fc);
    background: var(--brand-50, #eef4ff);
  }
  .item:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--focus-ring, rgba(53, 98, 246, 0.25));
  }

  /* Selected — the strongest state on the board, because it is the one thing
     waiting on the learner. */
  .item.active,
  .item.active:hover:not(:disabled) {
    border-color: var(--brand-500, #3562f6);
    border-left-color: var(--brand-500, #3562f6);
    background: var(--brand-50, #eef4ff);
    color: var(--brand-800, #1c2eaf);
    font-weight: 600;
    box-shadow: 0 0 0 3px var(--focus-ring, rgba(53, 98, 246, 0.25));
  }

  /* Already paired — settled, so quieter than active but unmistakably done. */
  .item.paired {
    border-color: var(--brand-200, #bcd0ff);
    border-left-color: var(--brand-500, #3562f6);
    background: var(--brand-50, #eef4ff);
  }
  .item.paired:hover:not(:disabled) {
    border-color: var(--err-border, #fca5a5);
    border-left-color: var(--err-fg, #b91c1c);
    background: var(--err-bg, #fef2f2);
  }

  .item.graded-correct {
    border-color: var(--ok-border, #86efac);
    border-left-color: var(--ok-fg, #15803d);
    background: var(--ok-bg, #f0fdf4);
  }
  .item.graded-wrong {
    border-color: var(--err-border, #fca5a5);
    border-left-color: var(--err-fg, #b91c1c);
    background: var(--err-bg, #fef2f2);
  }
  .item:disabled { cursor: default; }

  .item-key {
    color: var(--text-subtle, #64748b);
    font-size: 0.85em;
    font-variant-numeric: tabular-nums;
    min-width: 1.25rem;
  }
  .item-text { flex: 1; }

  /* Carries the partner's key, and sits on both halves of a pair — so a pair
     can be read off either column without tracing a line across the gap. */
  .pair-badge {
    font-size: 0.75em;
    font-weight: 700;
    line-height: 1;
    padding: 0.25em 0.45em;
    border-radius: 999px;
    color: var(--text-invert, #fff);
    background: var(--brand-500, #3562f6);
  }
  .mark { font-weight: 700; font-size: 0.9em; }
  .mark.ok  { color: var(--ok-fg, #15803d); }
  .mark.err { color: var(--err-fg, #b91c1c); }

  .corrections {
    font-size: var(--text-base, 0.9375rem);
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .correction-line { margin: 0; color: var(--text-muted, #475569); }
  .correction-line strong { color: var(--text, #0f172a); }
  .given { color: var(--text-subtle, #64748b); }
</style>
