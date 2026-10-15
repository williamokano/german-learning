<script lang="ts">
  import { onMount } from 'svelte';
  import { path, studyPlan } from '@core/index';
  import type { PathNode, PathNodeId, CheckpointQuizNode } from '@core/content/path';
  import type { StudyPlan } from '@core/engine/study-plan';

  // F14 exam-date study plan (issue #347). Pick a target checkpoint + date, get a
  // backplanned daily schedule. Placement testing (the other half of #347) is
  // deferred to a follow-up issue — this covers only the study-plan half.

  let { manifest, base = '' }: { manifest: PathNode[]; base?: string } = $props();

  const checkpoints = manifest.filter((n): n is CheckpointQuizNode => n.kind === 'checkpoint-quiz');

  const todayIso = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  let mounted = $state(false);
  let selectedTarget = $state<PathNodeId>(checkpoints[0]?.id ?? '');
  let selectedDate = $state(todayIso);
  let plan = $state<StudyPlan | null>(null);

  function refresh(): void {
    const completedIds = path.getCompletedIds();
    plan = studyPlan.computePlan(manifest, completedIds, new Date());
  }

  onMount(() => {
    const target = studyPlan.getTarget();
    if (target) {
      selectedTarget = target.targetNodeId;
      selectedDate = target.targetDate;
    }
    refresh();
    mounted = true;
  });

  function save(): void {
    if (!selectedTarget || !selectedDate) return;
    studyPlan.setTarget(selectedTarget, selectedDate);
    refresh();
  }

  function reset(): void {
    studyPlan.clearTarget();
    plan = null;
  }

  function lessonLink(node: PathNode): string {
    const level = node.level.toLowerCase();
    const slug = node.slug.toLowerCase();
    const target = node.kind === 'checkpoint-quiz' ? 'uebungen' : '';
    return `${base}/${level}/${slug}/${target}`.replace(/\/$/, '');
  }

  // Cap the rendered preview so a year-long plan doesn't dump 300+ rows — the
  // summary line already gives the honest overall pace.
  const PREVIEW_DAYS = 14;
  const upcomingDays = $derived(plan ? plan.days.slice(0, PREVIEW_DAYS) : []);
</script>

<div class="study-plan">
  {#if !mounted}
    <p class="status">Lade …</p>
  {:else}
    {#if checkpoints.length === 0}
      <p class="status">Keine Prüfungs-Meilensteine im Lernpfad gefunden.</p>
    {:else}
      <div class="picker-row">
        <label class="field">
          <span class="field-label">Ziel</span>
          <select bind:value={selectedTarget}>
            {#each checkpoints as node}
              <option value={node.id}>{node.level} — {node.title}</option>
            {/each}
          </select>
        </label>
        <label class="field">
          <span class="field-label">Datum</span>
          <input type="date" min={todayIso} bind:value={selectedDate} />
        </label>
        <button type="button" class="btn-primary" onclick={save}>Plan erstellen</button>
      </div>

      {#if plan}
        <div class="summary">
          <p class="summary-line">
            <strong>{plan.totalNodesRemaining}</strong> Etappen in <strong>{plan.daysRemaining}</strong> Tagen
            · Ø {plan.averageNodesPerDay} / Tag
          </p>
          <button type="button" class="btn-secondary" onclick={reset}>Ziel zurücksetzen</button>
        </div>

        {#if plan.totalNodesRemaining === 0}
          <p class="status">Alle Etappen bis zu diesem Ziel sind bereits abgeschlossen. 🎉</p>
        {:else}
          <ol class="days">
            {#each upcomingDays as day}
              <li class="day" class:day-empty={day.nodes.length === 0}>
                <span class="day-date">{day.date}</span>
                {#if day.nodes.length === 0}
                  <span class="day-rest">frei</span>
                {:else}
                  <ul class="day-nodes">
                    {#each day.nodes as node}
                      <li><a href={lessonLink(node)}>{node.lessonId} — {node.title}</a></li>
                    {/each}
                  </ul>
                {/if}
              </li>
            {/each}
          </ol>
          {#if plan.days.length > PREVIEW_DAYS}
            <p class="status">… und {plan.days.length - PREVIEW_DAYS} weitere Tage bis zum Ziel.</p>
          {/if}
        {/if}
      {/if}
    {/if}
  {/if}
</div>

<style>
  .study-plan { display: flex; flex-direction: column; gap: 1.25rem; padding: 1rem 0 2rem; }
  .status { color: var(--text-subtle); }

  .picker-row { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 0.75rem; }
  .field { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.875rem; color: var(--text-muted); }
  .field-label { font-weight: 500; }
  select, input[type="date"] {
    padding: 0.4rem 0.5rem;
    border-radius: 6px;
    border: 1px solid var(--border-strong);
    background: var(--surface);
    color: var(--text);
    font: inherit;
  }
  select:hover, input[type="date"]:hover { border-color: var(--brand-500); }

  .btn-primary {
    padding: 0.45rem 1rem;
    border-radius: 8px;
    border: none;
    background: var(--brand-600);
    color: var(--text-invert);
    font-weight: 600;
    cursor: pointer;
    height: 2.25rem;
  }
  .btn-primary:hover { background: var(--brand-700); }
  .btn-secondary {
    padding: 0.4rem 0.9rem;
    border-radius: 8px;
    border: 1.5px solid var(--border-strong);
    background: var(--surface);
    color: var(--text-muted);
    font-weight: 500;
    cursor: pointer;
    font-size: 0.85rem;
  }
  .btn-secondary:hover { border-color: var(--err-border); color: var(--err-fg); }

  .summary { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
  .summary-line { margin: 0; color: var(--text-muted); }

  .days { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.4rem; }
  .day { display: flex; gap: 0.75rem; align-items: baseline; padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid var(--border); }
  .day-empty { opacity: 0.5; }
  .day-date { font-variant-numeric: tabular-nums; color: var(--text-subtle); font-size: 0.85rem; min-width: 6rem; }
  .day-rest { color: var(--text-faint); font-size: 0.85rem; }
  .day-nodes { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.15rem; }
  .day-nodes a { color: var(--brand-600); text-decoration: none; font-size: 0.9rem; }
  .day-nodes a:hover { text-decoration: underline; }
</style>
