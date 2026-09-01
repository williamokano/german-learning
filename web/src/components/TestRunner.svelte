<script lang="ts">
  import type { ExerciseUnion } from '@core/content/types';
  import type { ExamGridType } from '@core/content/types';
  import type { ExerciseScore } from '@core/engine/scoring';
  import type { Block } from '@core/content/types';
  import { scoreExam, type ExamResult } from '@core/engine/scoring';
  import { progress, fehlerbuch } from '@core/index';
  import ExerciseShell from './ExerciseShell.svelte';

  let {
    exercises,
    lessonId,
    audioDir,
    examGrid,
    level,
    onGraded,
  }: {
    exercises: ExerciseUnion[];
    lessonId: string;
    audioDir: string;
    examGrid: ExamGridType;
    level?: string;
    // Optional callback (issue #348, ExamSimulator) — fires with the current
    // ExamResult (or null pre-grading / after "Nochmal") every time it changes,
    // including self-assessment edits. Lets a wrapper add countdown/remediation
    // chrome without duplicating the grading/derivation logic below.
    onGraded?: (result: ExamResult | null) => void;
  } = $props();

  let graded = $state(false);
  let autoScores: ExerciseScore[] = $state([]);
  let selfScores: Record<string, number> = $state({});
  let shellRefs: Array<{ check(): ReturnType<ExerciseShell['check']>; reset(): void }> = [];

  const examResult = $derived.by<ExamResult | null>(() => {
    if (!graded || autoScores.length === 0) return null;
    return scoreExam(examGrid, autoScores, { ...selfScores });
  });

  // Exported so a wrapper (ExamSimulator) can trigger grading imperatively on
  // timer expiry — mirrors ExerciseShell's exported check()/reset().
  export function auswerten() {
    const scores: ExerciseScore[] = [];
    for (let i = 0; i < exercises.length; i++) {
      const shell = shellRefs[i];
      if (!shell) continue;
      const results = shell.check();
      const scoreable = results.filter(r => r.scoreable);
      fehlerbuch.captureExerciseResults(lessonId, exercises[i], scoreable);
      scores.push({
        id: exercises[i].id,
        block: exercises[i].block as Block,
        correct: scoreable.filter(r => r.correct).length,
        scoreable: scoreable.length,
      });
    }
    autoScores = scores;
    graded = true;
    if (examResult) progress.recordResult(lessonId, examResult as never);
  }

  function nochmal() {
    graded = false;
    autoScores = [];
    selfScores = {};
    for (const shell of shellRefs) shell?.reset();
  }

  const selfSkills = $derived(examGrid.skills.filter(sk => sk.selfAssessed));

  // Reactive, not one-shot: fires on the initial grade AND on every self-assessment
  // edit afterwards, same as the score panel below re-renders live.
  $effect(() => {
    onGraded?.(examResult);
  });
</script>

