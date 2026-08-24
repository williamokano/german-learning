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

  // `columns` conventionally starts with "" as a placeholder for the row-label
  // slot (mirroring how a markdown table header reads: | | col1 | col2 |).
  // That slot is already rendered below as the hardcoded row-label-head <th>,
  // so drop the leading "" here to avoid a duplicate blank column that shifts
  // every real header one position to the right of its data.
  let displayColumns = $derived(
    exercise.columns[0] === '' ? exercise.columns.slice(1) : exercise.columns,
  );
</script>

<div class="table-fill">
  <div class="scroll-wrap">
    <table>
      <thead>
        <tr>
          <th class="row-label-head"></th>
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
  .table-fill { }
  .scroll-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  table { border-collapse: collapse; min-width: 100%; font-size: 0.925rem; }
  th, td {
    padding: 0.4rem 0.7rem;
    text-align: center;
    border: 1px solid #e5e7eb;
    white-space: nowrap;
  }
  th { background: #f9fafb; font-weight: 600; }
  .row-label-head, .row-label { text-align: left; background: #f9fafb; font-weight: 600; }
  .cell-wrap { display: inline-flex; align-items: center; gap: 4px; }
  .hint-text { font-size: 0.85em; color: #6b7280; }
  .gap-input {
    font: inherit;
    font-size: 0.9rem;
    border: 1.5px solid #9ca3af;
    border-radius: 4px;
    padding: 2px 5px;
    background: #fff;
    text-align: center;
    transition: border-color 0.1s, background 0.1s;
  }
  .gap-input:focus { outline: none; border-color: #2563eb; }
  .gap-input:disabled { background: #f9fafb; cursor: default; }
  .gap-input.correct { border-color: #16a34a; background: #dcfce7; }
  .gap-input.wrong   { border-color: #dc2626; background: #fee2e2; }
  .expected {
    font-size: 0.8em;
    color: #16a34a;
    font-weight: 600;
    border: 1px solid #bbf7d0;
    border-radius: 3px;
    padding: 0 3px;
    background: #f0fdf4;
  }
</style>
