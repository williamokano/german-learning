<script lang="ts">
  import type { VocabEntryType } from '@core/content/vocab';
  import type { CardFace } from '@core/content/flashcards';
  import type { Rating } from '@core/index';

  // Single-card display for the F9 Daily Mix orchestrator (issue #344). Extracted
  // from FlashcardDeck.svelte's display JSX (no session/storage/routing concerns —
  // the orchestrator handles those). Caller passes the entry, face, and a rating
  // callback that persists via `srs.recordRating(...)`.

  let { entry, face, source, onRated }:
    { entry: VocabEntryType; face: CardFace; source: 'new' | 'due'; onRated: (rating: Rating) => void; } = $props();

  let flipped = $state(false);

  function withArticle(e: VocabEntryType): string {
    return e.article ? `${e.article} ${e.de}` : e.de;
  }

  function frontText(): string {
    if (face === 'meaning-de-en') return withArticle(entry);
    if (face === 'meaning-en-de') return entry.en;
    return entry.de; // article face: bare word, guess the article
  }

  function backText(): string {
    if (face === 'meaning-de-en') return entry.en;
    if (face === 'meaning-en-de') return withArticle(entry);
    return withArticle(entry) + (entry.plural ? ` · Plural: ${entry.plural}` : '');
  }

  function articleClass(): string {
    if (entry.article === 'der') return 'article-der';
    if (entry.article === 'die') return 'article-die';
    if (entry.article === 'das') return 'article-das';
    return '';
  }

  function rate(rating: Rating): void {
    flipped = false;
    onRated(rating);
  }
</script>

<div class="single-flashcard">
  {#if source === 'new'}
    <p class="badge badge-new">Neu</p>
  {:else}
    <p class="badge badge-due">Wiederholung</p>
  {/if}

  <button
    type="button"
    class="card"
    class:article-der={flipped && face === 'article' && entry.article === 'der'}
    class:article-die={flipped && face === 'article' && entry.article === 'die'}
    class:article-das={flipped && face === 'article' && entry.article === 'das'}
    onclick={() => (flipped = !flipped)}
  >
    {#if !flipped && face === 'article'}
      <span class="card-label">Welcher Artikel?</span>
    {/if}
    <span class="card-text">{flipped ? backText() : frontText()}</span>
    {#if flipped && face !== 'article' && entry.example}
      <span class="card-example">{entry.example}</span>
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
    <p class="flip-hint">Klicke die Karte, um die Antwort zu sehen.</p>
  {/if}
</div>

<style>
  .single-flashcard { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 1rem 0 2rem; }
  .badge { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.15rem 0.5rem; border-radius: 999px; font-weight: 600; margin: 0; }
  .badge-new { background: var(--brand-100); color: var(--brand-700); }
  .badge-due { background: var(--warn-bg); color: var(--warn-fg); }

  .card {
    color: var(--text);
    width: 100%;
    max-width: 26rem;
    min-height: 10rem;
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
  .card-text { font-size: 1.5rem; font-weight: 600; }
  .card-example { font-size: 0.9rem; color: var(--text-muted); font-style: italic; }

  .card.article-der { border-color: var(--brand-500); background: var(--brand-50); }
  .card.article-die { border-color: var(--err-border); background: var(--err-bg); }
  .card.article-das { border-color: var(--ok-border); background: var(--ok-bg); }

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
</style>
