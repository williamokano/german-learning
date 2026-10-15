<script lang="ts">
  import { onMount } from 'svelte';
  import { fehlerbuch } from '@core/index';
  import type { FehlerbuchEntry, ConfusionPair } from '@core/index';
  import type { Rating } from '@core/engine/sm2';

  // No FlashcardSessionService / resume here — mirrors the "deep review always
  // rebuilds fresh" precedent already established for flashcards' deep-review deck.
  //
  // `externalEntries` (F9, Daily Mix) — when the caller has already curated the
  // entry list (e.g. picked the exact K due items), skip the internal startReview()
  // call and use the prop instead. Confusion pairs are still computed locally;
  // they're derived from ALL stored mistakes, so a curated slice doesn't change them.
  // `onItemRated` fires after each rate() so an outer orchestrator (Daily Mix) can
  // advance its own position counter — without this the orchestrator would wait
  // forever since FehlerbuchReview manages its own internal position.
  let { externalEntries = null, onItemRated = null }:
    { externalEntries?: FehlerbuchEntry[] | null; onItemRated?: ((rating: Rating) => void) | null } = $props();

  let mounted = $state(false);
  let entries: FehlerbuchEntry[] = $state([]);
  let confusionPairs: ConfusionPair[] = $state([]);
  let position = $state(0);
  let flipped = $state(false);

  function load(): void {
    entries = externalEntries ?? fehlerbuch.startReview();
    confusionPairs = fehlerbuch.getConfusionPairs();
    position = 0;
    flipped = false;
  }

  onMount(() => {
    load();
    mounted = true;
  });

  const total = $derived(entries.length);
  const finished = $derived(mounted && total > 0 && position >= total);
  const current = $derived(!finished ? entries[position] : undefined);

  function rate(rating: Rating): void {
    if (!current) return;
    fehlerbuch.rate(current.key, rating);
    position += 1;
    flipped = false;
    if (onItemRated) onItemRated(rating);
  }
</script>

<div class="fehlerbuch-review">
  <div class="deck">
    {#if !mounted}
      <p class="status">Lade …</p>
    {:else if total === 0}
      <p class="status">Keine Fehler zum Wiederholen — weiter so! 🎉</p>
    {:else if finished}
      <div class="summary">
        <h2>Fertig! 🎉</h2>
        <p class="summary-count">{total} Fehler wiederholt</p>
        <button type="button" class="btn-restart" onclick={load}>Nochmal</button>
      </div>
    {:else if current}
      <p class="progress">{position + 1} / {total}</p>
      <p class="context">{current.lessonId} · Übung {current.exerciseId}</p>

      <button type="button" class="card" onclick={() => (flipped = !flipped)}>
        {#if !flipped}
          <span class="card-label">Deine Antwort</span>
          <span class="card-text">{current.given}</span>
        {:else}
          <span class="card-label">Richtig wäre</span>
          <span class="card-text correct">{current.expected}</span>
          {#if current.note}
            <span class="card-note">{current.note}</span>
          {/if}
        {/if}
      </button>

      {#if flipped}
        <div class="rating-buttons">
          <button type="button" class="btn-rate btn-again" onclick={() => rate('again')}>Again</button>
          <button type="button" class="btn-rate btn-hard" onclick={() => rate('hard')}>Hard</button>
          <button type="button" class="btn-rate btn-good" onclick={() => rate('good')}>Good</button>
          <button type="button" class="btn-rate btn-easy" onclick={() => rate('easy')}>Easy</button>
        </div>
      {:else}
        <p class="flip-hint">Klicke die Karte, um die richtige Antwort zu sehen.</p>
      {/if}
    {/if}
  </div>

  {#if mounted && confusionPairs.length > 0}
    <div class="confusion-pairs">
      <h3>Häufige Verwechslungen</h3>
      <ul>
        {#each confusionPairs as pair}
          <li>{pair.a} ↔ {pair.b} <span class="pair-count">({pair.count}×)</span></li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
  .fehlerbuch-review { display: flex; flex-direction: column; gap: 2rem; padding: 1rem 0 2rem; }
  .deck { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
  .status { color: var(--text-subtle); }
  .progress { color: var(--text-subtle); font-size: 0.875rem; margin: 0; }
  .context { color: var(--text-faint); font-size: 0.8rem; margin: 0; }

  .card {
    width: 100%;
    max-width: 26rem;
    min-height: 8rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1.5rem;
    border: 2px solid var(--border);
    border-radius: 12px;
    background: var(--surface);
    cursor: pointer;
    font: inherit;
    text-align: center;
    transition: border-color 0.15s, background 0.15s;
  }
  .card:hover { border-color: var(--brand-500); }
  .card-label { font-size: 0.8rem; color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.05em; }
  .card-text { font-size: 1.4rem; font-weight: 600; }
  .card-text.correct { color: var(--ok-fg); }
  .card-note { font-size: 0.85rem; color: var(--text-subtle); font-style: italic; }

  .flip-hint { color: var(--text-subtle); font-size: 0.875rem; margin: 0; }

  .rating-buttons { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; }
  .btn-rate {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: 1.5px solid var(--border);
    background: var(--surface);
    font-weight: 600;
    cursor: pointer;
  }
  .btn-rate:hover { border-color: var(--brand-500); background: var(--brand-50); }
  .btn-again { color: var(--err-fg); }
  .btn-hard  { color: var(--warn-fg); }
  .btn-good  { color: var(--brand-600); }
  .btn-easy  { color: var(--ok-fg); }

  .summary { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; text-align: center; }
  .summary-count { color: var(--text-muted); margin: 0; }
  .btn-restart {
    margin-top: 0.5rem;
    padding: 0.6rem 1.4rem;
    border-radius: 8px;
    border: none;
    background: var(--brand-600);
    color: var(--text-invert);
    font-weight: 600;
    cursor: pointer;
  }
  .btn-restart:hover { background: var(--brand-700); }

  .confusion-pairs { border-top: 1px solid var(--border); padding-top: 1.25rem; }
  .confusion-pairs h3 { margin: 0 0 0.5rem; font-size: 1rem; }
  .confusion-pairs ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.35rem; }
  .confusion-pairs li { font-size: 0.925rem; color: var(--text-muted); }
  .pair-count { color: var(--text-faint); font-size: 0.85rem; }
</style>
