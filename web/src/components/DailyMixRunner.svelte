<script lang="ts">
  import { onMount } from 'svelte';
  import { srs, fehlerbuch, path, pillSettings } from '@core/index';
  import type { Rating, FehlerbuchEntry } from '@core/index';
  import { buildPathManifest, type PathNode, type PathManifestLessonInput, type PathManifestVocabSetInput } from '@core/content/path';
  import { buildDailyMix, type MixItem, type DailyGoal, type CardStateLike } from '@core/engine/daily-mix';
  import type { VocabSetType } from '@core/content/vocab';
  import type { ExerciseSetEntry } from '@core/content/drills';
  import SingleFlashcard from './SingleFlashcard.svelte';
  import DrillItemRunner from './DrillItemRunner.svelte';
  import FehlerbuchReview from './FehlerbuchReview.svelte';

  // F9 Daily Mix orchestrator (issue #344). Walks an at-mix-time computed list of
  // items (`vocab-card` / `drill` / `fehlerbuch`) one at a time. Stateless across
  // visits (matches `startDeepReview` / FehlerbuchReview "always rebuilds fresh" —
  // no resumable slot). On finish: tally summary + "Pfad fortsetzen →" CTA.

  let {
    lessons,
    vocabSets,
    exerciseEntries,
    fehlerbuchPoolSize = 6,
  }: {
    lessons: PathManifestLessonInput[];
    vocabSets: PathManifestVocabSetInput[];
    exerciseEntries: ExerciseSetEntry[];
    fehlerbuchPoolSize?: number;
  } = $props();

  let mounted = $state(false);
  let manifest: PathNode[] = $state([]);
  let items: MixItem[] = $state([]);
  let position = $state(0);
  let stats = $state({ newPills: 0, dueCards: 0, interleavedDrills: 0, fehlerbuch: 0, total: 0 });
  // Surface build failures inline instead of throwing — otherwise the user would
  // see "Lade Daily Mix …" forever (mounted stays false), with no UI feedback and
  // no log. Cleared on every `computeMix` call.
  let mixError: string | null = $state(null);

  // Per-tally running count
  let tally = $state({
    vocab: { again: 0, hard: 0, good: 0, easy: 0 } as Record<Rating, number>,
    drills: { correct: 0, scoreable: 0 },
    fehlerbuch: { again: 0, hard: 0, good: 0, easy: 0 } as Record<Rating, number>,
  });

  function computeMix(): void {
    mixError = null;
    try {
      manifest = buildPathManifest({ lessons, vocabSets: vocabSets as PathManifestVocabSetInput[] });
      const goal: DailyGoal = pillSettings.get().dailyGoal;
      const cardStates = srs.getAllCardStates() as Record<string, CardStateLike>;
      const curated: FehlerbuchEntry[] = fehlerbuch.startReview(fehlerbuchPoolSize);

      const currentNode = path.getCurrentNode(manifest);
      const currentLessonId = currentNode?.lessonId ?? null;

      const result = buildDailyMix({
        currentLessonId,
        vocabSets: vocabSets as VocabSetType[],
        cardStates,
        exerciseEntries,
        fehlerbuchEntries: curated,
        goal,
      });
      items = result.items;
      stats = result.stats;
      position = 0;
      tally = {
        vocab: { again: 0, hard: 0, good: 0, easy: 0 },
        drills: { correct: 0, scoreable: 0 },
        fehlerbuch: { again: 0, hard: 0, good: 0, easy: 0 },
      };
    } catch (err) {
      // Surface the failure inline (mounted is set later in onMount regardless)
      // so the user sees an actionable message + developer sees a stack trace in
      // the console. Reset items so an empty-state UI doesn't render stale data.
      mixError = 'Daily Mix konnte nicht geladen werden. Bitte Seite aktualisieren (F5).';
      items = [];
      stats = { newPills: 0, dueCards: 0, interleavedDrills: 0, fehlerbuch: 0, total: 0 };
      console.error('[DailyMixRunner] computeMix failed:', err);
    }
  }

  onMount(() => {
    computeMix();
    mounted = true;
  });

  const current = $derived(!finished ? items[position] : undefined);
  const finished = $derived(mounted && items.length > 0 && position >= items.length);
  const noItems = $derived(mounted && items.length === 0);

  function rateVocab(rating: Rating): void {
    const it = current;
    if (!it || it.kind !== 'vocab-card') return;
    srs.recordRating(it.cardKey, rating);
    tally.vocab[rating] += 1;
    position += 1;
  }

  function onDrillAdvance(correctCount: number, scoreableCount: number): void {
    tally.drills.correct += correctCount;
    tally.drills.scoreable += scoreableCount;
    position += 1;
  }

  function onFehlerbuchRated(rating: Rating): void {
    tally.fehlerbuch[rating] += 1;
    position += 1;
  }

  function recompute(): void {
    // Fresh session — clear local state and rebuild.
    computeMix();
  }
</script>

