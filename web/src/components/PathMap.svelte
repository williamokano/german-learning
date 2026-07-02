<script lang="ts">
  import { onMount } from 'svelte';
  import { path } from '@core/index';
  import type { PathNode, PathNodeId } from '@core/content/path';
  import { getProgressStats } from '@core/content/path';

  // F9 Path Map (issue #344). Static render of the manifest grouped by level,
  // with a client-overlay of completion status (done ✓ / current ◉ / locked —).
  // Statically-rendered node list, reactive completion state from PathService.

  let { manifest, base = '' }: { manifest: PathNode[]; base?: string } = $props();

  let completedIds = $state<Set<PathNodeId>>(new Set());

  onMount(() => {
    completedIds = path.getCompletedIds();
  });

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
            </a>
          </li>
        {/each}
      </ol>
    </section>
  {/each}
</div>

<style>
  .path-map { display: flex; flex-direction: column; gap: 1.5rem; padding: 1rem 0 2rem; }

  .header { display: flex; flex-direction: column; gap: 0.4rem; }
  .header-count { color: #6b7280; font-size: 0.875rem; margin: 0; text-align: center; }
  .header-progress progress { width: 100%; height: 0.5rem; border: none; }
  .header-progress progress::-webkit-progress-bar { background: #e5e7eb; border-radius: 999px; }
  .header-progress progress::-webkit-progress-value { background: #2563eb; border-radius: 999px; }

  .level-section { display: flex; flex-direction: column; gap: 0.5rem; }
  .level-title { font-size: 1.05rem; color: #374151; margin: 0; padding-bottom: 0.4rem; border-bottom: 1px solid #e5e7eb; }

  .nodes { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.25rem; }
  .node { display: flex; align-items: center; gap: 0.6rem; padding: 0.45rem 0.6rem; border-radius: 6px; }
  .node-future { opacity: 0.55; }
  .node-current { background: #eff6ff; border: 1.5px solid #2563eb; }
  .node-done { opacity: 0.85; }

  .status-icon { display: inline-flex; width: 1.25rem; justify-content: center; font-weight: 700; color: #6b7280; }
  .status-icon-current { color: #2563eb; font-size: 1.1rem; }
  .node-done .status-icon { color: #16a34a; }

  .node-link { display: flex; align-items: center; gap: 0.5rem; flex: 1; text-decoration: none; color: inherit; padding: 0.1rem 0; }
  .node-link:hover { color: #2563eb; }

  .node-lesson { color: #9ca3af; font-size: 0.85rem; min-width: 3rem; font-variant-numeric: tabular-nums; }
  .node-title { flex: 1; }
  .node-kind { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.1rem 0.4rem; border-radius: 4px; background: #fef3c7; color: #b45309; font-weight: 600; }
</style>
