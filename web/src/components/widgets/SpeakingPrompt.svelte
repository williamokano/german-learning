<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { ItemResult } from '@core/content/types';
  import type { SpeakingPromptExercise } from '@core/content/types';

  let { exercise, graded }: {
    exercise: SpeakingPromptExercise;
    graded: boolean;
  } = $props();

  type PartState =
    | { status: 'idle' }
    | { status: 'recording' }
    | { status: 'recorded'; url: string }
    | { status: 'error'; message: string };

  let partState: PartState[] = $state(exercise.parts.map(() => ({ status: 'idle' })));
  let recordingSupported = $state(false);

  // MediaRecorder instances aren't reactive data — kept out of $state, one per part.
  const recorders = new Map<number, MediaRecorder>();

  onMount(() => {
    recordingSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  });

  function revoke(state: PartState): void {
    if (state.status === 'recorded') URL.revokeObjectURL(state.url);
  }

  async function startRecording(i: number): Promise<void> {
    revoke(partState[i]);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        partState[i] = { status: 'recorded', url: URL.createObjectURL(blob) };
        stream.getTracks().forEach(t => t.stop());
        recorders.delete(i);
      };
      recorders.set(i, recorder);
      recorder.start();
      partState[i] = { status: 'recording' };
    } catch {
      partState[i] = {
        status: 'error',
        message: 'Mikrofonzugriff nicht möglich. Bitte erlaube den Zugriff in den Browser-Einstellungen und versuche es erneut.',
      };
    }
  }

  function stopRecording(i: number): void {
    const recorder = recorders.get(i);
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  }

  function rerecord(i: number): void {
    revoke(partState[i]);
    partState[i] = { status: 'idle' };
  }

  onDestroy(() => {
    for (const [i, recorder] of recorders) {
      if (recorder.state !== 'inactive') recorder.stop();
    }
    for (const state of partState) revoke(state);
  });

  export function check(): ItemResult[] {
    return exercise.parts.map((_, i) => ({
      ref: String(i),
      correct: true,
      given: '',
      expected: '',
      scoreable: false,
    }));
  }

  export function reset(): void {
    for (const [i, recorder] of recorders) {
      if (recorder.state !== 'inactive') recorder.stop();
    }
    for (const state of partState) revoke(state);
    partState = exercise.parts.map(() => ({ status: 'idle' }));
  }
</script>

<div class="speaking-prompt">
  {#each exercise.parts as part, i}
    <div class="part">
      <h3 class="part-label">{part.label}</h3>
      <p class="part-prompt">{part.prompt}</p>
      {#if part.bullets && part.bullets.length > 0}
        <ul class="bullets">
          {#each part.bullets as b}<li>{b}</li>{/each}
        </ul>
      {/if}

      {#if recordingSupported}
        <div class="record-row">
          {#if partState[i].status === 'idle'}
            <button type="button" class="btn-record" onclick={() => startRecording(i)}>
              🎙️ Aufnehmen
            </button>
          {:else if partState[i].status === 'recording'}
            <button type="button" class="btn-record recording" onclick={() => stopRecording(i)}>
              ⏹️ Stopp
            </button>
            <span class="rec-indicator" aria-live="polite">● Aufnahme läuft…</span>
          {:else if partState[i].status === 'recorded'}
            <!-- svelte-ignore a11y_media_has_caption -->
            <audio controls src={partState[i].url}></audio>
            <button type="button" class="btn-rerecord" onclick={() => rerecord(i)}>🔁 Neu aufnehmen</button>
          {:else if partState[i].status === 'error'}
            <p class="rec-error">{partState[i].message}</p>
            <button type="button" class="btn-record" onclick={() => startRecording(i)}>Erneut versuchen</button>
          {/if}
        </div>
      {/if}
    </div>
  {/each}

  {#if exercise.criteria && exercise.criteria.length > 0}
    <div class="criteria">
      <p class="criteria-title">Kriterien:</p>
      <ul>
        {#each exercise.criteria as c}<li>{c}</li>{/each}
      </ul>
    </div>
  {/if}

  {#if recordingSupported}
    <p class="self-note">
      Nimm dich Teil für Teil auf und höre dir die Aufnahme an — vergleiche sie danach mit den
      Kriterien oben. Die Aufnahmen bleiben nur in deinem Browser, werden nirgendwo hochgeladen
      und gehen beim Neuladen der Seite verloren.
    </p>
  {:else}
    <p class="self-note">Selbstbeurteilung — kein automatisches Scoring.</p>
  {/if}

  {#if graded}
    <p class="graded-note">Vergleiche deine Antwort mit den Kriterien oben.</p>
  {/if}
</div>

<style>
  .speaking-prompt { display: flex; flex-direction: column; gap: 1rem; }
  .part {
    padding: 0.75rem 1rem;
    background: var(--info-bg, #eef4ff);
    border: 1px solid var(--info-border, #bcd0ff);
    border-radius: var(--radius, 10px);
  }
  .part-label {
    margin: 0 0 0.25rem;
    font-size: 0.95rem;
    color: var(--info-fg, #1a34d8);
    font-weight: 700;
  }
  .part-prompt { margin: 0; font-weight: 500; color: var(--text, #0f172a); }
  .bullets {
    margin: 0.35rem 0 0;
    padding-left: 1.25rem;
    font-size: 0.9rem;
    color: var(--text-muted, #475569);
  }
  .criteria {
    background: var(--surface-2, #f8fafc);
    border: 1px solid var(--border, #e2e8f0);
    border-radius: var(--radius-sm, 6px);
    padding: 0.5rem 0.75rem;
  }
  .criteria-title {
    margin: 0 0 0.25rem;
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text, #0f172a);
  }
  .criteria ul { margin: 0; padding-left: 1.25rem; font-size: var(--text-base, 0.9375rem); }
  .self-note {
    font-size: var(--text-base, 0.9375rem);
    color: var(--text-subtle, #64748b);
    margin: 0;
    font-style: italic;
  }
  .graded-note { font-size: var(--text-base, 0.9375rem); color: var(--text-muted, #475569); margin: 0; }

  .record-row {
    margin-top: 0.6rem;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.6rem;
  }
  .btn-record, .btn-rerecord {
    padding: 0.45rem 0.9rem;
    font: inherit;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--brand-700, #1d3fb0);
    background: #fff;
    border: 1.5px solid var(--brand-300, #a8bcfb);
    border-radius: var(--radius-sm, 6px);
    cursor: pointer;
    transition: background 0.12s;
  }
  .btn-record:hover, .btn-rerecord:hover { background: var(--brand-50, #eef2ff); }
  .btn-record.recording {
    color: #fff;
    background: var(--danger, #dc2626);
    border-color: var(--danger, #dc2626);
  }
  .btn-record.recording:hover { background: var(--danger-hover, #b91c1c); }
  .rec-indicator { font-size: 0.85rem; color: var(--danger, #dc2626); font-weight: 600; }
  .rec-error { margin: 0; font-size: 0.85rem; color: var(--danger-fg, #b91c1c); }
  audio { height: 2.1rem; max-width: 100%; }
</style>
