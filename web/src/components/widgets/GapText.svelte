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
  .gap-text { line-height: 2; }
  .text-block { margin: 0; white-space: pre-wrap; }
  .gap-wrap { display: inline-flex; align-items: baseline; gap: 2px; }
  .gap-input {
    font: inherit;
    border: 1.5px solid #9ca3af;
    border-radius: 4px;
    padding: 1px 5px;
    background: #fff;
    transition: border-color 0.1s, background 0.1s;
  }
  .gap-input:focus { outline: none; border-color: #2563eb; }
  .gap-input:disabled { background: #f9fafb; cursor: default; }
  .gap-input.correct { border-color: #16a34a; background: #dcfce7; }
  .gap-input.wrong   { border-color: #dc2626; background: #fee2e2; }
  .cue { font-size: 0.85em; color: #6b7280; margin-left: 2px; }
  .alt-note {
    font-size: 0.78em;
    color: #92400e;
    background: #fef3c7;
    border: 1px solid #fcd34d;
    border-radius: 3px;
    padding: 0 4px;
    margin-left: 4px;
  }
  .mark { font-size: 0.9em; font-weight: 700; margin-left: 2px; }
  .mark.ok  { color: #16a34a; }
  .mark.err { color: #dc2626; }
  .expected {
    font-size: 0.82em;
    color: #16a34a;
    font-weight: 600;
    margin-left: 2px;
    border: 1px solid #bbf7d0;
    border-radius: 3px;
    padding: 0 3px;
    background: #f0fdf4;
  }
</style>
