<script lang="ts">
  import { onMount } from 'svelte';
  import { path, progress } from '@core/index';
  import type { CourseProgress } from '@core/services/progress';
  import type { PathNode, PathNodeId } from '@core/content/path';
  import { getProgressStats } from '@core/content/path';

  // F9 Path Map (issue #344). Static render of the manifest grouped by level,
  // with a client-overlay of completion status (done ✓ / current ◉ / locked —).
  // Statically-rendered node list, reactive completion state from PathService.

  let { manifest, base = '' }: { manifest: PathNode[]; base?: string } = $props();

  let completedIds = $state<Set<PathNodeId>>(new Set());
  let scores = $state<CourseProgress>({});

  onMount(() => {
    completedIds = path.getCompletedIds();
    scores = progress.getProgress();
  });

  function toggleDone(node: PathNode): void {
    if (completedIds.has(node.id)) path.unmarkComplete(node.id);
    else path.markComplete(node.id);
    completedIds = path.getCompletedIds();
  }

  function scoreLabel(node: PathNode): string | null {
    const r = scores[node.lessonId];
    return r ? `${Math.round(r.pct * 100)} %` : null;
  }

  const grouped = $derived.by(() => {
    const map = new Map<string, PathNode[]>();
    for (const node of manifest) {
      if (!map.has(node.level)) map.set(node.level, []);
      map.get(node.level)!.push(node);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  });

  const stats = $derived(getProgressStats(manifest, completedIds));

  function lessonLink(node: PathNode): string {
    const level = node.level.toLowerCase();
    const slug = node.slug.toLowerCase();
    const target = node.kind === 'checkpoint-quiz' ? 'uebungen' : '';
    return `${base}/${level}/${slug}/${target}`.replace(/\/$/, '');
  }

  function status(node: PathNode): 'done' | 'current' | 'future' {
    if (completedIds.has(node.id)) return 'done';
    if (stats.current && stats.current.id === node.id) return 'current';
    return 'future';
  }

  const LEVEL_LABELS: Record<string, string> = {
    A1: 'A1 — Anfänger',
    A2: 'A2 — Grundlegende Kenntnisse',
    B1: 'B1 — Fortgeschrittene Grundkenntnisse',
    B2: 'B2 — Selbstständige Sprachverwendung',
    C1: 'C1 — Fachkundige Sprachverwendung',
  };
</script>

<div class="path-map">
  <header class="header">
    <p class="header-count">{stats.done} / {stats.total} abgeschlossen</p>
    <div class="header-progress">
      <progress max={stats.total} value={stats.done}></progress>
    </div>
  </header>

  {#each grouped as [level, nodes]}
    <section class="level-section">
      <h2 class="level-title">{LEVEL_LABELS[level] ?? level}</h2>
      <ol class="nodes">
        {#each nodes as node}
          {@const s = status(node)}
          <li class="node node-{s}">
            {#if s === 'done'}
              <span class="status-icon" aria-label="abgeschlossen">✓</span>
            {:else if s === 'current'}
              <span class="status-icon status-icon-current" aria-label="aktuell">◉</span>
            {:else}
              <span class="status-icon" aria-hidden="true">—</span>
            {/if}
            <a href={lessonLink(node)} class="node-link">
              <span class="node-lesson">{node.lessonId}</span>
              <span class="node-title">{node.title}</span>
              {#if node.kind === 'checkpoint-quiz'}
                <span class="node-kind">Prüfung</span>
              {/if}
              {#if scoreLabel(node)}
                <span class="node-score" title="Bestes Übungsergebnis">{scoreLabel(node)}</span>
              {/if}
            </a>
            <button
              type="button"
              class="node-toggle"
              aria-pressed={s === 'done'}
              aria-label={s === 'done' ? `${node.lessonId} zurücksetzen` : `${node.lessonId} als erledigt markieren`}
              title={s === 'done' ? 'Zurücksetzen' : 'Als erledigt markieren'}
              onclick={() => toggleDone(node)}
            >{s === 'done' ? '↺' : '✓'}</button>
          </li>
        {/each}
      </ol>
    </section>
  {/each}
</div>

<style>
  .path-map { display: flex; flex-direction: column; gap: 1.5rem; padding: 1rem 0 2rem; }

  .header { display: flex; flex-direction: column; gap: 0.4rem; }
  .header-count { color: var(--text-subtle); font-size: 0.875rem; margin: 0; text-align: center; }
  .header-progress progress { width: 100%; height: 0.5rem; border: none; }
  .header-progress progress::-webkit-progress-bar { background: var(--surface-3); border-radius: 999px; }
  .header-progress progress::-webkit-progress-value { background: var(--brand-600); border-radius: 999px; }

  .level-section { display: flex; flex-direction: column; gap: 0.5rem; }
  .level-title { font-size: 1.05rem; color: var(--text-muted); margin: 0; padding-bottom: 0.4rem; border-bottom: 1px solid var(--border); }

  .nodes { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.25rem; }
  .node { display: flex; align-items: center; gap: 0.6rem; padding: 0.45rem 0.6rem; border-radius: 6px; }
  /* Not done yet: muted colour, not opacity — opacity dropped the text below AA. */
  .node-future .node-title { color: var(--text-muted); }
  .node-current { background: var(--brand-50); border: 1.5px solid var(--brand-500); }

  .status-icon { display: inline-flex; width: 1.25rem; justify-content: center; font-weight: 700; color: var(--text-subtle); }
  .status-icon-current { color: var(--brand-600); font-size: 1.1rem; }
  .node-done .status-icon { color: var(--ok-fg); }

  .node-link { display: flex; align-items: center; gap: 0.5rem; flex: 1; text-decoration: none; color: inherit; padding: 0.1rem 0; }
  .node-link:hover { color: var(--brand-600); }

  .node-lesson { color: var(--text-faint); font-size: 0.85rem; min-width: 3rem; font-variant-numeric: tabular-nums; }
  .node-title { flex: 1; }
  .node-kind { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.1rem 0.4rem; border-radius: 4px; background: var(--warn-bg); color: var(--warn-fg); font-weight: 600; }
  .node-score {
    margin-left: auto;
    font-size: var(--text-xs);
    color: var(--text-subtle);
    font-variant-numeric: tabular-nums;
  }
  .node-toggle {
    flex-shrink: 0;
    min-width: 2rem;
    min-height: 2rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text-subtle);
    font: inherit;
    cursor: pointer;
  }
  .node-toggle:hover { color: var(--text); border-color: var(--border-strong); }
</style>
