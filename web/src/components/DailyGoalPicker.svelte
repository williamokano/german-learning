<script lang="ts">
  import { onMount } from 'svelte';
  import { pillSettings } from '@core/index';
  import type { DailyGoal } from '@core/index';
  import { GOAL_MINUTES } from '@core/engine/daily-mix';

  // F9 daily-goal picker (issue #344). Lives on the homepage. Changing the value
  // persists to gl:v1:pill:settings; the next /today visit picks it up via
  // PillSettingsService.get() in DailyMixRunner.
  //
  // Note: we deliberately use `onchange` (not `bind:value` + `onchange`) — with
  // Svelte 5's two-way binding, the bind:value runs first and updates `goal` to
  // the new value BEFORE onchange fires, so any "value !== goal" guard in the
  // handler would short-circuit and skip the persist call.
  //
  // Runtime check on the <select> value: an unchecked `as DailyGoal` cast would
  // silently accept an unknown string if the <option> list ever drifts from the
  // literal union (PillSettingsService.set would then no-op), producing an
  // empty-state mix with zero diagnostic. Validate against the same closed set
  // the service uses, log + early-return on drift.

  const VALID_GOALS: ReadonlySet<DailyGoal> = new Set<DailyGoal>(['casual', 'regular', 'serious']);
  const isDailyGoal = (v: string): v is DailyGoal => VALID_GOALS.has(v as DailyGoal);

  let goal = $state<DailyGoal>('regular');

  onMount(() => {
    goal = pillSettings.get().dailyGoal;
  });

  function onChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (!isDailyGoal(value)) {
      console.warn('[DailyGoalPicker] unknown goal value, ignoring:', value);
      return;
    }
    pillSettings.set(value);
    goal = value;
  }
</script>

<label class="picker">
  <span class="picker-label">Tägliches Ziel:</span>
  <select value={goal} onchange={onChange}>
    <option value="casual">Locker (~{GOAL_MINUTES.casual} min)</option>
    <option value="regular">Regelmäßig (~{GOAL_MINUTES.regular} min)</option>
    <option value="serious">Ernsthaft (~{GOAL_MINUTES.serious} min)</option>
  </select>
</label>

<style>
  .picker { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; color: #374151; }
  .picker-label { font-weight: 500; }
  select {
    padding: 0.35rem 0.5rem;
    border-radius: 6px;
    border: 1px solid #d1d5db;
    background: #fff;
    font: inherit;
    cursor: pointer;
  }
  select:hover { border-color: #2563eb; }
  select:focus { outline: 2px solid #2563eb; outline-offset: 1px; }
</style>
