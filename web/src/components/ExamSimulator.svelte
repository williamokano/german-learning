<script lang="ts">
  // ExamSimulator (issue #348) — timed, exam-conditions chrome wrapped AROUND
  // TestRunner. It does not fork or duplicate TestRunner's grading/rendering:
  // it renders <TestRunner> as a child, drives it imperatively via its exported
  // auswerten() on timer expiry (mirrors ExerciseShell's exported check()/reset()),
  // and reads its graded ExamResult back reactively via the onGraded callback prop
  // to render the countdown and post-exam remediation list.
  import { onMount, onDestroy } from 'svelte';
  import type { ExerciseUnion, ExamGridType } from '@core/content/types';
  import type { ExamResult } from '@core/engine/scoring';
  import {
    remainingSeconds,
    isExpired,
    formatMMSS,
    DEFAULT_EXAM_DURATION_MINUTES,
  } from '@core/engine/exam-timer';
  import TestRunner from './TestRunner.svelte';

  let {
    exercises,
    lessonId,
    audioDir,
    examGrid,
    lessonUrl,
  }: {
    exercises: ExerciseUnion[];
    lessonId: string;
    audioDir: string;
    examGrid: ExamGridType;
    lessonUrl: string; // pre-built "/<level>/<lesson>/" href — the primary remediation link
  } = $props();

  const FORMAT_LABELS: Record<string, string> = {
    telc: 'telc',
    goethe: 'Goethe-Zertifikat',
    oesd: 'ÖSD',
  };

  const durationMinutes = $derived(examGrid.durationMinutes ?? DEFAULT_EXAM_DURATION_MINUTES);
  const formatLabel = $derived(FORMAT_LABELS[examGrid.format ?? 'telc'] ?? examGrid.format);

  // Wall-clock state only exists once mounted (client-side) — mirrors the
  // DrillRunner/FehlerbuchReview "mounted" gate used elsewhere for anything that
  // can't run identically during SSR. Before that, show the full duration, static.
  let mounted = $state(false);
  let startedAt = $state(0);
  let now = $state(0);
  let timerId: ReturnType<typeof setInterval> | undefined;
  let testRunnerRef: { auswerten(): void } | null = $state(null);
  let examResult: ExamResult | null = $state(null);

  function startClock(): void {
    startedAt = Date.now();
    now = startedAt;
    timerId = setInterval(() => { now = Date.now(); }, 1000);
  }

  onMount(() => {
    startClock();
    mounted = true;
  });

  onDestroy(() => {
    if (timerId) clearInterval(timerId);
  });

  const secondsLeft = $derived(mounted ? remainingSeconds(startedAt, durationMinutes, now) : durationMinutes * 60);
  const expired = $derived(mounted && isExpired(startedAt, durationMinutes, now));
  const display = $derived(formatMMSS(secondsLeft));
  const lowTime = $derived(mounted && !examResult && secondsLeft <= 300);

  // Time's up == submit, matching real exam conditions (see issue #348 scope note:
  // one overall timer, not per-section locking). Guarded by `!examResult` so this
  // can't double-fire once grading has happened via the button or a previous tick.
  $effect(() => {
    if (expired && !examResult) {
      testRunnerRef?.auswerten();
    }
  });

  // TestRunner reports every ExamResult change (initial grade, self-score edits,
  // and "Nochmal" resetting back to null). On a fresh "Nochmal" attempt, restart
  // the clock too — otherwise the learner would retry against a dead, expired timer.
  function handleGraded(result: ExamResult | null): void {
    if (result === null && examResult !== null && mounted) {
      startClock();
    } else if (result !== null && timerId) {
      clearInterval(timerId);
      timerId = undefined;
    }
    examResult = result;
  }

  const failedSkills = $derived(examResult ? examResult.skills.filter(sk => !sk.passed) : []);
</script>

<div class="exam-simulator">
  <div class="exam-chrome">
    <span class="exam-format-badge">{formatLabel}</span>
    <div class="exam-timer" class:low={lowTime} class:done={!!examResult} role="timer" aria-live="polite">
      {#if examResult}
        Zeit beendet
      {:else}
        <span aria-hidden="true">⏱</span> {display}
      {/if}
    </div>
  </div>

  <TestRunner
    bind:this={testRunnerRef}
    {exercises}
    {lessonId}
    {audioDir}
    {examGrid}
    onGraded={handleGraded}
  />

  {#if examResult && failedSkills.length > 0}
    <div class="remediation">
      <h3 class="remediation-title">Empfehlung zur Nachbereitung</h3>
      <ul class="remediation-list">
        {#each failedSkills as sk (sk.name)}
          <li class="remediation-item">
            <span class="remediation-skill">{sk.name}</span>
            <span class="remediation-score">{sk.points} / {sk.maxPoints} (Schwelle {sk.passPoints})</span>
            <a class="remediation-link" href={lessonUrl}>Lektion wiederholen →</a>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
  .exam-simulator { display: flex; flex-direction: column; gap: 1rem; }

  .exam-chrome {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.6rem 1rem;
    background: #fff;
    border: 1.5px solid #e5e7eb;
    border-radius: 8px;
  }

  .exam-format-badge {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #6b7280;
    padding: 0.2rem 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 999px;
  }

  .exam-timer {
    font-variant-numeric: tabular-nums;
    font-size: 1.1rem;
    font-weight: 700;
    color: #1f2937;
  }
  .exam-timer.low { color: #dc2626; }
  .exam-timer.done { color: #6b7280; font-size: 0.95rem; font-weight: 600; }

  .remediation {
    padding: 1rem 1.25rem;
    border: 1.5px solid #fecaca;
    border-radius: 8px;
    background: #fef2f2;
  }
  .remediation-title {
    margin: 0 0 0.75rem;
    font-size: 0.95rem;
    font-weight: 700;
    color: #7f1d1d;
  }
  .remediation-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.6rem; }
  .remediation-item {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.9rem;
  }
  .remediation-skill { font-weight: 600; color: #374151; }
  .remediation-score { color: #6b7280; font-size: 0.85em; }
  .remediation-link { color: #dc2626; font-weight: 600; text-decoration: none; }
  .remediation-link:hover { text-decoration: underline; }
</style>
