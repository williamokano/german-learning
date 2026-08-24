<script lang="ts">
  import { onMount } from 'svelte';
  import { checkText } from '@core/engine/grading';
  import type { ItemResult } from '@core/content/types';
  import type { TableFillExercise } from '@core/content/types';
  import { progress } from '@core/index';

  let { exercise, graded, results, lessonId }: {
    exercise: TableFillExercise;
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

  $effect(() => { if (mounted) progress.saveAnswers(lessonId, exercise.id, { ...answers }); });

  export function check(): ItemResult[] {
    const flags = {
      caseSensitive: exercise.caseSensitive,
      strictUmlaut: exercise.strictUmlaut,
      keepPunctuation: exercise.keepPunctuation,
    };
    const items: ItemResult[] = [];
    for (const row of exercise.rows) {
      for (const cell of row.cells) {
        if (!cell) continue;
        const key = String(cell.gap);
        const given = answers[key] ?? '';
        const correct = checkText(cell.answer, given, flags);
        const expectedStr = Array.isArray(cell.answer) ? cell.answer[0] : cell.answer;
        items.push({ ref: key, correct, given, expected: expectedStr, scoreable: true });
      }
    }
    return items;
  }

  export function reset(): void {
    answers = {};
    progress.clearAnswers(lessonId, exercise.id);
  }

  function resultFor(gap: number): ItemResult | undefined {
    return results.find(r => r.ref === String(gap));
  }

  function inputSize(answer: string | string[]): number {
    const first = Array.isArray(answer) ? answer[0] : answer;
    return Math.max(6, (first?.length ?? 6) + 2);
  }

  // `columns` sometimes captions the row-label column itself as its first
  // entry — either blank ("") or a real label like "Nominativ" — mirroring
  // how a markdown table header reads: | | col1 | col2 | or | Nominativ |
  // col1 | col2 |. Detect that structurally (one more column than each row
  // has cells) rather than only for "", so a named caption renders too;
  // otherwise every column is real data and lines up with its own cell.
  const hasRowLabelCaption = $derived(
    exercise.columns.length === (exercise.rows[0]?.cells.length ?? 0) + 1,
  );
  let rowLabelCaption = $derived(hasRowLabelCaption ? exercise.columns[0] : '');
  let displayColumns = $derived(
    hasRowLabelCaption ? exercise.columns.slice(1) : exercise.columns,
  );
</script>

<div class="table-fill">
  <div class="scroll-wrap">
    <table>
      <thead>
        <tr>
          <th class="row-label-head">{rowLabelCaption}</th>
          {#each displayColumns as col}<th>{col}</th>{/each}
        </tr>
      </thead>
      <tbody>
        {#each exercise.rows as row}
          <tr>
            <td class="row-label">{row.label}</td>
            {#each row.cells as cell}
              <td>
                {#if cell === null}
                  <!-- empty -->
                {:else}
                  {@const r = resultFor(cell.gap)}
                  <span class="cell-wrap">
                    {#if cell.given}
                      <span class="hint-text">{cell.given}</span>
                    {/if}
                    <input
                      type="text"
                      class="gap-input"
                      class:correct={graded && r?.correct}
                      class:wrong={graded && r != null && !r.correct}
                      size={inputSize(cell.answer)}
                      bind:value={answers[String(cell.gap)]}
                      disabled={graded}
                      aria-label="Lücke {cell.gap}"
                    />
                    {#if graded && r != null && !r.correct}
                      <span class="expected">{r.expected}</span>
                    {/if}
                  </span>
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .scroll-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border: 1px solid var(--border, #e2e8f0);
    border-radius: var(--radius, 10px);
  }
  table {
    border-collapse: collapse;
    min-width: 100%;
    font-size: 0.925rem;
  }
  th, td {
    padding: 0.5rem 0.8rem;
    text-align: center;
    border-bottom: 1px solid var(--border, #e2e8f0);
    border-right: 1px solid var(--border, #e2e8f0);
    white-space: nowrap;
  }
  th:last-child, td:last-child { border-right: none; }
  tbody tr:last-child td { border-bottom: none; }
  th {
    background: var(--surface-3, #f1f5f9);
    color: var(--text, #0f172a);
    font-weight: 650;
  }
  .row-label-head, .row-label {
    text-align: left;
    background: var(--surface-2, #f8fafc);
    font-weight: 650;
  }
  .cell-wrap { display: inline-flex; align-items: center; gap: 5px; }
  .hint-text { font-size: 0.85em; color: var(--text-subtle, #64748b); }
  .gap-input {
    font: inherit;
    font-size: 0.9rem;
    height: 2em;
    min-width: 3.5em;
    padding: 0 0.5em;
    border: 1.5px solid var(--border-input, #b6c2d2);
    border-radius: var(--radius-sm, 6px);
    background: var(--surface, #fff);
    color: var(--text, #0f172a);
    text-align: center;
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
  .expected {
    font-size: 0.8em;
    color: var(--ok-fg, #15803d);
    font-weight: 600;
    border: 1px solid var(--ok-border, #86efac);
    border-radius: 4px;
    padding: 0 4px;
    background: var(--ok-bg, #f0fdf4);
  }
</style>
