<script lang="ts">
  import { onMount } from 'svelte';
  import { checkTextDetail } from '@core/engine/grading';
  import type { ItemResult } from '@core/content/types';
  import type { GapTextExercise } from '@core/content/types';
  import { progress } from '@core/index';

  let {
    exercise,
    graded,
    results,
    lessonId,
  }: {
    exercise: GapTextExercise;
    graded: boolean;
    results: ItemResult[];
    lessonId: string;
  } = $props();

  let answers: Record<string, string> = $state({});
  let mounted = false;

  onMount(() => {
    const saved = progress.loadAnswers(lessonId, exercise.id) as Record<string, string> | null;
    if (saved && typeof saved === 'object') answers = saved;
    mounted = true;
  });

  $effect(() => {
    if (mounted) {
      progress.saveAnswers(lessonId, exercise.id, { ...answers });
    }
  });

  export function check(): ItemResult[] {
    const flags = {
      caseSensitive: exercise.caseSensitive,
      strictUmlaut: exercise.strictUmlaut,
      keepPunctuation: exercise.keepPunctuation,
    };
    return Object.keys(exercise.answers).map(key => {
      const expected = exercise.answers[key];
      const given = answers[key] ?? '';
      const { correct, note } = checkTextDetail(expected, given, exercise.alts?.[key], flags);
      const expectedStr = Array.isArray(expected) ? expected[0] : expected;
      return { ref: key, correct, given, expected: expectedStr, scoreable: true, note };
    });
  }

  export function reset(): void {
    answers = {};
    progress.clearAnswers(lessonId, exercise.id);
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

  function inputSize(key: string): number {
    const ans = exercise.answers[key];
    const first = Array.isArray(ans) ? ans[0] : ans;
    return Math.max(6, (first?.length ?? 6) + 2);
  }
</script>

<div class="gap-text">
  <p class="text-block">
    {#each segments as seg}
      {#if seg.type === 'text'}
        {seg.value}
      {:else}
        {@const r = resultFor(seg.key)}
        <span class="gap-wrap">
          <input
            type="text"
            class="gap-input"
            class:correct={graded && r?.correct}
            class:wrong={graded && r != null && !r.correct}
            size={inputSize(seg.key)}
            bind:value={answers[seg.key]}
            disabled={graded}
            aria-label="Lücke {seg.key}"
          />
          {#if exercise.cues?.[seg.key]}
            <span class="cue">({exercise.cues[seg.key]})</span>
          {/if}
          {#if graded && r != null}
            {#if r.correct}
              <span class="mark ok">✓</span>
              {#if r.note}
                <span class="alt-note">💡 {r.note}</span>
              {/if}
            {:else}
              <span class="mark err">✗</span>
              <span class="expected">{r.expected}</span>
            {/if}
          {/if}
        </span>
      {/if}
    {/each}
  </p>
</div>

<style>
  /* Line-height must clear the input's height (1.8em) with room to spare,
     otherwise inputs on consecutive lines visually collide. */
  .gap-text { line-height: 2.3; }
  .text-block { margin: 0; white-space: pre-wrap; }
  .gap-wrap {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    vertical-align: middle;
  }
  .gap-input {
    font: inherit;
    height: 1.8em;
    min-width: 3.5em;
    max-width: 100%;
    padding: 0 0.45em;
    vertical-align: middle;
    border: 1.5px solid var(--border-input, #b6c2d2);
    border-radius: var(--radius-sm, 6px);
    background: var(--surface, #fff);
    color: var(--text, #0f172a);
    transition: border-color 0.12s, background 0.12s, box-shadow 0.12s;
  }
  .gap-input:focus {
    outline: none;
    border-color: var(--brand-500, #3562f6);
    box-shadow: 0 0 0 3px var(--focus-ring, rgba(53, 98, 246, 0.25));
  }
  .gap-input:disabled { background: var(--surface-2, #f8fafc); cursor: default; }
  .gap-input.correct {
    border-color: var(--ok-border, #86efac);
    background: var(--ok-bg, #f0fdf4);
    color: var(--ok-fg, #15803d);
  }
  .gap-input.wrong {
    border-color: var(--err-border, #fca5a5);
    background: var(--err-bg, #fef2f2);
    color: var(--err-fg, #b91c1c);
  }
  .cue { font-size: 0.85em; color: var(--text-subtle, #64748b); margin-left: 2px; }
  .alt-note {
    font-size: 0.78em;
    color: var(--warn-fg, #b45309);
    background: var(--warn-bg, #fffbeb);
    border: 1px solid var(--warn-border, #fcd34d);
    border-radius: 4px;
    padding: 0 4px;
    margin-left: 4px;
  }
  .mark { font-size: 0.9em; font-weight: 700; margin-left: 2px; }
  .mark.ok  { color: var(--ok-fg, #15803d); }
  .mark.err { color: var(--err-fg, #b91c1c); }
  .expected {
    font-size: 0.82em;
    color: var(--ok-fg, #15803d);
    font-weight: 600;
    margin-left: 2px;
    border: 1px solid var(--ok-border, #86efac);
    border-radius: 4px;
    padding: 0 4px;
    background: var(--ok-bg, #f0fdf4);
  }
</style>