<div class="test-runner">
  {#each exercises as exercise, i (exercise.id)}
    <ExerciseShell
      bind:this={shellRefs[i]}
      {exercise}
      {graded}
      {lessonId}
      {audioDir}
      {level}
    />
  {/each}

  <div class="runner-footer">
    {#if !graded}
      <button type="button" class="btn-auswerten" onclick={auswerten}>
        Auswerten
      </button>
    {:else}
      <div class="score-panel">
        {#if selfSkills.length > 0}
          <div class="self-assess-section">
            <h3 class="self-assess-title">Selbstbewertung eingeben</h3>
            {#each selfSkills as skill}
              <label class="self-row">
                <span class="self-label">{skill.label}</span>
                <span class="self-input-wrap">
                  <input
                    type="number"
                    min="0"
                    max={skill.maxPoints}
                    value={selfScores[skill.key] ?? 0}
                    oninput={(e) => {
                      const v = Math.min(skill.maxPoints, Math.max(0, Number((e.target as HTMLInputElement).value)));
                      selfScores = { ...selfScores, [skill.key]: v };
                    }}
                    class="self-input"
                  />
                  <span class="self-max">/ {skill.maxPoints}</span>
                </span>
              </label>
            {/each}
          </div>
        {/if}

        {#if examResult}
          <table class="skill-grid">
            <thead>
              <tr>
                <th>Prüfungsteil</th>
                <th>Punkte</th>
                <th>Schwelle</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {#each examResult.skills as sk}
                <tr class:passed={sk.passed} class:failed={!sk.passed}>
                  <td class="skill-name">{sk.name}</td>
                  <td class="skill-pts">{sk.points} / {sk.maxPoints}</td>
                  <td class="skill-pass">≥ {sk.passPoints}</td>
                  <td class="skill-verdict">{sk.passed ? '✓' : '✗'}</td>
                </tr>
              {/each}
            </tbody>
            <tfoot>
              <tr class="total-row" class:passed={examResult.passed} class:failed={!examResult.passed}>
                <td class="skill-name"><strong>Gesamt</strong></td>
                <td class="skill-pts"><strong>{examResult.total} / {examResult.totalMax}</strong></td>
                <td class="skill-pass">≥ {examResult.totalPass}</td>
                <td class="skill-verdict total-verdict">
                  {#if examResult.passed}
                    <span class="big-verdict pass">✓ Bestanden</span>
                  {:else}
                    <span class="big-verdict fail">✗ Nicht bestanden</span>
                  {/if}
                </td>
              </tr>
            </tfoot>
          </table>
          {#if examGrid.rule}
            <p class="rule-note">{examGrid.rule}</p>
          {/if}
        {/if}

        <button type="button" class="btn-reset" onclick={nochmal}>Nochmal</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .test-runner { padding-bottom: 2rem; }
  .runner-footer { margin-top: 2rem; }

  .btn-auswerten {
    padding: 0.6rem 1.75rem;
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.12s;
  }
  .btn-auswerten:hover { background: #1d4ed8; }

  .score-panel { display: flex; flex-direction: column; gap: 1rem; }

  /* Self-assessment inputs */
  .self-assess-section {
    padding: 1rem 1.25rem;
    border: 1.5px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
  }
  .self-assess-title {
    margin: 0 0 0.75rem;
    font-size: 0.95rem;
    font-weight: 700;
    color: #374151;
  }
  .self-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.35rem 0;
    border-bottom: 1px solid #f3f4f6;
  }
  .self-row:last-child { border-bottom: none; }
  .self-label { font-size: 0.9rem; color: #374151; }
  .self-input-wrap { display: flex; align-items: center; gap: 0.4rem; }
  .self-input {
    width: 4rem;
    padding: 0.25rem 0.5rem;
    border: 1.5px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.95rem;
    text-align: center;
  }
  .self-max { font-size: 0.875rem; color: #6b7280; }

  /* Skill grid table */
  .skill-grid {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }
  .skill-grid th {
    text-align: left;
    padding: 0.4rem 0.65rem;
    background: #f3f4f6;
    font-weight: 700;
    font-size: 0.8rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .skill-grid td {
    padding: 0.55rem 0.65rem;
    border-bottom: 1px solid #f3f4f6;
  }
  .skill-grid tr:last-child td { border-bottom: none; }

  tr.passed td { background: #f0fdf4; }
  tr.failed td { background: #fef2f2; }

  .skill-name { font-weight: 500; }
  .skill-pts { font-variant-numeric: tabular-nums; }
  .skill-pass { color: #6b7280; font-size: 0.85em; }
  .skill-verdict { font-weight: 700; text-align: center; }
  tr.passed .skill-verdict { color: #16a34a; }
  tr.failed .skill-verdict { color: #dc2626; }

  .total-row td { border-top: 2px solid #e5e7eb; }
  .total-verdict { text-align: left !important; }
  .big-verdict { font-size: 1rem; font-weight: 800; }
  .big-verdict.pass { color: #15803d; }
  .big-verdict.fail { color: #dc2626; }

  .rule-note { margin: 0; font-size: 0.8rem; color: #6b7280; font-style: italic; }

  .btn-reset {
    align-self: flex-start;
    padding: 0.45rem 1.25rem;
    background: #f3f4f6;
    border: 1.5px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.1s;
  }
  .btn-reset:hover { background: #e5e7eb; }
</style>
