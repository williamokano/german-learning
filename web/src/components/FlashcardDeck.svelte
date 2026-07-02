<script lang="ts">
  import { onMount } from 'svelte';
  import type { VocabEntryType } from '@core/content/vocab';
  import { possibleCards, deckKey, type FlashCard } from '@core/content/flashcards';
  import { srs, flashcardSession, type Rating, type FlashcardSession } from '@core/index';

  let {
    lessonEntries,
    cumulativeEntries,
    deckLessonId,
  }: {
    lessonEntries: VocabEntryType[];
    cumulativeEntries: VocabEntryType[];
    deckLessonId: string;
  } = $props();

  let mounted = $state(false);
  let session: FlashcardSession | null = $state(null);
  let cardMap: Map<string, FlashCard> = $state(new Map());
  let flipped = $state(false);

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const mode: 'lesson' | 'cumulative' = params.get('mode') === 'cumulative' ? 'cumulative' : 'lesson';
    const entries = mode === 'cumulative' ? cumulativeEntries : lessonEntries;
    cardMap = possibleCards(entries);

    let s = flashcardSession.getOrStart(deckKey(deckLessonId, mode), entries);
    // Defensive: if the lesson's vocab.yml changed since this session was saved,
    // drop stale card keys rather than crash on a missing lookup.
    const validKeys = s.cardKeys.filter(k => cardMap.has(k));
    if (validKeys.length !== s.cardKeys.length) {
      const droppedBeforePosition = s.cardKeys.slice(0, s.position).filter(k => !cardMap.has(k)).length;
      s = { ...s, cardKeys: validKeys, position: Math.max(0, s.position - droppedBeforePosition) };
    }
    session = s;
    mounted = true;
  });

  const total = $derived(session?.cardKeys.length ?? 0);
  const finished = $derived(session != null && total > 0 && session.position >= total);
  const currentKey = $derived(session && !finished ? session.cardKeys[session.position] : undefined);
  const currentCard = $derived(currentKey ? cardMap.get(currentKey) : undefined);

  const tally = $derived.by(() => {
    const t: Record<Rating, number> = { again: 0, hard: 0, good: 0, easy: 0 };
    if (!session) return t;
    for (const r of Object.values(session.sessionRatings)) t[r]++;
    return t;
  });

  function withArticle(entry: VocabEntryType): string {
    return entry.article ? `${entry.article} ${entry.de}` : entry.de;
  }

  function front(card: FlashCard): string {
    if (card.face === 'meaning-de-en') return withArticle(card.entry);
    if (card.face === 'meaning-en-de') return card.entry.en;
    return card.entry.de; // article face: bare word, guess the article
  }

  function back(card: FlashCard): string {
    if (card.face === 'meaning-de-en') return card.entry.en;
    if (card.face === 'meaning-en-de') return withArticle(card.entry);
    return withArticle(card.entry) + (card.entry.plural ? ` · Plural: ${card.entry.plural}` : '');
  }

  function articleClass(entry: VocabEntryType): string {
    if (entry.article === 'der') return 'article-der';
    if (entry.article === 'die') return 'article-die';
    if (entry.article === 'das') return 'article-das';
    return '';
  }

  function rate(rating: Rating): void {
    if (!session || !currentCard) return;
    srs.recordRating(currentCard.key, rating);
    session = flashcardSession.rate(session, currentCard.key, rating);
    flipped = false;
    if (session.position >= session.cardKeys.length) {
      flashcardSession.complete(session.deckKey);
    }
  }

  function restart(): void {
    if (!session) return;
    const mode: 'lesson' | 'cumulative' = session.deckKey.endsWith(':cumulative') ? 'cumulative' : 'lesson';
    const entries = mode === 'cumulative' ? cumulativeEntries : lessonEntries;
    session = flashcardSession.restart(session.deckKey, entries);
    flipped = false;
  }
</script>

<div class="flashcard-deck">
  {#if !mounted}
    <p class="status">Lade …</p>
  {:else if total === 0}
    <p class="status">Für dieses Deck gibt es keine Karten.</p>
  {:else if finished}
    <div class="summary">
      <h2>Fertig! 🎉</h2>
      <p class="summary-count">{total} Karten wiederholt</p>
      <div class="summary-tally">
        <span class="tally-chip tally-again">Again {tally.again}</span>
        <span class="tally-chip tally-hard">Hard {tally.hard}</span>
        <span class="tally-chip tally-good">Good {tally.good}</span>
        <span class="tally-chip tally-easy">Easy {tally.easy}</span>
      </div>
      <button type="button" class="btn-restart" onclick={restart}>Nochmal</button>
    </div>
  {:else if session && currentCard}
    <p class="progress">{session.position + 1} / {total}</p>

    <button
      type="button"
      class="card"
      class:article-der={flipped && currentCard.face === 'article' && currentCard.entry.article === 'der'}
      class:article-die={flipped && currentCard.face === 'article' && currentCard.entry.article === 'die'}
      class:article-das={flipped && currentCard.face === 'article' && currentCard.entry.article === 'das'}
      onclick={() => (flipped = !flipped)}
    >
      {#if !flipped && currentCard.face === 'article'}
        <span class="card-label">Welcher Artikel?</span>
      {/if}
      <span class="card-text">{flipped ? back(currentCard) : front(currentCard)}</span>
      {#if flipped && currentCard.face !== 'article' && currentCard.entry.example}
        <span class="card-example">{currentCard.entry.example}</span>
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
  {/if}
</div>

<style>
  .flashcard-deck { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 1rem 0 2rem; }
  .status { color: #6b7280; }
  .progress { color: #6b7280; font-size: 0.875rem; margin: 0; }

  .card {
    width: 100%;
    max-width: 26rem;
    min-height: 10rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1.5rem;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    background: #fff;
    cursor: pointer;
    font: inherit;
    text-align: center;
    transition: border-color 0.15s, background 0.15s;
  }
  .card:hover { border-color: #2563eb; }
  .card-label { font-size: 0.8rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
  .card-text { font-size: 1.5rem; font-weight: 600; }
  .card-example { font-size: 0.9rem; color: #374151; font-style: italic; }

  .card.article-der { border-color: #2563eb; background: #eff6ff; }
  .card.article-die { border-color: #dc2626; background: #fee2e2; }
  .card.article-das { border-color: #16a34a; background: #dcfce7; }

  .flip-hint { color: #6b7280; font-size: 0.875rem; margin: 0; }

  .rating-buttons { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; }
  .btn-rate {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: 1.5px solid #e5e7eb;
    background: #fff;
    font-weight: 600;
    cursor: pointer;
  }
  .btn-rate:hover { border-color: #2563eb; background: #eff6ff; }
  .btn-again { color: #dc2626; }
  .btn-hard  { color: #d97706; }
  .btn-good  { color: #2563eb; }
  .btn-easy  { color: #16a34a; }

  .summary { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; text-align: center; }
  .summary-count { color: #374151; margin: 0; }
  .summary-tally { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; }
  .tally-chip { padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.8rem; font-weight: 600; background: #f3f4f6; }
  .tally-again { color: #dc2626; }
  .tally-hard  { color: #d97706; }
  .tally-good  { color: #2563eb; }
  .tally-easy  { color: #16a34a; }

  .btn-restart {
    margin-top: 0.5rem;
    padding: 0.6rem 1.4rem;
    border-radius: 8px;
    border: none;
    background: #2563eb;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
  }
  .btn-restart:hover { background: #1d4ed8; }
</style>