<div class="daily-mix-runner">
  {#if !mounted}
    <p class="status">Lade Daily Mix …</p>
  {:else if mixError}
    <div class="error">
      <h2>Fehler</h2>
      <p>{mixError}</p>
    </div>
  {:else if noItems}
    <div class="empty">
      <h2>Nichts zu tun 🎉</h2>
      <p>Es gibt gerade keinen passenden Mix für dich. Versuche eine Lektion zu absolvieren, um neue Wörter freizuschalten.</p>
      <a class="btn-primary" href="/path/">Pfad ansehen →</a>
    </div>
  {:else if finished}
    <div class="summary">
      <h2>Fertig! 🎉</h2>
      <p class="summary-count">{items.length} Aufgaben erledigt</p>
      <div class="summary-tally">
        <div class="tally-block">
          <h3>Vokabeln</h3>
          <div class="chips">
            <span class="chip chip-again">Again {tally.vocab.again}</span>
            <span class="chip chip-hard">Hard {tally.vocab.hard}</span>
            <span class="chip chip-good">Good {tally.vocab.good}</span>
            <span class="chip chip-easy">Easy {tally.vocab.easy}</span>
          </div>
        </div>
        <div class="tally-block">
          <h3>Drills</h3>
          <p>{tally.drills.correct} / {tally.drills.scoreable} richtig</p>
        </div>
        <div class="tally-block">
          <h3>Fehlerbuch</h3>
          <div class="chips">
            <span class="chip chip-again">Again {tally.fehlerbuch.again}</span>
            <span class="chip chip-hard">Hard {tally.fehlerbuch.hard}</span>
            <span class="chip chip-good">Good {tally.fehlerbuch.good}</span>
            <span class="chip chip-easy">Easy {tally.fehlerbuch.easy}</span>
          </div>
        </div>
      </div>
      <div class="summary-actions">
        <button type="button" class="btn-secondary" onclick={recompute}>Nochmal (frisch mischen)</button>
        <a class="btn-primary" href="/path/">Pfad ansehen →</a>
      </div>
    </div>
  {:else if current}
    <div class="progress-bar">
      <p class="progress">{position + 1} / {items.length}</p>
      <progress max={items.length} value={position + 1}></progress>
    </div>

    {#if current.kind === 'vocab-card'}
      <SingleFlashcard
        entry={current.entry}
        face={current.face}
        source={current.source}
        onRated={rateVocab}
      />
    {:else if current.kind === 'drill'}
      {#key current.item.lessonId + ':' + current.item.exercise.id}
        <DrillItemRunner
          item={current.item}
          onAdvance={onDrillAdvance}
        />
      {/key}
    {:else if current.kind === 'fehlerbuch'}
      {#key current.entry.key}
        <FehlerbuchReview externalEntries={[current.entry]} onItemRated={onFehlerbuchRated} />
      {/key}
    {/if}
  {/if}
</div>

<style>
  .daily-mix-runner { display: flex; flex-direction: column; padding: 1rem 0 2rem; }
  .status { color: #6b7280; text-align: center; padding: 2rem 0; }

  .progress-bar { display: flex; flex-direction: column; gap: 0.4rem; align-items: center; margin-bottom: 1rem; }
  .progress { color: #6b7280; font-size: 0.875rem; margin: 0; }
  progress { width: 100%; max-width: 26rem; height: 0.5rem; border: none; }
  progress::-webkit-progress-bar { background: #e5e7eb; border-radius: 999px; }
  progress::-webkit-progress-value { background: #2563eb; border-radius: 999px; }

  .empty { text-align: center; padding: 3rem 1rem; }
  .empty h2 { margin: 0 0 0.5rem; color: #1a1a1a; }
  .empty p { color: #6b7280; margin: 0 0 1.5rem; }

  .error { text-align: center; padding: 3rem 1rem; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca; max-width: 32rem; margin: 0 auto; }
  .error h2 { margin: 0 0 0.5rem; color: #b91c1c; font-size: 1.05rem; }
  .error p { color: #7f1d1d; margin: 0; }

  .btn-primary {
    display: inline-block;
    padding: 0.6rem 1.4rem;
    border-radius: 8px;
    background: #2563eb;
    color: #fff;
    text-decoration: none;
    font-weight: 600;
    border: none;
    cursor: pointer;
    font-family: inherit;
    font-size: 1rem;
  }
  .btn-primary:hover { background: #1d4ed8; }
  .btn-secondary {
    display: inline-block;
    padding: 0.6rem 1.4rem;
    border-radius: 8px;
    background: #fff;
    color: #2563eb;
    text-decoration: none;
    font-weight: 600;
    border: 1.5px solid #2563eb;
    cursor: pointer;
    font-family: inherit;
    font-size: 1rem;
  }
  .btn-secondary:hover { background: #eff6ff; }

  .summary { display: flex; flex-direction: column; align-items: center; gap: 1rem; text-align: center; padding: 2rem 1rem; }
  .summary h2 { margin: 0; color: #1a1a1a; }
  .summary-count { color: #374151; margin: 0; font-size: 1.05rem; }
  .summary-tally { display: flex; gap: 1.5rem; flex-wrap: wrap; justify-content: center; }
  .tally-block h3 { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin: 0 0 0.5rem; }
  .tally-block p { margin: 0; color: #374151; font-weight: 600; }
  .chips { display: flex; gap: 0.3rem; flex-wrap: wrap; justify-content: center; }
  .chip { padding: 0.2rem 0.55rem; border-radius: 999px; font-size: 0.78rem; font-weight: 600; background: #f3f4f6; }
  .chip-again { color: #dc2626; }
  .chip-hard  { color: #d97706; }
  .chip-good  { color: #2563eb; }
  .chip-easy  { color: #16a34a; }

  .summary-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; justify-content: center; margin-top: 1rem; }
</style>
